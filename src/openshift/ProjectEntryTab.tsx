import { FC } from 'react';

import { setSkupperNamespace } from '@config/db';
import { K8sResourceCommon } from '@K8sResources/resources.interfaces';

import App from '../console/App';

const ProjectEntryTab: FC<{ obj: K8sResourceCommon }> = function ({ obj }) {
  const namespace = obj?.metadata?.name as string;

  setSkupperNamespace(namespace);

  return <App />;
};

export default ProjectEntryTab;
