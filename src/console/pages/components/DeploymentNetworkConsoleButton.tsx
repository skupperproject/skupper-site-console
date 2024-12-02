import { useEffect, useState } from 'react';

import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { Button, Flex } from '@patternfly/react-core';
import { CubesIcon } from '@patternfly/react-icons';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { RESTApi } from '@API/REST.api';
import { I18nNamespace } from '@config/config';
import { getSkupperNamespace } from '@config/db';
import ExternalLink from '@core/components/ExternalLink';

const groupVersionKind = {
  group: 'route.openshift.io',
  version: 'v1',
  kind: 'Route'
};

const groupVersionKindPod = {
  group: '',
  version: 'v1',
  kind: 'Pod'
};

const ROUTE = 'network-console';
const POD_SELECTOR = { 'app.kubernetes.io/name': 'network-console-collector' };
const POD_LOADED_STATUS = 'Running';

const DeploymentNetworkConsoleButton = function () {
  const { t } = useTranslation(I18nNamespace);
  const [url, setUrl] = useState<string | undefined>();

  const watchResource = {
    groupVersionKind,
    namespace: getSkupperNamespace(),
    isList: false,
    name: ROUTE
  };

  const watchResourcePod = {
    groupVersionKind: groupVersionKindPod,
    namespace: getSkupperNamespace(),
    isList: false,
    selector: {
      matchLabels: POD_SELECTOR
    }
  };

  const [data] = useK8sWatchResource(watchResource) as any;
  const [deployment] = useK8sWatchResource(watchResourcePod) as any;

  const mutationCreate = useMutation({
    mutationFn: () => RESTApi.createDeployment()
  });

  const mutationDelete = useMutation({
    mutationFn: () => RESTApi.deleteDeployment(),
    onSuccess: () => {
      setUrl(undefined);
    }
  });

  const handleDeployConsole = async () => {
    mutationCreate.mutate();
  };

  const handleDeleteConsole = async () => {
    mutationDelete.mutate();
  };

  useEffect(() => {
    if (data?.status) {
      const newUrl = data?.spec?.host ? `${data?.spec?.port.targetPort}://${data?.spec?.host}` : undefined;
      setUrl(newUrl);
    }
  }, [data?.spec?.host, data?.spec?.port.targetPort, data?.status]);

  const loaded = deployment?.status?.phase === POD_LOADED_STATUS && url;

  return (
    <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
      {!loaded && (
        <Button
          isDisabled={!!url && !!deployment?.status && !(deployment?.status?.phase === POD_LOADED_STATUS)}
          onClick={handleDeployConsole}
          isLoading={url && deployment?.status && !(deployment?.status?.phase === POD_LOADED_STATUS)}
          icon={<CubesIcon />}
        >
          {t('Deploy the Network Console')}
        </Button>
      )}

      {loaded && <ExternalLink href={url} text={t('Open the Network Console')} />}
      {loaded && (
        <Button onClick={handleDeleteConsole} variant="secondary" icon={<CubesIcon />}>
          {t('Delete the Network Console')}
        </Button>
      )}
    </Flex>
  );
};

export default DeploymentNetworkConsoleButton;
