import { FC, useState } from 'react';

import { Button, Modal, ModalVariant, Alert, Stack, StackItem, AlertActionCloseButton } from '@patternfly/react-core';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { RESTApi } from '@API/REST.api';
import { Listener } from '@API/REST.interfaces';
import { I18nNamespace } from '@config/config';
import SkTable from '@core/components/SkTable';
import { SKColumn } from '@core/components/SkTable/SkTable.interfaces';

import ListenerForm from './components/CreateListenerForm';

const Listeners: FC<{ siteId: string }> = function ({ siteId }) {
  const { t } = useTranslation(I18nNamespace);

  const [isOpen, setIsOpen] = useState<boolean>();
  const [showAlert, setShowAlert] = useState<boolean>(true);

  const { data: listeners, refetch: refetch } = useQuery({
    queryKey: ['get-listeners-query'],
    queryFn: () => RESTApi.getListeners()
  });

  const handleRefresh = () => {
    setTimeout(() => {
      refetch();
    }, 1000);

    handleModalClose();
  };

  const handleModalClose = () => {
    setIsOpen(undefined);
  };

  if (!listeners) {
    return null;
  }

  const Columns: SKColumn<Listener>[] = [
    {
      name: t('Name'),
      prop: 'name'
    },
    {
      name: t('Routing key'),
      prop: 'routingKey'
    },
    {
      name: t('Protocol'),
      prop: 'protocol'
    },
    {
      name: t('Service name'),
      prop: 'serviceName'
    },
    {
      name: t('Port'),
      prop: 'port'
    }
  ];

  return (
    <>
      <Stack hasGutter>
        <StackItem>
          {showAlert && (
            <Alert
              hidden={true}
              variant="info"
              isInline
              actionClose={<AlertActionCloseButton onClose={() => setShowAlert(false)} />}
              title={t(
                'A listener is a local connection endpoint that is associated with remote servers. Listeners expose a host and port for accepting connections. Listeners use a routing key to forward connection data to remote connectors.'
              )}
            />
          )}
        </StackItem>

        <StackItem>
          <Button onClick={() => setIsOpen(true)}>{t('Create a listener')}</Button>
          <SkTable columns={Columns} rows={listeners} alwaysShowPagination={false} isPlain />
        </StackItem>
      </Stack>

      <Modal title={t('Create a listener')} isOpen={!!isOpen} variant={ModalVariant.medium} onClose={handleModalClose}>
        <ListenerForm onSubmit={handleRefresh} onCancel={handleModalClose} siteId={siteId} />
      </Modal>
    </>
  );
};

export default Listeners;
