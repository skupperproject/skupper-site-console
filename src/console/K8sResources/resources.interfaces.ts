export interface OwnerReference {
  name: string;
  kind: string;
  uid: string;
  apiVersion: string;
  controller?: boolean;
  blockOwnerDeletion?: boolean;
}

export interface ObjectMetadata {
  annotations?: {
    [key: string]: string;
  };
  clusterName?: string;
  creationTimestamp?: string;
  deletionGracePeriodSeconds?: number;
  deletionTimestamp?: string;
  finalizers?: string[];
  generateName?: string;
  generation?: number;
  labels?: {
    [key: string]: string;
  };
  name?: string;
  namespace?: string;
  ownerReferences?: OwnerReference[];
  resourceVersion?: string;
  uid?: string;
}

export interface K8sResourceCommon {
  apiVersion?: string;
  kind?: string;
  metadata?: ObjectMetadata;
  code?: number;
}

export interface K8sResourceConfigMapData {
  ingress: string;
  name: string;
}

export interface K8sResourceSiteStatusData {
  recType: 'SITE';
  identity: string;
  startTime: number;
  endTime: number;
  source: string;
  platform: 'kubernetes' | 'podman';
  name: string;
  nameSpace: string;
  siteVersion: string;
  policy: 'disabled' | 'enabled';
}

export interface K8sResourceRouterData {
  recType: 'ROUTER';
  identity: string;
  parent: string;
  startTime: number;
  endTime: number;
  source: string;
  name: string;
  namespace: string;
  imageName: string;
  imageVersion: string;
  hostname: string;
  buildVersion: string;
}

export interface K8sResourceLinkData {
  recType: 'LINK';
  identity: string;
  parent: string;
  startTime: string;
  endTime: string;
  source: string;
  mode: string;
  name: string;
  linkCost: string;
  direction: string;
}

export interface K8sResourceListenerData {
  recType: 'LISTENER';
  identity: string;
  parent: string;
  startTime: string;
  endTime: string;
  source: string;
  name: string;
  destHost: string;
  destPort: string;
  protocol: string;
  address: string;
  addressId: string;
}

export interface K8sResourceConnectorData {
  recType: 'CONNECTOR';
  identity: string;
  parent: string;
  startTime: string;
  endTime: string;
  destHost: string;
  destPort: string;
  protocol: string;
  address: string;
  target: string;
  processId: string;
  addressId: string;
}

export interface K8sResourceNetworkStatusData {
  addresses: Record<string, unknown> | null;

  siteStatus:
    | {
        site: K8sResourceSiteStatusData;
        routerStatus:
          | {
              router: K8sResourceRouterData;
              links: K8sResourceLinkData[];
              listeners: K8sResourceListenerData[] | null;
              connectors: K8sResourceConnectorData[] | null;
            }[]
          | null;
      }[]
    | null;
}

export interface K8sResourceNetworkStatusResponse {
  NetworkStatus?: string;
}

export interface K8sResourceNetworkStatusConfigMap extends K8sResourceCommon {
  data?: K8sResourceNetworkStatusResponse;
}

export interface K8sResourceConfigMap extends K8sResourceCommon {
  data?: K8sResourceConfigMapData;
}

export interface K8sResourceConfigMapList extends K8sResourceConfigMap {
  items: K8sResourceConfigMap[];
}

export interface K8sResourceOperatorGroup extends K8sResourceCommon {
  spec: {
    targetNamespaces: string[];
  };
}

export interface K8sResourceSecret extends K8sResourceCommon {
  data?: Record<string, unknown>;
}

export interface K8sResourceSecretList extends K8sResourceCommon {
  items: K8sResourceSecret[] | K8sResourceToken[] | K8sResourceLink[];
}

export interface K8sResourceToken extends Omit<K8sResourceSecret, 'annotation'> {
  metadata: ObjectMetadata & {
    annotation: {
      'skupper.io/claim-expiration': string;
      'skupper.io/claims-made'?: string;
      'skupper.io/claims-remaining': string;
      'skupper.io/site-version': string;
    };
  };
}

export interface K8sResourceLink extends Omit<K8sResourceSecret, 'annotation'> {
  metadata: ObjectMetadata & {
    annotation: {
      'internal.skupper.io/last-failed': string;
      'internal.skupper.io/status': string;
      'skupper.io/cost': string;
      'skupper.io/url': string;
      'skupper.io/generated-by': string;
    };
  };
}

export interface K8sResourceOperatorGroupList extends K8sResourceCommon {
  items: K8sResourceOperatorGroup[];
}

export interface K8sResourceSubscription extends K8sResourceCommon {
  spec: {
    channel: string;
    installPlanApproval: string;
    name: 'skupper-operator';
    source: string;
    sourceNamespace: string;
    startingCSV: string;
  };
}

export interface K8sResourceSubscriptionList extends K8sResourceCommon {
  items: K8sResourceSubscription[];
}

export interface K8sResourceListener {
  address: string;
  protocol?: string;
  ports: number[];
  exposeIngress: '';
  targets: K8sResourceServiceTargetConfigMap[];
  origin?: string;
}

export type K8sResourceListenerParams = Record<string, string>;
export type K8sResourceConnectorParams = Record<string, string>;

export interface K8sResourceServicesConfigMap extends K8sResourceCommon {
  data?: Record<string, string>;
}

export interface K8sResourceServiceTargetConfigMap {
  routingKey: string;
  selector: string;
  targetPorts: Record<string, number>;
  namespace: string;
}
