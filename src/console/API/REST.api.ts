import {
  skupperNetworkStatusConfigMapName,
  skupperServicesConfigMapName,
  skupperSiteConfigMapName
} from '@config/config';
import { getSkupperNamespace } from '@config/db';
import { createOperatorGroup, createSubscription } from '@K8sResources/resources';
import {
  K8sResourceConfigMap,
  K8sResourceConnectorData,
  K8sResourceLink,
  K8sResourceLinkData,
  K8sResourceListener,
  K8sResourceListenerData,
  K8sResourceListenerParams,
  K8sResourceNetworkStatusConfigMap,
  K8sResourceNetworkStatusData,
  K8sResourceOperatorGroup,
  K8sResourceOperatorGroupList,
  K8sResourceSecret,
  K8sResourceSecretList,
  K8sResourceServicesConfigMap,
  K8sResourceServiceTargetConfigMap,
  K8sResourceSubscription,
  K8sResourceSubscriptionList,
  K8sResourceToken
} from '@K8sResources/resources.interfaces';

import { axiosFetch } from './apiMiddleware';
import { Connector, Listener, Site } from './REST.interfaces';
import {
  clusterVersionPath,
  configMapPath,
  configMapPathItem,
  operatorGroupsPath,
  podPath,
  secretPathItem,
  secretsPath,
  subscriptionsPath
} from './REST.paths';

export const RESTApi = {
  checkIfExistOrInstallOperator: async (): Promise<boolean> => {
    const operatorGroup = await RESTApi.checkIfExistOrInstallOperatorGroup();
    const subscription = await RESTApi.checkIfExistOrInstallSubscription();

    return operatorGroup && subscription;
  },

  checkIfExistOrInstallOperatorGroup: async (): Promise<boolean> => {
    const operators = await RESTApi.getOperatorGroups();
    if (!operators.items.length) {
      const operator = await RESTApi.createOperatorGroup();

      if (!operator.metadata?.uid) {
        return false;
      }
    }

    return true;
  },

  getOperatorGroups: async (): Promise<K8sResourceOperatorGroupList> => {
    const response = await axiosFetch<K8sResourceOperatorGroupList>(operatorGroupsPath());

    return response;
  },

  createOperatorGroup: async (): Promise<K8sResourceOperatorGroup> => {
    const response = await axiosFetch<K8sResourceOperatorGroup>(operatorGroupsPath(), {
      method: 'POST',
      data: createOperatorGroup(getSkupperNamespace())
    });

    return response;
  },

  checkIfExistOrInstallSubscription: async (): Promise<boolean> => {
    const subscriptions = await RESTApi.getSubscriptions();

    const skupperOperator = subscriptions.items.find((item) => item.metadata?.name?.includes('skupper-operator'));
    if (!skupperOperator) {
      const subscription = await RESTApi.createSubscription();

      if (!subscription.metadata?.uid) {
        return false;
      }
    }

    return true;
  },

  getSubscriptions: async (): Promise<K8sResourceSubscriptionList> => {
    const response = await axiosFetch<K8sResourceSubscriptionList>(subscriptionsPath());

    return response;
  },

  createSubscription: async (): Promise<K8sResourceSubscription> => {
    const response = await axiosFetch<K8sResourceSubscription>(subscriptionsPath(), {
      method: 'POST',
      data: createSubscription(getSkupperNamespace())
    });

    return response;
  },

  deleteSubscription: async (): Promise<void> => {
    await axiosFetch<void>(`${subscriptionsPath()}/skupper-operator`, {
      method: 'DELETE'
    });

    await axiosFetch<void>(`${clusterVersionPath()}/skupper-operator.v1.6.0`, {
      method: 'DELETE'
    });
  },

  createSite: async (data?: K8sResourceConfigMap): Promise<K8sResourceConfigMap> => {
    const response = await axiosFetch<K8sResourceConfigMap>(configMapPath(), {
      method: 'POST',
      data
    });

    return response;
  },

  editSite: async (name: string, data?: K8sResourceConfigMap): Promise<K8sResourceConfigMap> => {
    const response = await axiosFetch<K8sResourceConfigMap>(configMapPathItem(name), {
      method: 'PUT',
      data
    });

    return response;
  },

  deleteSite: async (name: string): Promise<K8sResourceConfigMap> => {
    await RESTApi.deleteSubscription();

    const response = await axiosFetch<K8sResourceConfigMap>(configMapPathItem(name), {
      method: 'DELETE'
    });

    return response;
  },

  findConfigMap: async (
    name: string = skupperSiteConfigMapName
  ): Promise<K8sResourceConfigMap | K8sResourceServicesConfigMap | null> => {
    const configMap = (await axiosFetch<K8sResourceConfigMap | K8sResourceServicesConfigMap>(configMapPathItem(name), {
      validateStatus: function (status) {
        return (status >= 200 && status < 300) || status === 404;
      }
    })) as K8sResourceConfigMap;

    if (configMap?.code === 404) {
      return null;
    }

    return configMap;
  },

  findNetworkStatusConfigMap: async (): Promise<K8sResourceNetworkStatusConfigMap | null> => {
    const configMap = await axiosFetch<K8sResourceNetworkStatusConfigMap>(
      configMapPathItem(skupperNetworkStatusConfigMapName),
      {
        validateStatus: function (status) {
          return (status >= 200 && status < 300) || status === 404;
        }
      }
    );

    if (configMap?.code === 404) {
      return null;
    }

    return configMap;
  },

  findSite: async (): Promise<Site | null> => {
    const [siteConfigMap, networkStatusConfigMap] = await Promise.all([
      RESTApi.findConfigMap(),
      RESTApi.findNetworkStatusConfigMap()
    ]);

    if (!siteConfigMap && !networkStatusConfigMap) {
      return null;
    }

    return convertK8sConfigMapsToSite(networkStatusConfigMap, siteConfigMap as K8sResourceConfigMap);
  },

  getLinks: async (): Promise<K8sResourceLinkData[]> => {
    const networkStatusConfigMap = await RESTApi.findNetworkStatusConfigMap();

    if (!networkStatusConfigMap) {
      return [];
    }

    return convertK8sConfigMapsToLinks(networkStatusConfigMap);
  },

  getSecrets: async (options?: { query?: string }): Promise<K8sResourceSecretList> => {
    const response = await axiosFetch<K8sResourceSecretList>(`${secretsPath()}?${options?.query ?? ''}`);

    return response;
  },

  getRemoteLinks: async (): Promise<K8sResourceLinkData[] | null> => {
    const networkStatusConfigMap = await RESTApi.findNetworkStatusConfigMap();

    if (!networkStatusConfigMap?.data?.NetworkStatus) {
      return null;
    }

    const networkStatus = JSON.parse(networkStatusConfigMap.data?.NetworkStatus) as K8sResourceNetworkStatusData;
    const siteStatus = networkStatus?.siteStatus?.find((obj) => obj.site.nameSpace === getSkupperNamespace());
    const links = siteStatus?.routerStatus?.find((obj) => obj.router.namespace === getSkupperNamespace())?.links || [];

    return links.filter((link) => link.direction === 'incoming');
  },

  findSecret: async (name: string): Promise<K8sResourceSecret> => {
    const secret = await axiosFetch<K8sResourceSecret>(secretPathItem(name), {
      validateStatus: function (status) {
        return (status >= 200 && status < 300) || status === 404;
      }
    });

    return secret;
  },

  createLink: async (data?: K8sResourceLink): Promise<K8sResourceLink> => {
    const response = await axiosFetch<K8sResourceLink>(secretsPath(), {
      method: 'POST',
      data
    });

    return response;
  },

  deleteSecret: async (name: string): Promise<K8sResourceLink | K8sResourceToken> => {
    const response = await axiosFetch<K8sResourceLink>(secretPathItem(name), {
      method: 'DELETE'
    });

    return response;
  },

  createToken: async (data?: K8sResourceSecret): Promise<K8sResourceSecret> => {
    const response = await axiosFetch<K8sResourceSecret>(secretsPath(), {
      method: 'POST',
      data
    });

    // await axiosFetch<K8sResourceSecret>(`${secretsPath()}/${response.metadata?.name}`, {
    //   method: 'DELETE'
    // });

    return response;
  },

  getListeners: async (): Promise<Listener[] | null> => {
    const networkStatusConfigMap = await RESTApi.findNetworkStatusConfigMap();

    if (!networkStatusConfigMap?.data?.NetworkStatus) {
      return null;
    }

    const networkStatus = JSON.parse(networkStatusConfigMap.data?.NetworkStatus) as K8sResourceNetworkStatusData;
    const siteStatus = networkStatus?.siteStatus?.find((obj) => obj.site.nameSpace === getSkupperNamespace());
    const listeners =
      siteStatus?.routerStatus?.find((obj) => obj.router.namespace === getSkupperNamespace())?.listeners || [];

    return convertK8sResourceListenerDataToListener(listeners);
  },

  editServiceConfigMap: async (service: K8sResourceListenerParams): Promise<any> => {
    const configMap = await RESTApi.findConfigMap(skupperServicesConfigMapName);

    if (!configMap) {
      return null;
    }

    const configMapServices = configMap as K8sResourceServicesConfigMap;
    const response = await axiosFetch<any>(configMapPathItem(skupperServicesConfigMapName), {
      method: 'PUT',
      data: { ...configMapServices, data: { ...configMapServices.data, ...service } }
    });

    return response;
  },

  editServiceTargetsConfigMap: async (target: K8sResourceServiceTargetConfigMap): Promise<any> => {
    const podData = await axiosFetch<any>(podPath(), {
      params: { labelSelector: target.selector }
    });

    if (!podData?.items?.length) {
      return Promise.reject({
        message: 'No pods found with the given selector',
        descriptionMessage: 'No pods found with the given selector'
      });
    }

    const configMap = await RESTApi.findConfigMap(skupperServicesConfigMapName);

    if (!configMap?.data) {
      return null;
    }
    const listener = configMap as K8sResourceServicesConfigMap;

    if (!listener?.data || !listener?.data[target.routingKey]) {
      return Promise.reject({
        message: 'No routing key found',
        descriptionMessage: 'No routing key found'
      });
    }

    const service = JSON.parse(listener.data[target.routingKey]) as K8sResourceListener;
    service.targets.push(target);
    service.origin = 'annotation';

    const response = await axiosFetch<any>(configMapPathItem(skupperServicesConfigMapName), {
      method: 'PUT',
      data: { ...configMap, data: { ...configMap.data, [target.routingKey]: JSON.stringify(service) } }
    });

    return response;
  },

  getConnectors: async (): Promise<Connector[] | null> => {
    const networkStatusConfigMap = await RESTApi.findNetworkStatusConfigMap();

    if (!networkStatusConfigMap?.data?.NetworkStatus) {
      return null;
    }

    const networkStatus = JSON.parse(networkStatusConfigMap.data?.NetworkStatus) as K8sResourceNetworkStatusData;
    const siteStatus = networkStatus?.siteStatus?.find((obj) => obj.site.nameSpace === getSkupperNamespace());
    const connectors =
      siteStatus?.routerStatus?.find((obj) => obj.router.namespace === getSkupperNamespace())?.connectors || [];

    return convertK8sResourceConnectorDataToListener(connectors);
  },

  findConnectors: async (): Promise<Connector[] | null> => {
    const networkStatusConfigMap = await RESTApi.findNetworkStatusConfigMap();

    if (!networkStatusConfigMap?.data?.NetworkStatus) {
      return null;
    }

    return JSON.parse(networkStatusConfigMap.data?.NetworkStatus).connectors;
  }
};

// utils
function convertK8sConfigMapsToSite(
  networkStatusConfig: K8sResourceNetworkStatusConfigMap | null,
  siteConfig: K8sResourceConfigMap | null
): Site {
  const networkStatus = networkStatusConfig?.data?.NetworkStatus
    ? (JSON.parse(networkStatusConfig.data.NetworkStatus) as K8sResourceNetworkStatusData)
    : null;

  const siteStatus = networkStatus?.siteStatus?.find((obj) => obj.site.nameSpace === getSkupperNamespace());
  const site = siteStatus?.site;
  const router = siteStatus?.routerStatus?.find((obj) => obj.router.namespace === getSkupperNamespace())?.router;
  const links = siteStatus?.routerStatus?.find((obj) => obj.router.namespace === getSkupperNamespace())?.links || [];

  return {
    identity: siteConfig?.metadata?.uid || '',
    name: siteConfig?.data?.name || '',
    ingress: siteConfig?.data?.ingress || '',
    routerVersion: router?.buildVersion || '',
    controllerVersion: site?.siteVersion || '',
    creationTimestamp: site?.startTime || 0,
    linkCount: links.length
  };
}

function convertK8sConfigMapsToLinks(
  networkStatusConfig: K8sResourceNetworkStatusConfigMap | null
): K8sResourceLinkData[] {
  const networkStatus = networkStatusConfig?.data?.NetworkStatus
    ? (JSON.parse(networkStatusConfig.data.NetworkStatus) as K8sResourceNetworkStatusData)
    : null;

  const siteStatus = networkStatus?.siteStatus?.find((obj) => obj.site.nameSpace === getSkupperNamespace());
  const links = siteStatus?.routerStatus?.find((obj) => obj.router.namespace === getSkupperNamespace())?.links || [];

  return links;
}

function convertK8sResourceListenerDataToListener(listeners: K8sResourceListenerData[]): Listener[] {
  return listeners.map((listener) => ({
    id: listener.identity,
    name: listener.name,
    creationTimestamp: listener.startTime,
    routingKey: listener.name,
    serviceName: listener.name.split(':')[0],
    port: listener.name.split(':')[1],
    protocol: listener.protocol
  }));
}

function convertK8sResourceConnectorDataToListener(connectors: K8sResourceConnectorData[]): Connector[] {
  return connectors.map((connector) => ({
    id: connector.identity,
    host: connector.destHost,
    creationTimestamp: connector.startTime,
    routingKey: connector.address,
    selector: `app=${connector.target.split('-')[0]}`,
    port: connector.destPort,
    protocol: connector.protocol
  }));
}
