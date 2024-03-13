import { useState, FC, useCallback } from 'react';

import { Form, FormGroup, TextInput, Popover, ActionGroup, Button, FormAlert, Alert } from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons/dist/esm/icons/help-icon';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { RESTApi } from '@API/REST.api';
import { HTTPError } from '@API/REST.interfaces';
import { I18nNamespace } from '@config/config';
import { getSkupperNamespace } from '@config/db';
import { K8sResourceConfigMap, K8sResourceServiceTargetConfigMap } from '@K8sResources/resources.interfaces';

type SubmitFunction = (data: K8sResourceConfigMap) => void;

type CancelFunction = () => void;

const ConnectorForm: FC<{
  onSubmit: SubmitFunction;
  onCancel: CancelFunction;
}> = function ({ onSubmit, onCancel }) {
  const { t } = useTranslation(I18nNamespace);

  const [validated, setValidated] = useState<string | undefined>();
  const [routingKey, setRoutingKey] = useState('');
  const [selector, setSelector] = useState('');
  const [targetPorts, setTargetPorts] = useState<number>();

  const mutationCreateSite = useMutation({
    mutationFn: (data: K8sResourceServiceTargetConfigMap) => RESTApi.editServiceTargetsConfigMap(data),
    onError: (data: HTTPError) => {
      setValidated(data.descriptionMessage);
    },
    onSuccess: onSubmit
  });

  const handleChangeSelector = (value: string) => {
    setSelector(value);
  };

  const handleChangeRoutingKey = (value: string) => {
    setRoutingKey(value);
  };

  const handleChangePort = (value: string) => {
    setTargetPorts(value ? Number(value) : undefined);
  };

  const handleSubmit = useCallback(() => {
    if (!selector || !targetPorts || !routingKey) {
      setValidated(t('Fill out all required fields before continuing'));

      return;
    }

    const data: K8sResourceServiceTargetConfigMap = {
      routingKey,
      selector,
      targetPorts: { [targetPorts]: targetPorts },
      namespace: getSkupperNamespace()
    };

    mutationCreateSite.mutate(data);
  }, [mutationCreateSite, routingKey, selector, t, targetPorts]);

  const handleCancel = () => {
    onCancel();
  };

  return (
    <Form isHorizontal>
      {validated && (
        <FormAlert>
          <Alert variant="danger" title={t(validated)} aria-live="polite" isInline />
        </FormAlert>
      )}

      <FormGroup
        fieldId="form-routing-key"
        isRequired
        label={t('Routing key')}
        style={{ gridTemplateColumns: '1fr 4fr' }}
        labelIcon={
          <Popover bodyContent={<div>...</div>}>
            <button type="button" onClick={(e) => e.preventDefault()} className="pf-c-form__group-label-help">
              <HelpIcon />
            </button>
          </Popover>
        }
      >
        <TextInput
          isRequired
          type="text"
          name="simple-form-name-01"
          value={routingKey}
          onChange={handleChangeRoutingKey}
        />
      </FormGroup>

      <FormGroup
        label={t('Selector')}
        style={{ gridTemplateColumns: '1fr 4fr' }}
        labelIcon={
          <Popover bodyContent={<div>....</div>}>
            <button type="button" onClick={(e) => e.preventDefault()} className="pf-c-form__group-label-help">
              <HelpIcon />
            </button>
          </Popover>
        }
        isRequired
        fieldId="simple-form-selector-01"
      >
        <TextInput isRequired type="text" value={selector} onChange={handleChangeSelector} />
      </FormGroup>

      <FormGroup
        label={t('Port')}
        style={{ gridTemplateColumns: '1fr 4fr' }}
        labelIcon={
          <Popover bodyContent={<div>....</div>}>
            <button type="button" onClick={(e) => e.preventDefault()} className="pf-c-form__group-label-help">
              <HelpIcon />
            </button>
          </Popover>
        }
        isRequired
        fieldId="simple-form-port-key-01"
      >
        <TextInput
          isRequired
          type="number"
          value={targetPorts}
          onChange={handleChangePort}
          style={{ minWidth: '100%' }}
        />
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

export default ConnectorForm;
