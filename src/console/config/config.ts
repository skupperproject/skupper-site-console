export const MSG_TIMEOUT_ERROR = 'The request to fetch the data has timed out.'; // Error message to display when request times out
export let I18nNamespace = 'plugin__site-console'; // Namespace for i18n translations with plugin__ prefix + name of the plugin
export const skupperSiteConfigMapName = 'skupper-site';
export const skupperNetworkStatusConfigMapName = 'skupper-network-status';
export const skupperServicesConfigMapName = 'skupper-services';

export function setI18nNamespace(namespace: string) {
  I18nNamespace = namespace;
}
