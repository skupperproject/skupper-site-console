import { FC, useCallback, useState } from 'react';

import {
  Card,
  CardHeader,
  CardBody,
  Title,
  Button,
  Modal,
  ModalVariant,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Alert,
  Icon
} from '@patternfly/react-core';
import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { RESTApi } from '@API/REST.api';
import { Link } from '@API/REST.interfaces';
import { I18nNamespace } from '@config/config';
import SkTable from '@core/components/SkTable';
import { SKColumn, SKComponentProps } from '@core/components/SkTable/SkTable.interfaces';
import { K8sResourceLink } from '@K8sResources/resources.interfaces';

import LinkForm from './components/CreateLinkForm';
import TokenForm from './components/CreateTokenForm';

const Links: FC<{ siteId: string }> = function ({ siteId }) {
  const { t } = useTranslation(I18nNamespace);

  const [modalType, setModalType] = useState<'link' | 'token' | undefined>();
  const [isTokenModalOpen, setIsTokenModalOpen] = useState<boolean | undefined>();

  const { data: links, refetch: refetchLocalLinks } = useQuery({
    queryKey: ['get-links-query'],
    queryFn: () =>
      RESTApi.getSecrets({
        query: 'labelSelector=skupper.io/type=connection-token'
      })
  });

  const { data: claimLinks, refetch: refetchLocalClaimLinks } = useQuery({
    queryKey: ['get-claim-links-query'],
    queryFn: () =>
      RESTApi.getSecrets({
        query: 'labelSelector=skupper.io/type=token-claim'
      })
  });

  const { data: remoteLinks, refetch: refetchRemoteLinks } = useQuery({
    queryKey: ['get-remote-links-query'],
    queryFn: () => RESTApi.getRemoteLinks()
  });

  // const { data: tokens, refetch: refetchTokens } = useQuery({
  //   queryKey: ['get-tokens-query'],
  //   queryFn: () => RESTApi.getSecrets({ query: 'labelSelector=skupper.io/type=connection-token' })
  // });

  const mutation = useMutation({
    mutationFn: (name: string) => RESTApi.deleteSecret(name),
    onSuccess: () => {
      setTimeout(() => {
        refetchLocalLinks();
        refetchLocalClaimLinks();
        refetchRemoteLinks();
      }, 1000);
    }
  });

  // const tokenMutation = useMutation({
  //   mutationFn: (name: string) => RESTApi.deleteSecret(name),
  //   onSuccess: () => {
  //     setTimeout(() => {
  //       refetchTokens();
  //     }, 1000);
  //   }
  // });

  function handleDeleteLink(name: string) {
    mutation.mutate(name);
  }

  // function handleDeleteToken(name: string) {
  //   tokenMutation.mutate(name);
  // }

  const handleRefreshLinks = () => {
    setTimeout(() => {
      refetchLocalLinks();
      refetchLocalClaimLinks();
      refetchRemoteLinks();
    }, 1000);

    handleModalClose();
  };

  const handleModalClose = () => {
    setModalType(undefined);
  };

  const handleTokenModalClose = () => {
    setIsTokenModalOpen(false);
  };

  const handleTokenSubmit = useCallback(() => {
    handleTokenModalClose();
  }, []);

  // useEffect(() => {
  //   if (isTokenModalOpen === false) {
  //     refetchTokens();
  //   }
  // }, [isTokenModalOpen, refetchTokens]);

  // const tokenColumns: SKColumn<Token>[] = [
  //   {
  //     name: t('Name'),
  //     prop: 'name'
  //   },
  //   {
  //     name: t('Claims made'),
  //     prop: 'claimsRemaining'
  //   },
  //   {
  //     name: t('Claims remaining'),
  //     prop: 'claimsRemaining'
  //   },
  //   {
  //     name: t('Claim expires at'),
  //     prop: 'claimExpiration'
  //   },

  //   {
  //     name: '',
  //     customCellName: 'actions',
  //     modifier: 'fitContent'
  //   }
  // ];

  const localLinkColumns: SKColumn<Link>[] = [
    {
      name: t('Name'),
      prop: 'name'
    },
    {
      name: t('Status'),
      prop: 'status',
      customCellName: 'status'
    },
    {
      name: t('Linked to'),
      prop: 'connectedTo'
    },
    {
      name: t('Cost'),
      prop: 'cost'
    },
    {
      name: '',
      customCellName: 'actions',
      modifier: 'fitContent'
    }
  ];

  const remoteLinkColumns: SKColumn<{ connectedTo: string | null }>[] = [
    {
      name: t('Linked to'),
      prop: 'connectedTo'
    }
  ];

  const customCells = {
    status: ({ data }: SKComponentProps<Link>) => {
      if (!data.status) {
        return (
          <span>
            <Icon isInline status="success">
              <CheckCircleIcon />
            </Icon>{' '}
            {t('Active')}
          </span>
        );
      }

      return (
        <span>
          <Icon status="danger" isInline>
            <ExclamationCircleIcon />
          </Icon>{' '}
          {data.status}
        </span>
      );
    },

    actions: ({ data }: SKComponentProps<Link>) => (
      <Button onClick={() => handleDeleteLink(data.name)} variant="link">
        {t('Delete')}
      </Button>
    )
  };

  // const tokenCustomCells = {
  //   actions: ({ data }: SKComponentProps<Token>) => (
  //     <Button onClick={() => handleDeleteToken(data.name)} variant="secondary">
  //       {t('Delete')}
  //     </Button>
  //   )
  // };

  return (
    <>
      <Card isPlain>
        <CardHeader>
          <Title headingLevel="h1">{t('Links created from the site')}</Title>
        </CardHeader>

        <CardBody>
          <Alert
            variant="info"
            isInline
            title={t(
              'Links enable communication between sites. Once sites are linked, they form a Skupper network. Click create token button to generate a downloadable token file for linking a remote site.'
            )}
          />

          <Toolbar>
            <ToolbarContent className="pf-u-pl-0">
              <ToolbarItem>
                <Button onClick={() => setModalType('link')}>{t('Create link')}</Button>
              </ToolbarItem>
              <ToolbarItem>
                <Button variant="secondary" onClick={() => setIsTokenModalOpen(true)}>
                  {t('Create token')}
                </Button>
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>

          <SkTable
            columns={localLinkColumns}
            rows={parseLink(
              ([...(links?.items || []), ...(claimLinks?.items || [])].filter(
                (item) => item.metadata?.annotations && item.metadata.annotations['skupper.io/generated-by'] !== siteId
              ) || []) as K8sResourceLink[]
            )}
            customCells={customCells}
            alwaysShowPagination={false}
            isPlain
          />
        </CardBody>
      </Card>

      <Modal title={t('Create link')} isOpen={!!modalType} variant={ModalVariant.medium} onClose={handleModalClose}>
        <LinkForm onSubmit={handleRefreshLinks} onCancel={handleModalClose} siteId={siteId} />
      </Modal>

      <Card isPlain>
        <CardHeader>
          <Title headingLevel="h1">{t('Links from remote sites')}</Title>
        </CardHeader>

        <CardBody>
          <SkTable
            columns={remoteLinkColumns}
            rows={
              remoteLinks?.map((link) => ({
                connectedTo: extractSiteNameFromUrl(link.name, '', '-skupper-router')
              })) || []
            }
            alwaysShowPagination={false}
            isPlain
          />
        </CardBody>
      </Card>

      <Modal
        title={t('Create link')}
        isOpen={!!isTokenModalOpen}
        variant={ModalVariant.medium}
        onClose={handleTokenModalClose}
      >
        <TokenForm onSubmit={handleTokenSubmit} onCancel={handleTokenModalClose} />
      </Modal>
    </>
  );
};

// function parseToken(tokens: K8sResourceToken[]): Token[] {
//   return tokens.map((token) => {
//     const creationTimestamp = token.metadata?.creationTimestamp as string;
//     const id = token.metadata?.uid as string;
//     const name = token.metadata?.name as string;

//     const claimsMade = token.metadata?.annotations?.['skupper.io/claims-made'] as string;
//     const claimsRemaining = token.metadata?.annotations?.['skupper.io/claims-remaining'] as string;
//     const claimExpiration = token.metadata?.annotations?.['skupper.io/claim-expiration'] as string;

//     return {
//       claimsMade,
//       claimsRemaining,
//       claimExpiration,
//       creationTimestamp,
//       name,
//       id
//     };
//   });
// }

function parseLink(links: K8sResourceLink[]): Link[] {
  return links.map((link) => {
    const id = link.metadata?.uid as string;
    const name = link.metadata?.name as string;
    const creationTimestamp = link.metadata?.creationTimestamp as string;

    const cost = link.metadata?.annotations?.['skupper.io/cost'] as string;
    const status = link.metadata?.annotations?.['internal.skupper.io/status'] as string;
    const connectedTo = extractSiteNameFromUrl(link.metadata?.annotations?.['edge-host'] || '') as string;

    return {
      connectedTo,
      cost,
      status,
      creationTimestamp,
      name,
      id
    };
  });
}

function extractSiteNameFromUrl(url: string, prefix = 'skupper-edge-', suffix = '.skupper') {
  const regexPattern = new RegExp(`${prefix}(.*?)${suffix}`);
  const match = url.match(regexPattern);

  return match ? match[1] : null;
}

export default Links;
