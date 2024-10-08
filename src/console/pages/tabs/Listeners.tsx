import { useCallback, useState } from 'react';

import {
  Button,
  Modal,
  ModalVariant,
  Alert,
  Stack,
  StackItem,
  AlertActionCloseButton,
  DrawerPanelContent,
  DrawerHead,
  DrawerActions,
  DrawerCloseButton,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  DrawerPanelBody,
  Icon,
  Card,
  CardBody
} from '@patternfly/react-core';
import { CheckCircleIcon, TimesIcon } from '@patternfly/react-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { RESTApi } from '@API/REST.api';
import { I18nNamespace, REFETCH_QUERY_INTERVAL } from '@config/config';
import { QueryKeys } from '@config/reactQuery';
import SkTable from '@core/components/SkTable';
import StatusCell from '@core/components/StatusCell';
import { Listener } from '@interfaces/REST.interfaces';
import { SKColumn, SKComponentProps } from '@interfaces/SkTable.interfaces';

import ListenerDetails from './ListenerDetails';
import ListenerForm from '../components/forms/ListenerForm';

const Listeners = function () {
  const { t } = useTranslation(I18nNamespace);

  const [isOpen, setIsOpen] = useState<boolean>();
  const [showAlert, setShowAlert] = useState<string>(sessionStorage.getItem('showListenerAlert') || 'show');
  const [nameSelected, setNameSelected] = useState<string | undefined>();

  const { data: listeners, refetch } = useQuery({
    queryKey: [QueryKeys.GetListeners],
    queryFn: () => RESTApi.getListenersView(),
    refetchInterval: REFETCH_QUERY_INTERVAL
  });

  const mutationDelete = useMutation({
    mutationFn: (name: string) => RESTApi.deleteListener(name),
    onSuccess: () => {
      handleCloseDetails();
      refetch();
    }
  });

  const handleDelete = useCallback(
    (name: string) => {
      mutationDelete.mutate(name);
    },
    [mutationDelete]
  );

  const handleModalClose = useCallback(() => {
    setIsOpen(undefined);
  }, []);

  const handleModalSubmit = useCallback(() => {
    handleModalClose();
    refetch();
  }, [handleModalClose, refetch]);

  const handleOpenDetails = useCallback((name: string) => {
    setNameSelected(name);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setNameSelected(undefined);
  }, []);

  const handleCloseAlert = useCallback(() => {
    setShowAlert('hide');
    sessionStorage.setItem('showListenerAlert', 'hide');
  }, []);

  const Columns: SKColumn<Listener>[] = [
    {
      name: t('Name'),
      prop: 'name',
      customCellName: 'linkCell'
    },
    {
      name: t('Routing key'),
      prop: 'routingKey'
    },
    {
      name: t('Service name'),
      prop: 'serviceName'
    },
    {
      name: t('Port'),
      prop: 'port'
    },
    {
      name: t('Status'),
      prop: 'status',
      customCellName: 'StatusCell'
    },
    {
      name: t('Connectors'),
      prop: 'connected'
    },
    {
      name: '',
      customCellName: 'actions',
      modifier: 'fitContent'
    }
  ];

  const customCells = {
    linkCell: ({ data }: SKComponentProps<Listener>) => (
      <Button variant="link" onClick={() => handleOpenDetails(data.name)}>
        {data.name}
      </Button>
    ),

    StatusCell,

    connectedCell: ({ value }: SKComponentProps<Listener>) => (
      <Icon isInline status={value ? 'success' : 'danger'}>
        {value ? <CheckCircleIcon /> : <TimesIcon />}
      </Icon>
    ),

    actions: ({ data }: SKComponentProps<Listener>) => (
      <Button onClick={() => handleDelete(data.name)} variant="link">
        {t('Delete')}
      </Button>
    )
  };

  const panelContent = (
    <DrawerPanelContent isResizable minSize="30%">
      <DrawerHead>
        <DrawerActions>
          <DrawerCloseButton onClick={handleCloseDetails} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelBody>
        {nameSelected && <ListenerDetails name={nameSelected} onUpdate={handleModalSubmit} />}
      </DrawerPanelBody>
    </DrawerPanelContent>
  );

  return (
    <Card isPlain isFullHeight>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            {showAlert === 'show' && (
              <Alert
                hidden={true}
                variant="info"
                isInline
                actionClose={<AlertActionCloseButton onClose={handleCloseAlert} />}
                title={t(
                  'A listener is a local connection endpoint that is associated with remote servers. Listeners expose a host and port for accepting connections. Listeners use a routing key to forward connection data to remote connectors.'
                )}
              />
            )}
          </StackItem>

          <StackItem isFilled>
            <Button onClick={() => setIsOpen(true)}>{t('Create a listener')}</Button>
            <Drawer isExpanded={!!nameSelected} isInline>
              <DrawerContent panelContent={panelContent}>
                <DrawerContentBody>
                  <SkTable
                    columns={Columns}
                    rows={listeners || []}
                    alwaysShowPagination={false}
                    customCells={customCells}
                    isPlain
                  />
                </DrawerContentBody>
              </DrawerContent>
            </Drawer>
          </StackItem>
        </Stack>

        <Modal
          hasNoBodyWrapper
          isOpen={!!isOpen}
          variant={ModalVariant.medium}
          aria-label="Form create listener"
          showClose={false}
        >
          <ListenerForm onSubmit={handleModalSubmit} onCancel={handleModalClose} title={t('Create a listener')} />
        </Modal>
      </CardBody>
    </Card>
  );
};

export default Listeners;
