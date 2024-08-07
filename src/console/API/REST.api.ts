import { CR_STATUS_OK, skupperNetworkStatusConfigMapName } from '@config/config';
import { getSkupperNamespace } from '@config/db';
import {
  ClaimCrdParams,
  ClaimCrdResponse,
  ConnectorCrdParams,
  ConnectorCrdResponse,
  GrantCrdResponse,
  GrantParams,
  K8sResourceLinkData,
  K8sResourceNetworkStatusConfigMap,
  K8sResourceNetworkStatusData,
  LinkCrdResponse,
  ListCrdResponse,
  ListenerCrdParams,
  ListenerCrdResponse,
  PartialDeploymentResponse,
  SiteCrdParams,
  SiteCrdResponse
} from '@interfaces/CRD.interfaces';

import { axiosFetch } from './apiMiddleware';
import {
  configMapPathItem,
  deploymentPath,
  sitePath,
  sitesPath,
  grantPath,
  grantsPath,
  linksPath,
  claimsPath,
  claimPath,
  linkPath,
  listenerPath,
  listenersPath,
  connectorsPath,
  connectorPath
} from './REST.paths';
import { Connector, Listener, SiteView } from '../interfaces/REST.interfaces';

export const RESTApi = {
  skupperStatus: async (name: string): Promise<number> => {
    const [skupperInstance, sites] = await Promise.all([
      axiosFetch<PartialDeploymentResponse>(deploymentPath(name)),
      RESTApi.getSites()
    ]);

    // we can have only 1 site per Namespace and we can pick up the first element of the sites array = sites.items[0]
    if (skupperInstance?.code === 404 && !sites.items[0]) {
      return -1;
    }

    if ((skupperInstance?.code === 404 && sites.items[0]) || (skupperInstance.code === 200 && !sites)) {
      return 0;
    }

    const skupperProgresses = skupperInstance.status.conditions;

    if (skupperProgresses[0].status === 'True' && sites.items.length) {
      return 2;
    }

    if (skupperProgresses[0].status === 'True' && !sites.items.length) {
      return -3;
    }

    //reason: ReplicaSetUpdated
    if (skupperProgresses[1].status === 'True') {
      return 1;
    }

    //reason: Deadline exceeded
    if (skupperProgresses[1].status === 'False') {
      return -2;
    }

    return 0;
  },

  findNetworkStatusConfigMap: async (): Promise<K8sResourceNetworkStatusConfigMap | null> => {
    const configMap = await axiosFetch<K8sResourceNetworkStatusConfigMap>(
      configMapPathItem(skupperNetworkStatusConfigMapName)
    );

    if (configMap?.code === 404) {
      return null;
    }

    return configMap;
  },

  findSiteView: async (): Promise<SiteView | null> => {
    const sites = await RESTApi.getSites();

    if (!sites.items.length) {
      return null;
    }

    return convertSiteCRsToSite(sites.items[0]);
  },

  getSites: async (): Promise<ListCrdResponse<SiteCrdResponse>> =>
    axiosFetch<ListCrdResponse<SiteCrdResponse>>(sitesPath()),

  //findSite: async (name: string): Promise<SiteCrdResponse> => axiosFetch<SiteCrdResponse>(sitePath(name)),

  createOrUpdateSite: async (data: SiteCrdParams, name?: string): Promise<SiteCrdResponse> => {
    const path = name ? `${sitePath(name)}` : sitesPath();
    const method = name ? 'PUT' : 'POST';

    const response = await axiosFetch<SiteCrdResponse>(path, {
      method,
      data
    });

    return response;
  },

  deleteSite: async (name: string): Promise<void> => {
    await axiosFetch<SiteCrdResponse>(sitePath(name), {
      method: 'DELETE'
    });
  },

  getGrants: async (): Promise<ListCrdResponse<GrantCrdResponse>> =>
    axiosFetch<ListCrdResponse<GrantCrdResponse>>(grantsPath()),

  findGrant: async (name: string): Promise<GrantCrdResponse> => axiosFetch<GrantCrdResponse>(grantPath(name)),

  createGrant: async (data?: GrantParams): Promise<GrantCrdResponse> =>
    axiosFetch<GrantCrdResponse>(grantsPath(), {
      method: 'POST',
      data
    }),

  deleteGrant: async (name: string): Promise<void> => {
    await axiosFetch<GrantCrdResponse>(grantPath(name), {
      method: 'DELETE'
    });
  },

  getClaims: async (): Promise<ListCrdResponse<ClaimCrdResponse>> =>
    axiosFetch<ListCrdResponse<ClaimCrdResponse>>(claimsPath()),

  findClaim: async (name: string): Promise<ClaimCrdResponse> => axiosFetch<ClaimCrdResponse>(claimPath(name)),

  createClaim: async (data?: ClaimCrdParams): Promise<void> =>
    axiosFetch<void>(claimsPath(), {
      method: 'POST',
      data
    }),

  deleteClaim: async (name: string): Promise<void> => {
    await axiosFetch<ClaimCrdResponse>(claimPath(name), {
      method: 'DELETE'
    });
  },

  getLinks: async (): Promise<ListCrdResponse<LinkCrdResponse>> =>
    axiosFetch<ListCrdResponse<LinkCrdResponse>>(linksPath()),

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

  deleteLink: async (name: string): Promise<void> => {
    await axiosFetch<void>(linkPath(name), {
      method: 'DELETE'
    });

    await axiosFetch<void>(claimPath(name), {
      method: 'DELETE'
    });
  },

  getListeners: async (): Promise<ListCrdResponse<ListenerCrdResponse>> =>
    axiosFetch<ListCrdResponse<ListenerCrdResponse>>(listenersPath()),

  getListenersView: async (): Promise<Listener[] | null> => {
    const [listeners, sites] = await Promise.all([RESTApi.getListeners(), RESTApi.getSites()]);

    if (!listeners.items.length && !sites.items[0]) {
      return null;
    }

    return convertListenerCRsToListeners(sites.items[0], listeners.items);
  },

  findListener: async (name: string): Promise<ListenerCrdResponse> =>
    axiosFetch<ListenerCrdResponse>(listenerPath(name)),

  createOrUpdateListener: async (data?: ListenerCrdParams, name?: string): Promise<void> => {
    const path = name ? `${listenerPath(name)}` : listenersPath();
    const method = name ? 'PUT' : 'POST';

    await axiosFetch<ListenerCrdResponse>(path, {
      method,
      data
    });
  },

  deleteListener: async (name: string): Promise<void> => {
    await axiosFetch<void>(listenerPath(name), {
      method: 'DELETE'
    });
  },

  getConnectors: async (): Promise<ListCrdResponse<ConnectorCrdResponse>> =>
    axiosFetch<ListCrdResponse<ConnectorCrdResponse>>(connectorsPath()),

  getConnectorsView: async (): Promise<Connector[] | null> => {
    const [connectors, sites] = await Promise.all([RESTApi.getConnectors(), RESTApi.getSites()]);

    if (!connectors.items.length && !sites.items[0]) {
      return null;
    }

    return convertConnectorCRsToConnectors(sites.items[0], connectors.items);
  },

  findConnector: async (name: string): Promise<ConnectorCrdResponse> =>
    axiosFetch<ConnectorCrdResponse>(connectorPath(name)),

  createOrUpdateConnector: async (data?: ConnectorCrdParams, name?: string): Promise<void> => {
    const path = name ? `${connectorPath(name)}` : connectorsPath();
    const method = name ? 'PUT' : 'POST';

    await axiosFetch<ConnectorCrdResponse>(path, {
      method,
      data
    });
  },

  deleteConnector: async (name: string): Promise<void> => {
    await axiosFetch<void>(connectorPath(name), {
      method: 'DELETE'
    });
  }
};

// utils
function convertSiteCRsToSite(siteConfig: SiteCrdResponse): SiteView {
  return {
    identity: siteConfig.metadata.uid,
    name: siteConfig.metadata.name,
    linkAccess: siteConfig.spec?.linkAccess || '',
    serviceAccount: siteConfig.spec?.serviceAccount || '',
    ha: siteConfig.spec?.ha || false,
    resourceVersion: siteConfig.metadata.resourceVersion,
    creationTimestamp: new Date(siteConfig.metadata.creationTimestamp).getTime() || 0,
    linkCount: siteConfig.status?.network?.filter(({ id }) => id !== siteConfig.metadata.uid).length || 0,
    isInitialized: !!siteConfig.status?.active,
    isReady: !!siteConfig.status?.sitesInNetwork,
    hasError: !!siteConfig?.status && siteConfig?.status?.status !== CR_STATUS_OK,
    status: siteConfig.status?.status,
    controllerVersion: siteConfig.status?.network ? siteConfig.status?.network[0].version : '',
    sitesInNetwork: siteConfig.status?.sitesInNetwork || 0
  };
}

function convertListenerCRsToListeners(site: SiteCrdResponse, listeners: ListenerCrdResponse[]): Listener[] {
  return listeners.map(({ metadata, spec }) => {
    const connected = findServices(site, spec.routingKey, 'connectors');
    const ready = isReady(site, metadata.name, spec.routingKey, 'listeners');

    return {
      id: metadata.uid,
      name: metadata.name,
      creationTimestamp: metadata.creationTimestamp,
      routingKey: spec.routingKey,
      serviceName: spec.host,
      port: spec.port,
      type: spec.type,
      connected: (ready && connected?.length) || 0
    };
  });
}

function convertConnectorCRsToConnectors(site: SiteCrdResponse, connectors: ConnectorCrdResponse[]): Connector[] {
  return connectors.map(({ metadata, spec }) => {
    const connected = findServices(site, spec.routingKey, 'listeners');
    const ready = isReady(site, metadata.name, spec.routingKey, 'listeners');

    return {
      id: metadata.uid,
      name: metadata.name,
      creationTimestamp: metadata.creationTimestamp,
      routingKey: spec.routingKey,
      selector: spec.selector,
      host: spec.host,
      port: spec.port,
      type: spec.type,
      connected: (ready && connected?.length) || 0
    };
  });
}

function findServices(
  site: SiteCrdResponse,
  routingKey: string,
  type: 'listeners' | 'connectors'
): string[] | undefined {
  return site.status?.network
    ?.filter(({ name, services }) => name !== site.metadata.namespace && services)
    .flatMap((network) => network?.services)
    .filter((service) => service?.routingKey === routingKey && service[type]?.length)
    .flatMap((service) => service![type]) as string[];
}

function isReady(site: SiteCrdResponse, name: string, routingKey: string, type: 'listeners' | 'connectors'): boolean {
  return !!site.status?.network
    ?.filter((data) => data.name !== site.metadata.namespace && data.services)
    .flatMap((network) => network?.services)
    .filter((service) => service && service.routingKey === routingKey && service[type]?.includes(name)).length;
}
