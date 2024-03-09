import { getSkupperNamespace } from '@config/db';

const K8S_PREFIX_PATH = `/api/kubernetes/`;

const OPERATOR_GROUP_PATH = `${K8S_PREFIX_PATH}apis/operators.coreos.com/v1/namespaces/`;
export const operatorGroupsPath = () => `${OPERATOR_GROUP_PATH}${getSkupperNamespace()}/operatorgroups`;

const SUBSCRIPTION_PATH = `${K8S_PREFIX_PATH}apis/operators.coreos.com/v1alpha1/namespaces/`;
export const subscriptionsPath = () => `${SUBSCRIPTION_PATH}${getSkupperNamespace()}/subscriptions`;

const CONFIG_MAP_PATH = `${K8S_PREFIX_PATH}api/v1/namespaces/`;
export const configMapPath = () => `${CONFIG_MAP_PATH}${getSkupperNamespace()}/configmaps`;
export const configMapPathItem = (name: string) => `${configMapPath()}/${name}`;

const SECRETS_PATH = `${K8S_PREFIX_PATH}api/v1/namespaces/`;
export const secretsPath = () => `${SECRETS_PATH}${getSkupperNamespace()}/secrets`;
export const secretPathItem = (name: string) => `${secretsPath()}/${name}`;

const POD_PATH = `${K8S_PREFIX_PATH}api/v1/namespaces/`;
export const podPath = () => `${POD_PATH}${getSkupperNamespace()}/pods`;

const CLUSTER_SERVICE_VERSION_PATH = `${K8S_PREFIX_PATH}apis/operators.coreos.com/v1alpha1/namespaces/`;
export const clusterVersionPath = () =>
  `${CLUSTER_SERVICE_VERSION_PATH}${getSkupperNamespace()}/clusterserviceversions`;
