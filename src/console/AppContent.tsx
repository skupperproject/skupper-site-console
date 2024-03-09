import { KeyboardEvent, MouseEvent, ReactNode, Suspense, useState } from 'react';

import {
  Tabs,
  Tab,
  TabTitleText,
  PageSection,
  PageSectionVariants,
  PageNavigation,
  Bullseye,
  Spinner
} from '@patternfly/react-core';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { RESTApi } from '@API/REST.api';
import { I18nNamespace } from '@config/config';
import Connectors from '@pages/Connectors';
import Listeners from '@pages/Listeners';

import Details from './pages/Details';
import EmptySite from './pages/EmptySite';
import GetStarted from './pages/GetStarted';
import Links from './pages/Links';

const AppContent = function () {
  const { t } = useTranslation(I18nNamespace);

  const [activeTabKey, setActiveTabKey] = useState<string | number>(0);

  const { data: isOperatorGroupInstalled } = useQuery({
    queryKey: ['get-isOperator-group-installed-query'],
    queryFn: () => RESTApi.checkIfExistOrInstallOperator()
  });

  const { data: site, refetch } = useQuery({
    queryKey: ['find-configMap-query'],
    queryFn: () => RESTApi.findConfigMap(),
    enabled: isOperatorGroupInstalled
  });

  const handleTabClick = (tabIndex: string | number) => {
    setActiveTabKey(tabIndex);
  };

  if (!site) {
    return (
      <PageSection variant={PageSectionVariants.light}>
        <EmptySite onClick={refetch} />
      </PageSection>
    );
  }

  const components: ReactNode[] = [
    <GetStarted key={1} siteId={site.metadata?.uid as string} />,
    <Details onGoTo={handleTabClick} onDeleteSite={refetch} key={2} />,
    <Bullseye key={3}>Tab 3 section</Bullseye>,
    <Links siteId={site.metadata?.uid as string} key={4} />,
    <Listeners siteId={site.metadata?.uid as string} key={5} />,
    <Connectors key={6} />
  ];

  return (
    <PageSection variant={PageSectionVariants.light} padding={{ default: 'noPadding' }}>
      <PageNavigation>
        <Tabs
          mountOnEnter
          unmountOnExit
          activeKey={activeTabKey}
          onSelect={(_: MouseEvent | KeyboardEvent | MouseEvent, tabIndex: string | number) => handleTabClick(tabIndex)}
        >
          <Tab eventKey={0} title={<TabTitleText>{t('GetStartedTab')}</TabTitleText>} />
          <Tab eventKey={1} title={<TabTitleText>{t('DetailsTab')}</TabTitleText>} />
          <Tab eventKey={2} title={<TabTitleText>{t('YamlTab')}</TabTitleText>} isDisabled />
          <Tab eventKey={3} title={<TabTitleText>{t('LinksTab')}</TabTitleText>} />
          <Tab eventKey={4} title={<TabTitleText>{t('ListenersTab')}</TabTitleText>} />
          <Tab eventKey={5} title={<TabTitleText>{t('ConnectorsTab')}</TabTitleText>} />
        </Tabs>
      </PageNavigation>

      <Suspense
        fallback={
          <Bullseye>
            <Spinner size="xl" />
          </Bullseye>
        }
      >
        <PageSection>{components[activeTabKey as number]}</PageSection>
      </Suspense>
    </PageSection>
  );
};

export default AppContent;
