import { createServer, Registry, Request, Response } from 'miragejs';
import type { AnyModels, FactoryDefinition } from 'miragejs/-types';
import type Schema from 'miragejs/orm/schema';

import { configMapPath, operatorGroupsPath, secretsPath, subscriptionsPath } from '@API/REST.paths';
import {
  K8sResourceConfigMap,
  K8sResourceLink,
  K8sResourceNetworkStatusConfigMap,
  K8sResourceSecret,
  K8sResourceSecretList
} from '@K8sResources/resources.interfaces';

type AppRegistry = Registry<AnyModels, Record<string, FactoryDefinition>>;

type AppSchema = Schema<AppRegistry>;

export const MockApi = {
  get500Error: () => new Response(500),
  get503Error: () => new Response(503),
  get404Error: () => new Response(404),

  findSite: (schema: AppSchema, { params }: Request): K8sResourceConfigMap | K8sResourceNetworkStatusConfigMap => {
    if (params.name === 'skupper-network-status') {
      return {
        data: {
          NetworkStatus: networkstatusmock
        }
      } as K8sResourceNetworkStatusConfigMap;
    }

    if (!schema.db.site.length) {
      return { code: 404 };
    }

    return schema.db.site[0] as K8sResourceConfigMap;
  },

  createSite: (schema: AppSchema, { requestBody }: Request): K8sResourceConfigMap => {
    const data = JSON.parse(requestBody) as K8sResourceConfigMap;
    const metadata = { ...data.metadata, resourceVersion: 'X.X.X' };

    return schema.db.site.insert({ ...data, metadata });
  },

  editSite: (schema: AppSchema, { requestBody }: Request): K8sResourceConfigMap => {
    const site = schema.db.site[0];

    const data = JSON.parse(requestBody) as K8sResourceConfigMap;
    const metadata = { ...data.metadata, resourceVersion: 'X.X.X' };

    return schema.db.site.update(site, { ...data, metadata });
  },

  deleteSite: (schema: AppSchema, { params: { name } }: Request): null => {
    schema.db.site.remove(name);

    return null;
  },

  getSecrets: (schema: AppSchema, { url }: Request): K8sResourceSecretList => {
    const match = url.match(/skupper\.io\/type=([^&]+)/);
    const type = match ? match[1] : null;

    const items = schema.db.links.filter(
      (link: K8sResourceLink) => link?.metadata?.labels && link.metadata.labels['skupper.io/type'] === type
    );

    return { items };
  },

  findSecretToken: (schema: AppSchema, { params: { name } }: Request): K8sResourceSecret => {
    if (!schema.db.tokens.length) {
      return { code: 404 };
    }

    return schema.db.tokens.findBy((secret: K8sResourceSecret) => secret?.metadata?.name === name);
  },

  createSecret: (schema: AppSchema, { requestBody }: Request): K8sResourceSecret => {
    const data = JSON.parse(requestBody) as K8sResourceLink;
    if (data?.metadata?.labels && data.metadata.labels['skupper.io/type'] === 'connection-token-request') {
      const name = data?.metadata?.name || `${Math.random() * 100000}`;

      tokenSample.metadata.name = name;
      schema.db.tokens.insert(tokenSample);

      return tokenSample;
    }

    return schema.db.links.insert(data);
  },

  deleteSecret: (schema: AppSchema, { params: { name } }: Request): null => {
    const secretFound = schema.db.links.findBy((secret: K8sResourceSecret) => secret?.metadata?.name === name);
    schema.db.links.remove(secretFound);

    return null;
  }
};

export const MockApiPaths = {
  OperatorGroups: operatorGroupsPath(),
  Subscriptions: subscriptionsPath(),
  ConfigMaps: configMapPath(),
  ConfigMapItem: `${configMapPath()}/:name`,
  Secrets: secretsPath(),
  SecretItem: `${secretsPath()}/:name`
};

export function loadMockServer() {
  return createServer({
    seeds(server) {
      server.db.loadData({
        site: null as K8sResourceConfigMap | null,
        links: [] as K8sResourceLink[],
        tokens: [] as K8sResourceSecret[]
      });
    },
    routes() {
      this.get(MockApiPaths.OperatorGroups, () => ({ items: [{ metadata: { uid: '1' } }] }));
      this.get(MockApiPaths.Subscriptions, () => ({ items: [{ metadata: { name: 'skupper-operator' } }] }));

      this.post(MockApiPaths.ConfigMaps, MockApi.createSite);
      this.put(MockApiPaths.ConfigMapItem, MockApi.editSite);
      this.delete(MockApiPaths.ConfigMapItem, MockApi.deleteSite);
      this.get(MockApiPaths.ConfigMapItem, MockApi.findSite);

      this.get(MockApiPaths.Secrets, MockApi.getSecrets);
      this.post(MockApiPaths.Secrets, MockApi.createSecret);
      this.delete(MockApiPaths.SecretItem, MockApi.deleteSecret);
      this.get(MockApiPaths.SecretItem, MockApi.findSecretToken);

      this.passthrough();
    }
  });
}

const networkstatusmock = `{"addresses":[{"recType":"ADDRESS","identity":"e9cb33f7-49a8-4613-8ba2-b4a933374a52","startTime":1706541879219853,"endTime":0,"name":"adservice:9876","protocol":"tcp","listenerCount":2,"connectorCount":1},{"recType":"ADDRESS","identity":"947a3d79-f3b4-44c3-9e22-e4c211c3df3c","startTime":1706543619281923,"endTime":0,"name":"cartservice:767676","protocol":"http2","listenerCount":0,"connectorCount":1},{"recType":"ADDRESS","identity":"fabac99a-e07b-44d4-806d-0e8d06eeac6a","startTime":1706536612742377,"endTime":0,"name":"cartservice:7890","protocol":"http2","listenerCount":2,"connectorCount":0},{"recType":"ADDRESS","identity":"ddbfad42-f193-4c27-8018-bc3aabeb5182","startTime":1706541253896162,"endTime":0,"name":"cartservice:8907","protocol":"http2","listenerCount":0,"connectorCount":0},{"recType":"ADDRESS","identity":"10e4c1cc-210f-4c51-b1cb-7d6f3314e6c2","startTime":1706541993693747,"endTime":0,"name":"checkoutservice:8765","protocol":"http2","listenerCount":2,"connectorCount":1}],"siteStatus":[{"site":{"recType":"SITE","identity":"4f82f33d-eafa-4fc1-8186-d9117ce032eb","startTime":1706510973000000,"endTime":0,"source":"4f82f33d-eafa-4fc1-8186-d9117ce032eb","platform":"kubernetes","name":"vb-site-test-1","nameSpace":"vb-site-test-1","siteVersion":"1.5.3","policy":"disabled"},"routerStatus":[{"router":{"recType":"ROUTER","identity":"xlznx:0","parent":"4f82f33d-eafa-4fc1-8186-d9117ce032eb","startTime":1706510979938939,"endTime":0,"source":"xlznx:0","name":"0/vb-site-test-1-skupper-router-68768b7949-xlznx","namespace":"vb-site-test-1","imageName":"skupper-router","imageVersion":"latest","hostname":"skupper-router-68768b7949-xlznx","buildVersion":"2.5.1"},"links":[{"recType":"LINK","identity":"xlznx:46","parent":"xlznx:0","startTime":1706567666969129,"endTime":0,"source":"xlznx:0","mode":"interior","name":"vb-site-test-2-skupper-router-744964b79b-twwch","direction":"incoming"}],"listeners":[{"recType":"LISTENER","identity":"xlznx:39","parent":"xlznx:0","startTime":1706541993693747,"endTime":0,"source":"xlznx:0","name":"checkoutservice:8765","destHost":"0.0.0.0","destPort":"8765","protocol":"http2","address":"checkoutservice:8765","addressId":"10e4c1cc-210f-4c51-b1cb-7d6f3314e6c2"},{"recType":"LISTENER","identity":"xlznx:22","parent":"xlznx:0","startTime":1706536612742377,"endTime":0,"source":"xlznx:0","name":"cartservice:7890","destHost":"0.0.0.0","destPort":"1034","protocol":"http2","address":"cartservice:7890","addressId":"fabac99a-e07b-44d4-806d-0e8d06eeac6a"},{"recType":"LISTENER","identity":"xlznx:37","parent":"xlznx:0","startTime":1706541879219853,"endTime":0,"source":"xlznx:0","name":"adservice:9876","destHost":"0.0.0.0","destPort":"1035","protocol":"tcp","address":"adservice:9876","addressId":"e9cb33f7-49a8-4613-8ba2-b4a933374a52"}],"connectors":[{"recType":"CONNECTOR","identity":"xlznx:40","parent":"xlznx:0","startTime":1706542027766503,"endTime":0,"source":"xlznx:0","destHost":"172.17.5.166","destPort":"8765","protocol":"http2","address":"checkoutservice:8765","target":"checkoutservice-79cf7f4c8b-s87pf","processId":"59b0abc1-7dfc-4dfe-974b-da837b1ed2a5","addressId":"10e4c1cc-210f-4c51-b1cb-7d6f3314e6c2"},{"recType":"CONNECTOR","identity":"xlznx:42","parent":"xlznx:0","startTime":1706543619173170,"endTime":0,"source":"xlznx:0","destHost":"172.17.5.188","destPort":"767676","protocol":"http2","address":"cartservice:767676","target":"cartservice-9d5469458-ztxqq","processId":"bfb61533-67f8-4672-ae4a-1b0f1f11d3c7","addressId":"947a3d79-f3b4-44c3-9e22-e4c211c3df3c"},{"recType":"CONNECTOR","identity":"xlznx:38","parent":"xlznx:0","startTime":1706541904203827,"endTime":0,"source":"xlznx:0","destHost":"172.17.3.169","destPort":"9876","protocol":"tcp","address":"adservice:9876","target":"adservice-fb7775586-z2xm5","processId":"78ade18b-a435-476c-ba1e-2607a1293c3f","addressId":"e9cb33f7-49a8-4613-8ba2-b4a933374a52"}]}]},{"site":{"recType":"SITE","identity":"f1797080-ef1b-47a0-b24d-b3ed748c8dcd","startTime":1706511028000000,"endTime":0,"source":"f1797080-ef1b-47a0-b24d-b3ed748c8dcd","platform":"kubernetes","name":"vb-site-test-2","nameSpace":"vb-site-test-2","siteVersion":"1.5.3","policy":"disabled"},"routerStatus":[{"router":{"recType":"ROUTER","identity":"twwch:0","parent":"f1797080-ef1b-47a0-b24d-b3ed748c8dcd","startTime":1706511037975482,"endTime":0,"source":"twwch:0","name":"0/vb-site-test-2-skupper-router-744964b79b-twwch","namespace":"vb-site-test-2","imageName":"skupper-router","imageVersion":"latest","hostname":"skupper-router-744964b79b-twwch","buildVersion":"2.5.1"},"links":[{"recType":"LINK","identity":"twwch:10","parent":"twwch:0","startTime":1706567666871981,"endTime":0,"source":"twwch:0","mode":"interior","name":"vb-site-test-1-skupper-router-68768b7949-xlznx","linkCost":1,"direction":"outgoing"}],"listeners":[{"recType":"LISTENER","identity":"twwch:11","parent":"twwch:0","startTime":1706567670997322,"endTime":0,"source":"twwch:0","name":"adservice:9876","destHost":"0.0.0.0","destPort":"1030","protocol":"tcp","address":"adservice:9876","addressId":"e9cb33f7-49a8-4613-8ba2-b4a933374a52"},{"recType":"LISTENER","identity":"twwch:12","parent":"twwch:0","startTime":1706567670999656,"endTime":0,"source":"twwch:0","name":"checkoutservice:8765","destHost":"0.0.0.0","destPort":"1031","protocol":"http2","address":"checkoutservice:8765","addressId":"10e4c1cc-210f-4c51-b1cb-7d6f3314e6c2"},{"recType":"LISTENER","identity":"twwch:5","parent":"twwch:0","startTime":1706536643852623,"endTime":0,"source":"twwch:0","name":"cartservice:7890","destHost":"0.0.0.0","destPort":"1027","protocol":"http2","address":"cartservice:7890","addressId":"fabac99a-e07b-44d4-806d-0e8d06eeac6a"}],"connectors":null}]}]}
`;

const tokenSample = {
  kind: 'Secret',
  apiVersion: 'v1',
  metadata: {
    name: '',
    namespace: 'vb-test',
    uid: 'b4534207-35f9-49e6-b406-f937f25fa660',
    resourceVersion: '34264174',
    creationTimestamp: '2024-03-10T13:04:40Z',
    labels: {
      'skupper.io/type': 'connection-token'
    },
    annotations: {
      'edge-host':
        'skupper-edge-vb-test.skupper-1-153f1de160110098c1928a6c05e19444-0000.eu-gb.containers.appdomain.cloud',
      'edge-port': '443',
      'inter-router-host':
        'skupper-inter-router-vb-test.skupper-1-153f1de160110098c1928a6c05e19444-0000.eu-gb.containers.appdomain.cloud',
      'inter-router-port': '443',
      'skupper.io/generated-by': '5704e597-6172-446e-9c60-28c3bc8d0e87',
      'skupper.io/site-version': '1.6.0'
    },
    managedFields: [
      {
        manager: 'Mozilla',
        operation: 'Update',
        apiVersion: 'v1',
        time: '2024-03-10T13:04:40Z',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:metadata': {
            'f:labels': {}
          },
          'f:type': {}
        }
      },
      {
        manager: 'site-controller',
        operation: 'Update',
        apiVersion: 'v1',
        time: '2024-03-10T13:04:41Z',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:data': {
            '.': {},
            'f:ca.crt': {},
            'f:tls.crt': {},
            'f:tls.key': {}
          },
          'f:metadata': {
            'f:annotations': {
              '.': {},
              'f:edge-host': {},
              'f:edge-port': {},
              'f:inter-router-host': {},
              'f:inter-router-port': {},
              'f:skupper.io/generated-by': {},
              'f:skupper.io/site-version': {}
            },
            'f:labels': {
              'f:skupper.io/type': {}
            }
          }
        }
      }
    ]
  },
  data: {
    'ca.crt':
      'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURMRENDQWhTZ0F3SUJBZ0lRSGpOYU8yOXZHYWRJY0xkN0dEVHZxREFOQmdrcWhraUc5dzBCQVFzRkFEQWEKTVJnd0ZnWURWUVFERXc5emEzVndjR1Z5TFhOcGRHVXRZMkV3SGhjTk1qUXdNekV3TVRBMU1URXlXaGNOTWprdwpNekE1TVRBMU1URXlXakFhTVJnd0ZnWURWUVFERXc5emEzVndjR1Z5TFhOcGRHVXRZMkV3Z2dFaU1BMEdDU3FHClNJYjNEUUVCQVFVQUE0SUJEd0F3Z2dFS0FvSUJBUUM3S0dBelVPN3BueVpQRDlWQlNqU2dwaEtSUmU2d045UGcKRjZ4WDlXYWlpOUZCeCs5Z2pnOVE4dzdhZDdDa3JydlBSRys0eVNRellpSTFqM2UvUkhJZzFKL0lCQ1BTNzViTwppM0hDOW1aakx0L2ZmcUlYQkE5OEtlemxwQVZ0TlNQdzErTkZaU3l5R0NHUmF3b1crNDZ4RDlYMzhhVTdWREVyClViNFU5dkpsUjJRakF3eWVIaWJUcEhRUjIzeVVhckNEdnpnV2hjcXR1a1BNemZqMkl5WDV3NnZNRjh1VzN6SUcKT01qL0E0VXBna01vOVNQVnc0c2dpQjM5M0NpbXBjMS9nVWJNL3ZYcm5VUzcycGx4SzlQaUtTekljUUxtTVphagpsTEhnOHpvTmZDSEZMWTBaTHJodzNwMy9HSTFZbXlnT2xLUFkydEMrWm5qb0ozZ3FNOFdsQWdNQkFBR2piakJzCk1BNEdBMVVkRHdFQi93UUVBd0lDcERBZEJnTlZIU1VFRmpBVUJnZ3JCZ0VGQlFjREFRWUlLd1lCQlFVSEF3SXcKRHdZRFZSMFRBUUgvQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVVWQzSFBtQnBVNzVBWXA3alFxMk9ZODJLYUprdwpDd1lEVlIwUkJBUXdBb0lBTUEwR0NTcUdTSWIzRFFFQkN3VUFBNElCQVFCREZKRng3THh6NUJ0cWt5ZDhIaWJiCk9ZdUNhMnlMVXp4S0hzOE1tdVl2TjNoZUIxZTN0TkJXeFhHRzUvT1VuUW04bkxQM1BsemNySHVPVTFqS3hId0EKQzFxd0VGclMyT2x2NkNGeUppbk1UeGFLNkpkWW4zZ2IzM2t4ZGtjYTFjMjZxMVpZL3JTdGI4WlFzUlJFNGNvUgpKTWxNQVBSOGs3bXJ3QmJIbk05dmxxZEw2R3JzenFHblFRYS9KS3gvSy9URXRjMjY5engzSWx4Yytmd2NxUmxQCmdOcFVYTDEwNERXd3NpRmJoWlNtaDBjQ2ZydzFjd1JDelFNVHZoMUg3Rlk4c2RQcjhqVCtGZjU4dWRqdjMyUGgKQjR2TVRVOWZhYnVvbTRxQ2tCSm83U3VzcDlIL1BOVWJ0NUVldnhMb3V2bmNpeEFva3ZBUmozaTJlcVFaa05kZgotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==',
    'tls.crt':
      'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURIakNDQWdhZ0F3SUJBZ0lRSnQxY3BCcWdwWnlJZXVSYUYyaTl0ekFOQmdrcWhraUc5dzBCQVFzRkFEQWEKTVJnd0ZnWURWUVFERXc5emEzVndjR1Z5TFhOcGRHVXRZMkV3SGhjTk1qUXdNekV3TVRNd05EUXhXaGNOTWprdwpNekE1TVRNd05EUXhXakFOTVFzd0NRWURWUVFERXdJNE9UQ0NBU0l3RFFZSktvWklodmNOQVFFQkJRQURnZ0VQCkFEQ0NBUW9DZ2dFQkFMRXNnWWhuaHI4enNhODlwVEw4VmtUb1BCYmlmVlZmNmY4OWxQbFdzMVh5eUEvdEUwSzcKdVRwZ2dGWXNob0pmUXRJTytHWlpUbFZNcXpvK3J0NDZBcXhzNXViSUJGdlhiZWtxYWNzdytBT0s0UXdidUNacAp0OXNBVnZ0MTliZUV6OVBZb3RFUVhWaEFYSThaMUszdDhpaFZCYkIwaFJBN3RjSmJRT1NiVFRBYmZKbk5QS1BlCjRyV2dzS1FnMmZtMU5SZ3ZrZVg5QmFtdWd2cUdFNGxNdGxMQ2RUY2d1dHdwbGQveW5pSDRiUmdkWU1hZCtYc2IKektlTFlUQWR6aXJUM3kyem5WZ2JmSi83bnBqSDFicHNvY0tveFhscXVOeXJTL0tOYmVOMEpJeEYzU3ZyNFZJbwpMR2tLZEpRUXJvQlVCd3VHN3U5QWhjR01QRU5SS3phbHQ1MENBd0VBQWFOdE1Hc3dEZ1lEVlIwUEFRSC9CQVFECkFnV2dNQjBHQTFVZEpRUVdNQlFHQ0NzR0FRVUZCd01CQmdnckJnRUZCUWNEQWpBTUJnTlZIUk1CQWY4RUFqQUEKTUI4R0ExVWRJd1FZTUJhQUZGSGR4ejVnYVZPK1FHS2U0MEt0am1QTmltaVpNQXNHQTFVZEVRUUVNQUtDQURBTgpCZ2txaGtpRzl3MEJBUXNGQUFPQ0FRRUFzMFkzWDUvT05heWcrTEtQcEdEVXJ5MEltaFB3dFBqMkJwVU9IUFZmCnYvUmtISXZvbHV2cHVDdm9CdTAyQ0JDVmpoL2o1K29QR1dvWHdoOWZyZDYxMjNuaEM0S3QzSUJDR1EzYSsrVjkKOXdONysrbk50RStGdC93ckhwWnVRNm4yeGZielI2aCt1Ly9hVngrNnZsazdqdTkrYk9hd29HSU1UVFdHaHFjeApYaDlTRmJnOEl0UC82WU1nTDhlMTJRdW1TK1VsYU81Um9TS090eHh0Tm5zTXR6dUFUaVBoSStvSk55cWJjYVRZCkVhUTRPK2RLc0VRby95bDVNYzVMWDNEb0pERFpnUGF5OVdIVGQ0SU9VNlZTeFNrdnROaFNxQ0J4U1RXUVlnSmkKMnRlWllaYytqeW1zRWU0cnZSQ1owUDRLUnhmRlI2RGJsSEFJZWJhYXRSUzBYUT09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K',
    'tls.key':
      'LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFcEFJQkFBS0NBUUVBc1N5QmlHZUd2ek94cnoybE12eFdST2c4RnVKOVZWL3AvejJVK1ZhelZmTElEKzBUClFydTVPbUNBVml5R2dsOUMwZzc0WmxsT1ZVeXJPajZ1M2pvQ3JHem01c2dFVzlkdDZTcHB5ekQ0QTRyaERCdTQKSm1tMzJ3QlcrM1gxdDRUUDA5aWkwUkJkV0VCY2p4blVyZTN5S0ZVRnNIU0ZFRHUxd2x0QTVKdE5NQnQ4bWMwOApvOTdpdGFDd3BDRForYlUxR0MrUjVmMEZxYTZDK29ZVGlVeTJVc0oxTnlDNjNDbVYzL0tlSWZodEdCMWd4cDM1CmV4dk1wNHRoTUIzT0t0UGZMYk9kV0J0OG4vdWVtTWZWdW15aHdxakZlV3E0M0t0TDhvMXQ0M1FrakVYZEsrdmgKVWlnc2FRcDBsQkN1Z0ZRSEM0YnU3MENGd1l3OFExRXJOcVczblFJREFRQUJBb0lCQUd4Zk05QlN1dHBEYllFcQpiTjBWK2xMbDFyT00wR3NqWXdjc0RPN0MrS2t1K3U2NjdkZ1k2WURxdkRWNXdNRUlNZUE1SmZtODBLeGVYREloClcyYzFCcU9mYlZGbXNUdllOek96TE1rTDUvaUt2NE5maFRHQjR1TURmekVMQTBUQTZUckV2VHF5RHRiSGI1WmMKajNuZ0hRcE1qMUZTeEgyY2VGNHM0VEcwU08rT0xBQlhmTXVNaG9nNDhSdEN1cHlRY1ZxK29nVUh2R1RnNC9BcApFeElhZDkvaDRuQ0JmNkJ4UnJpRk4yaTUwcS9vVWdmSTJxdjZGSUhEWEcvT2NJOGg0eWxqQlcxb1VNbzMxR2UwCk5ZZjF6dVlXbllsaG1lNWNmZm1ZNC9iN0hqZ2tGWUYyekZZWmxuVWYvMVpHWnE0ejAvdE1LU3FwLzJsanZxU2cKcnR6c0FRRUNnWUVBMlB1V0plZktqTW8zSGN3SnNlUmt2dDNiSDFZWG9vUEZoT1ZpVWZndmZaV1VuVnVNT1hLcQpldGZVcGFBdjVhSWgrVnB2M2ZFRTdEZ0tTZ2o2MWQvRzVJdi9jY09CeU5Ua3laKzlyb1lqMFBxeFovK3o4WWFoCmFsY3Z3K1JROS9vazN1Uk9UekNNdlBjck1CRXFNcnBmWHdBV29xLzNiUHk0Z2pPRXh4VTRYRUVDZ1lFQTBRaGoKTmFaTS9oLzhlS0M1VTRhdUlKN3Z6YzEzVWVvWWs1dE1pdkJkclVINU1BcUJjUzkwS2tiU205TmlNR2c1NytzcgpMR1phc2JDemJrMlU3eUFkTVFVNVNKTzZKaDB5cFZYZFBwaHhLRktVYy95TG0wZFBQUm1pQmhYTkdkQXJBa3NKCldia3gyMG4wdjE4NUNYb3Bmbkhic2t4aDVMN0F1L3RIR242dk5GMENnWUVBZzgzLzNUSzZKVi9Jcno3OFBLVmkKVlZicS9sUUxzMXFjSnlnMzIxY0pjaDNrMHRtRGlub08rT1FXZGkyaUtybWNMWjQwQ2Z1WVkrMSt3bzVGNEprNApkaWhjbVR5TG4vVkNyUDl0OTQvZ1BkZXE0R1BCYU52QlBabU1tRkFlcHlPNk5mTTFab0UxWEt3Ly9jalBlMVVmCkRkUTk2OEU4YVdYeXBwU28rVTM0bUlFQ2dZQW1wY3RaL3Y1Yk9lUy9GTkJQRGlhaHAyRWxCdWtadnhOK0x3ZHUKNU5RZEZZYVNDRTg0Y3hLaVFtZnNJYUFVM1NCaEtIVGFCNjZiRGRXTy9rOGNDeTc2Z2tHK0Zub2pVK0NxU3Y3Vgo5Tzl2Q2gyaWVENERucUthNUdOZGhxaGVMbXZWUjdSWjMzREZYNTRkeCtoT3hVUm91WHBxTTg4aHNOY0hxb1RSCjlEeEdqUUtCZ1FET3VmYTJWNlUvQWdmcEZKbUY2aitzY2FYWTQ1Sk9ZWG4wVlVoWmJYcTFPVXk2VmovOUZGMEIKS1M2aUVOZll2NjNIaDU5aXM4T0NVT1pzZUdzeEtXNEFXNHhWZ1M1U3BsTDI1RG1YUzErclVFLzE2Z0ErSmYzaAo4cUpZZ0ZnbEF0eTV3dSt4a2g1bUROck0wQys0WG4vMmdtZ2dXSXhnN2Nyb3JUeitTNWdhWHc9PQotLS0tLUVORCBSU0EgUFJJVkFURSBLRVktLS0tLQo='
  },
  type: 'Opaque'
};
