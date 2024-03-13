import { FC, useState } from 'react';

import {
  DescriptionList,
  DescriptionListTerm,
  DescriptionListGroup,
  DescriptionListDescription,
  PageSection,
  Card,
  CardHeader,
  CardBody,
  Timestamp,
  Title,
  Button,
  Modal,
  ModalVariant,
  Flex,
  FlexItem
} from '@patternfly/react-core';
import { PenIcon } from '@patternfly/react-icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { RESTApi } from '@API/REST.api';
import { I18nNamespace, skupperSiteConfigMapName } from '@config/config';

import SiteForm from './components/CreateSiteForm';
import DeleteSiteButton from './components/DeleteSiteButton';

const Details: FC<{ onGoTo: (page: number) => void; onDeleteSite: (name: undefined) => void }> = function ({
  onGoTo,
  onDeleteSite
}) {
  const { t } = useTranslation(I18nNamespace);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleModalPros, setVisibleModalProps] = useState<Record<string, boolean>>({});

  const { data: site, refetch } = useQuery({
    queryKey: ['find-site-query'],
    queryFn: () => RESTApi.findSite()
  });

  const handleOpenModal = (props: Record<string, boolean>) => {
    setIsModalOpen(true);
    setVisibleModalProps(props);
  };

  const handleSubmit = () => {
    setTimeout(() => {
      refetch();
    }, 0);

    handleClose();
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  if (!site) {
    return null;
  }

  return (
    <PageSection>
      <Card isPlain>
        <CardHeader>
          <Flex style={{ width: '100%' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
            <FlexItem>
              <Title headingLevel="h1">{t('Site settings')}</Title>
            </FlexItem>
            <FlexItem>
              <DeleteSiteButton onClick={onDeleteSite} />
            </FlexItem>
          </Flex>
        </CardHeader>

        <CardBody>
          <DescriptionList
            columnModifier={{
              default: '2Col'
            }}
          >
            <DescriptionListGroup>
              <DescriptionListTerm>Name</DescriptionListTerm>
              <DescriptionListDescription>
                {site.name}{' '}
                <Button variant="plain" onClick={() => handleOpenModal({ name: true })} icon={<PenIcon />} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Ingress</DescriptionListTerm>
              <DescriptionListDescription>
                {site.ingress}{' '}
                <Button variant="plain" onClick={() => handleOpenModal({ ingress: true })} icon={<PenIcon />} />
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </CardBody>
      </Card>

      <Card isPlain>
        <CardHeader>
          <Title headingLevel="h1">{t('Status')}</Title>
        </CardHeader>

        <CardBody>
          <DescriptionList
            columnModifier={{
              default: '2Col'
            }}
          >
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Linked sites')}</DescriptionListTerm>
              <DescriptionListDescription>
                <Button variant="link" isInline onClick={() => onGoTo(3)}>
                  {t('remoteSiteWithCount', { count: site.linkCount })}
                </Button>
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </CardBody>
      </Card>

      <Card isPlain>
        <CardHeader>
          <Title headingLevel="h1">{t('Properties')}</Title>
        </CardHeader>

        <CardBody>
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Controller version')}</DescriptionListTerm>
              <DescriptionListDescription>{`${site.controllerVersion}`}</DescriptionListDescription>
            </DescriptionListGroup>

            <DescriptionListGroup>
              <DescriptionListTerm>{t('Router version')}</DescriptionListTerm>
              <DescriptionListDescription>{`${site.routerVersion}`}</DescriptionListDescription>
            </DescriptionListGroup>

            <DescriptionListGroup>
              <DescriptionListTerm>{t('Created at')}</DescriptionListTerm>
              <DescriptionListDescription>
                <Timestamp date={new Date(site.creationTimestamp)} />
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </CardBody>
      </Card>

      <Modal title={t('Edit site')} variant={ModalVariant.medium} isOpen={isModalOpen} onClose={handleClose}>
        <SiteForm
          show={visibleModalPros}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          properties={{ name: site.name as string, ingress: site.ingress as string }}
          siteName={skupperSiteConfigMapName}
        />
      </Modal>
    </PageSection>
  );
};

export default Details;
