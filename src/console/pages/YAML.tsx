import { CodeBlock, CodeBlockCode, PageSection } from '@patternfly/react-core';
import { useQuery } from '@tanstack/react-query';
import { stringify } from 'yaml';

import { RESTApi } from '@API/REST.api';

const YAML = function () {
  const { data: configMapSite } = useQuery({
    queryKey: ['find-site-query'],
    queryFn: () => RESTApi.findConfigMap()
  });

  if (!configMapSite) {
    return null;
  }

  return (
    <PageSection>
      <CodeBlock>
        <CodeBlockCode id="code-content">{stringify(configMapSite)}</CodeBlockCode>
      </CodeBlock>
    </PageSection>
  );
};

export default YAML;
