import {
  K8sResourceConfigMap,
  K8sResourceOperatorGroup,
  K8sResourceSecret,
  K8sResourceSubscription
} from './resources.interfaces';

export const getConfigMap = (): K8sResourceConfigMap => ({
  apiVersion: 'v1',
  kind: 'ConfigMap',
  metadata: {
    name: 'skupper-site'
  }
});

export const createOperatorGroup = (namespace: string): K8sResourceOperatorGroup => ({
  kind: 'OperatorGroup',
  apiVersion: 'operators.coreos.com/v1',
  metadata: {
    name: 'skupper-operator',
    namespace
  },
  spec: {
    targetNamespaces: [namespace]
  }
});

export const createSubscription = (namespace: string): K8sResourceSubscription => ({
  apiVersion: 'operators.coreos.com/v1alpha1',
  kind: 'Subscription',
  metadata: {
    name: 'skupper-operator',
    namespace
  },
  spec: {
    channel: 'alpha',
    installPlanApproval: 'Automatic',
    name: 'skupper-operator',
    source: 'community-operators',
    sourceNamespace: 'openshift-marketplace',
    startingCSV: 'skupper-operator.v1.6.0'
  }
});

export const createTokenRequest = (name: string): K8sResourceSecret => ({
  kind: 'Secret',
  apiVersion: 'v1',
  metadata: {
    name,
    labels: {
      'skupper.io/type': 'connection-token-request'
    }
  }
});
