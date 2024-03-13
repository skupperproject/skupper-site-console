import { useState, FC } from 'react';

import {
  Form,
  FormGroup,
  TextInput,
  Popover,
  ActionGroup,
  Button,
  FormAlert,
  Alert,
  FormSelect,
  FormSelectOption
} from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons/dist/esm/icons/help-icon';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { RESTApi } from '@API/REST.api';
import { I18nNamespace } from '@config/config';
import { getConfigMap } from '@K8sResources/resources';
import { K8sResourceConfigMap, K8sResourceConfigMapData } from '@K8sResources/resources.interfaces';

type validate = 'success' | 'warning' | 'error' | 'default';

enum SiteFormLabels {
  Name = 'Name',
  Ingress = 'Ingress',
  ErrorMessage = 'Fill out all required fields before continuing'
}

const options = [
  { value: 'route', label: 'route', disabled: false },
  { value: 'nodeport', label: 'nodeport', disabled: false },
  { value: 'loadbalancer', label: 'loadbalancer', disabled: false },
  { value: 'none', label: 'none', disabled: false }
];

type SubmitFunction = (data: K8sResourceConfigMap) => void;

type CancelFunction = () => void;

const SiteForm: FC<{
  onSubmit: SubmitFunction;
  onCancel: CancelFunction;
  properties?: K8sResourceConfigMapData;
  siteName?: string;
  show?: { ingress?: boolean; name?: boolean };
}> = function ({ onSubmit, onCancel, properties, siteName, show = { ingress: true, name: true } }) {
  const { t } = useTranslation(I18nNamespace);

  const [validated, setValidated] = useState<validate>('default');
  const [name, setName] = useState(properties?.name || '');
  const [ingress, setIngress] = useState(properties?.ingress || options[0].value);

  const mutationCreateSite = useMutation({
    mutationFn: (data: K8sResourceConfigMap) =>
      siteName ? RESTApi.editSite(siteName, data) : RESTApi.createSite(data),
    onSuccess: onSubmit
  });

  const handleNameChange = (newName: string) => {
    setName(newName);
  };

  const handleIngressChange = (newIngress: string) => {
    setIngress(newIngress);
  };

  const handleSubmit = () => {
    const attributes = {
      name,
      ingress
    };

    if (!name) {
      setValidated('error');

      return;
    }

    mutationCreateSite.mutate({ ...getConfigMap(), data: attributes });
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <Form isHorizontal>
      {validated === 'error' && (
        <FormAlert>
          <Alert variant="danger" title={SiteFormLabels.ErrorMessage} aria-live="polite" isInline />
        </FormAlert>
      )}
      {show.name && (
        <FormGroup
          label={SiteFormLabels.Name}
          style={{ gridTemplateColumns: '1fr 4fr' }}
          labelIcon={
            <Popover bodyContent={<div>The site's name. By default, the name corresponds to the namespace</div>}>
              <button
                type="button"
                aria-label="More info for name field"
                onClick={(e) => e.preventDefault()}
                aria-describedby="simple-form-name-01"
                className="pf-c-form__group-label-help"
              >
                <HelpIcon />
              </button>
            </Popover>
          }
          isRequired
          fieldId="simple-form-name-01"
        >
          <TextInput
            isRequired
            type="text"
            id="simple-form-name-01"
            name="simple-form-name-01"
            aria-describedby="simple-form-name-01-helper"
            value={name}
            onChange={handleNameChange}
          />
        </FormGroup>
      )}

      {show.ingress && (
        <FormGroup
          label={SiteFormLabels.Ingress}
          style={{ gridTemplateColumns: '1fr 4fr' }}
          labelIcon={
            <Popover
              bodyContent={
                <div>
                  An ingress serves as an entry point, managing external access to services in a network or cluster. The
                  targeted site for the link must have an ingress point to accept a connection.
                </div>
              }
            >
              <button
                type="button"
                aria-label="More info for name field"
                onClick={(e) => e.preventDefault()}
                aria-describedby="simple-form-name-01"
                className="pf-c-form__group-label-help"
              >
                <HelpIcon />
              </button>
            </Popover>
          }
          fieldId="simple-form-Ingress-01"
        >
          <FormSelect value={ingress} onChange={handleIngressChange} aria-label="FormSelect Input">
            {options.map((option, index) => (
              <FormSelectOption isDisabled={option.disabled} key={index} value={option.value} label={option.label} />
            ))}
          </FormSelect>
        </FormGroup>
      )}

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

export default SiteForm;
