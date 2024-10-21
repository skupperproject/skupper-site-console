import { useQuery } from '@tanstack/react-query';

import { RESTApi } from '@API/REST.api';
import { QueryKeys } from '@config/reactQuery';
import LoadingPage from '@core/components/Loading';
import SitePage from '@pages/SitePage';

import { useWatchedSkupperResource } from './hooks/useSkupperWatchResource';
import CreateSitePage from './pages/CreateSitePage';

const AppContent = function () {
  const { data: sites, loaded } = useWatchedSkupperResource({ kind: 'Site' });

  const { data: siteManuallyTriggered } = useQuery({
    queryKey: [QueryKeys.FindSite],
    queryFn: () => RESTApi.findSite()
  });

  const site = sites?.[0];

  if (!loaded) {
    return <LoadingPage message="" />;
  }

  return site?.isConfigured || site?.isResolved || site?.hasError || (site && siteManuallyTriggered) ? (
    <SitePage siteId={site?.identity} />
  ) : (
    <CreateSitePage />
  );
};

export default AppContent;
