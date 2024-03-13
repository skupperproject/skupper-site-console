import React from 'react';

import { ExternalLinkAltIcon } from '@patternfly/react-icons';

interface ExternalLinkProps {
  href: string;
  text: string;
}

const ExternalLink: React.FC<ExternalLinkProps> = function ({ href, text }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {text} <ExternalLinkAltIcon />
    </a>
  );
};

export default ExternalLink;
