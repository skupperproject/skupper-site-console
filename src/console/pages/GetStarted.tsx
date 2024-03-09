import { FC, ReactElement, useCallback, useMemo, useState } from 'react';

import {
  Button,
  ButtonVariant,
  DataList,
  DataListAction,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  Flex,
  FlexItem,
  Modal,
  ModalVariant,
  PageSection,
  Text,
  TextContent
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import { I18nNamespace } from '@config/config';
import ExternalLink from '@core/components/ExternalLink';

import ConnectorForm from './components/CreateConnectorForm';
import LinkForm from './components/CreateLinkForm';
import ListenerForm from './components/CreateListenerForm';
import TokenForm from './components/CreateTokenForm';

enum Actions {
  Token = 'token',
  Link = 'link',
  Listener = 'listener',
  Connector = 'connector'
}

enum GetStartedLabels {
  Intro = 'Skupper is a layer 7 service interconnect. It enables secure communication across Kubernetes clusters with no VPNs or special firewall rules',
  ConsoleDescription = 'Skupper site console is used during network setup. '
}

const GetStarted: FC<{ siteId: string }> = function ({ siteId }) {
  const { t } = useTranslation(I18nNamespace);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [action, setAction] = useState('');

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleOperation = (newAction: string) => {
    setAction(newAction);
    setIsModalOpen(true);
  };

  const ActionFormMap: Record<string, ReactElement> = useMemo(
    () => ({
      [Actions.Token]: <TokenForm onSubmit={handleModalClose} onCancel={handleModalClose} />,
      [Actions.Link]: <LinkForm onSubmit={handleModalClose} onCancel={handleModalClose} siteId={siteId} />,
      [Actions.Listener]: <ListenerForm onSubmit={handleModalClose} onCancel={handleModalClose} siteId={siteId} />,
      [Actions.Connector]: <ConnectorForm onSubmit={handleModalClose} onCancel={handleModalClose} />
    }),
    [handleModalClose, siteId]
  );

  const DetailItem: FC<{
    title: string;
    description: string;
    btnName?: string;
    actionName?: string;
    onClick: (action: string) => void;
  }> = function ({ title, description, actionName, btnName, onClick }) {
    return (
      <DataListItem>
        <DataListItemRow>
          <DataListItemCells
            dataListCells={[
              <DataListCell key={`key=${actionName}`}>
                <Flex spaceItems={{ default: 'spaceItemsMd' }} direction={{ default: 'column' }}>
                  <FlexItem>
                    <TextContent>
                      <Text component="h1">{title}</Text>
                      <Text component="p">{description}</Text>
                    </TextContent>
                  </FlexItem>
                </Flex>
              </DataListCell>,
              <DataListAction
                key={`action-${actionName}`}
                aria-labelledby={`inline-modifier-${actionName}`}
                id={`action-id-${actionName}`}
                aria-label="Actions"
              >
                {actionName && (
                  <DataListCell key="action-content">
                    <Button variant={ButtonVariant.secondary} onClick={() => onClick(actionName)}>
                      {btnName}
                    </Button>
                  </DataListCell>
                )}
              </DataListAction>
            ]}
          />
        </DataListItemRow>
      </DataListItem>
    );
  };

  return (
    <>
      <PageSection>
        <TextContent>
          <Text component="p">
            {GetStartedLabels.Intro}
            <br />
            {GetStartedLabels.ConsoleDescription}

            <ExternalLink href="https://skupper.io/docs/console/index.html" text={t('Learn more about the console')} />
          </Text>
        </TextContent>
      </PageSection>

      <DataList aria-label="get-started-data list">
        <DetailItem
          title="Generating tokens"
          description="A token is required to create a link. The token contains a URL, which locates the ingress of the target site, and a secret, which represents the authority to create a link"
          btnName="Generate a token"
          actionName={Actions.Token}
          onClick={handleOperation}
        />
        <DetailItem
          title="Linking to remote sites"
          description="A link is a site-to-site communication channel. Links serve as a transport for application traffic such as connections and requests. Links are always encrypted using mutual TLS"
          btnName="Create a link"
          actionName={Actions.Link}
          onClick={handleOperation}
        />
        <DetailItem
          title="Expose a service for accepting connections"
          description="Listeners use a routing key to forward connection data to remote connectors"
          btnName="Create a listener"
          actionName={Actions.Listener}
          onClick={handleOperation}
        />
        <DetailItem
          title="Binds local servers to listeners in remote sites"
          description="Connectors are linked to listeners by a matching routing key"
          btnName="Create a connector"
          actionName={Actions.Connector}
          onClick={handleOperation}
        />
      </DataList>

      <PageSection>
        <TextContent>
          <Text component="h1">{t('More information on using Skupper CLI')}</Text>
        </TextContent>
        <br />
        <ExternalLink
          href="https://skupper.io/docs/cli/index.html#creating-using-cli"
          text={t('Creating a site using the CLI')}
        />
        <br />
        <ExternalLink href="https://skupper.io/docs/cli/index.html#linking-sites" text="Linking sites" />
        <br />
        <ExternalLink
          href="https://skupper.io/docs/cli/index.html#exposing-services-ns"
          text={t('Exposing services from a different namespace to the service network')}
        />
        <br />
        <ExternalLink
          href="https://skupper.io/docs/cli/index.html#exposing-services-local"
          text={t('Exposing services on the service network from a local machine')}
        />
      </PageSection>

      <Modal title=" modal" variant={ModalVariant.medium} isOpen={isModalOpen} onClose={handleModalClose}>
        {ActionFormMap[action]}
      </Modal>
    </>
  );
};

export default GetStarted;
