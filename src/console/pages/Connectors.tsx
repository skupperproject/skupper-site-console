import { useState } from 'react';

import { Button, Modal, ModalVariant, Alert, Stack, StackItem, AlertActionCloseButton } from '@patternfly/react-core';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { RESTApi } from '@API/REST.api';
import { Connector } from '@API/REST.interfaces';
import { I18nNamespace } from '@config/config';
import SkTable from '@core/components/SkTable';
import { SKColumn } from '@core/components/SkTable/SkTable.interfaces';

import ConnectorForm from './components/CreateConnectorForm';

const Connectors = function () {
  const { t } = useTranslation(I18nNamespace);

  const [isOpen, setIsOpen] = useState<boolean>();
  const [showAlert, setShowAlert] = useState<boolean>(true);

  const { data: connectors, refetch: refetch } = useQuery({
    queryKey: ['get-connectors-query'],
    queryFn: () => RESTApi.getConnectors()
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

  if (!connectors) {
    return null;
  }

  const Columns: SKColumn<Connector>[] = [
    {
      name: t('Routing key'),
      prop: 'routingKey'
    },
    {
      name: t('Host'),
      prop: 'host'
    },
    {
      name: t('Protocol'),
      prop: 'protocol'
    },
    {
      name: t('Pod selector'),
      prop: 'selector'
    },
    {
      name: t('Pod Port'),
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
              actionClose={<AlertActionCloseButton onClose={() => setShowAlert(false)} />}
              isInline
              title={t(
                'A connector binds local servers (pods, containers, or processes) to connection listeners in remote sites. Connectors are linked to listeners by a matching routing key.'
              )}
            />
          )}
        </StackItem>

        <StackItem>
          <Button onClick={() => setIsOpen(true)}>{t('Create a connector')}</Button>
          <SkTable columns={Columns} rows={connectors} alwaysShowPagination={false} isPlain />
        </StackItem>
      </Stack>

      <Modal title={t('Create a Connector')} isOpen={!!isOpen} variant={ModalVariant.medium} onClose={handleModalClose}>
        <ConnectorForm onSubmit={handleRefresh} onCancel={handleModalClose} />
      </Modal>
    </>
  );
};

export default Connectors;
