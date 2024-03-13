import { useState, FC, useCallback } from 'react';

import { Form, FormGroup, TextInput, Popover, ActionGroup, Button, FormAlert, Alert } from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons/dist/esm/icons/help-icon';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { RESTApi } from '@API/REST.api';
import { HTTPError } from '@API/REST.interfaces';
import { I18nNamespace } from '@config/config';
import {
  K8sResourceConfigMap,
  K8sResourceListener,
  K8sResourceListenerParams
} from '@K8sResources/resources.interfaces';

type SubmitFunction = (data: K8sResourceConfigMap) => void;

type CancelFunction = () => void;

const ListenerForm: FC<{
  onSubmit: SubmitFunction;
  onCancel: CancelFunction;
  siteId: string;
}> = function ({ onSubmit, onCancel, siteId }) {
  const { t } = useTranslation(I18nNamespace);

  const [validated, setValidated] = useState<string | undefined>();
  const [routingKey, setRoutingKey] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [port, setPort] = useState<number>();
  const [protocol, setProtocol] = useState('tcp');

  const mutationCreateSite = useMutation({
    mutationFn: (data: K8sResourceListenerParams) => RESTApi.editServiceConfigMap(data),
    onError: (data: HTTPError) => {
      setValidated(data.descriptionMessage);
    },
    onSuccess: onSubmit
  });

  const handleChangeRoutingKey = (value: string) => {
    setRoutingKey(value);
  };

  const handleChangeServiceName = (value: string) => {
    setServiceName(value);
  };

  const handleChangePort = (value: string) => {
    setPort(value ? Number(value) : undefined);
  };

  const handleChangeProtocol = (value: string) => {
    setProtocol(value);
  };

  const handleSubmit = useCallback(() => {
    if (!routingKey || !port || !serviceName) {
      setValidated(t('Fill out all required fields before continuing'));

      return;
    }

    const data: K8sResourceListener = {
      origin: siteId,
      address: routingKey,
      protocol: protocol || 'tcp',
      ports: [port],
      exposeIngress: '',
      targets: []
    };

    mutationCreateSite.mutate({ [routingKey]: JSON.stringify(data) });
  }, [routingKey, port, serviceName, siteId, protocol, mutationCreateSite, t]);

  const handleCancel = () => {
    onCancel();
  };

  return (
    <Form isHorizontal>
      {validated && (
        <FormAlert>
          <Alert variant="danger" title={validated} aria-live="polite" isInline />
        </FormAlert>
      )}

      <FormGroup
        fieldId="form-routing-key"
        isRequired
        label={t('Routing key')}
        style={{ gridTemplateColumns: '1fr 4fr' }}
        labelIcon={
          <Popover bodyContent={<div>....</div>}>
            <button type="button" onClick={(e) => e.preventDefault()} className="pf-c-form__group-label-help">
              <HelpIcon />
            </button>
          </Popover>
        }
      >
        <TextInput isRequired type="text" value={routingKey} onChange={handleChangeRoutingKey} />
      </FormGroup>

      <FormGroup
        fieldId="form-protocol"
        label={t('Protocol')}
        style={{ gridTemplateColumns: '1fr 4fr' }}
        labelIcon={
          <Popover bodyContent={<div>....</div>}>
            <button type="button" onClick={(e) => e.preventDefault()} className="pf-c-form__group-label-help">
              <HelpIcon />
            </button>
          </Popover>
        }
      >
        <TextInput type="text" value={protocol} onChange={handleChangeProtocol} />
      </FormGroup>

      <FormGroup
        fieldId="form-service-name"
        isRequired
        label={t('Service name')}
        style={{ gridTemplateColumns: '1fr 4fr' }}
        labelIcon={
          <Popover bodyContent={<div>....</div>}>
            <button type="button" onClick={(e) => e.preventDefault()} className="pf-c-form__group-label-help">
              <HelpIcon />
            </button>
          </Popover>
        }
      >
        <TextInput isRequired type="text" value={serviceName} onChange={handleChangeServiceName} />
      </FormGroup>

      <FormGroup
        fieldId="form-port"
        isRequired
        label={t('Port')}
        style={{ gridTemplateColumns: '1fr 4fr' }}
        labelIcon={
          <Popover bodyContent={<div>....</div>}>
            <button type="button" onClick={(e) => e.preventDefault()} className="pf-c-form__group-label-help">
              <HelpIcon />
            </button>
          </Popover>
        }
      >
        <TextInput isRequired type="number" value={port} onChange={handleChangePort} style={{ minWidth: '100%' }} />
      </FormGroup>

      <ActionGroup style={{ display: 'flex' }}>
        <Button variant="primary" onClick={handleSubmit}>
          {t('Submit')}
        </Button>
        <Button variant="link" onClick={handleCancel}>
          {t('Cancel')}
        </Button>
      </ActionGroup>
    </Form>
  );
};

export default ListenerForm;
