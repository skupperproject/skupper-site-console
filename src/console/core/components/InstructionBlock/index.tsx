import { FC, ReactNode } from 'react';

import { Flex, FlexItem, Panel, Split, SplitItem, Text, Title } from '@patternfly/react-core';

import ExternalLink from '../ExternalLink';

const InstructionBlock: FC<{
  img: string;
  title: string;
  description: string;
  link1?: string;
  link1Text?: string;
  link2?: string;
  link2Text?: string;
  component?: ReactNode;
}> = function ({ img, title, description, link1, link1Text, link2, link2Text, component }) {
  return (
    <Panel variant="bordered">
      <Split hasGutter>
        <SplitItem>
          <img src={img} alt="Link tutorial" style={{ width: '200px' }} />
        </SplitItem>

        <SplitItem isFilled style={{ width: '100%' }}>
          <Flex
            direction={{ default: 'column' }}
            justifyContent={{ default: 'justifyContentCenter' }}
            style={{ height: '100%' }}
          >
            <FlexItem>
              <Title headingLevel="h3">{title}</Title>
            </FlexItem>
            <FlexItem>
              <Text>{description}</Text>
            </FlexItem>

            <FlexItem>
              <small>
                {link1 && link1Text && <ExternalLink href={link1} text={link1Text} />}
                {link2 && link2Text && (
                  <>
                    <span className="pf-u-mx-md"> | </span>
                    <ExternalLink href={link2} text={link2Text} />
                  </>
                )}
              </small>
            </FlexItem>

            <FlexItem>{component}</FlexItem>
          </Flex>
        </SplitItem>
      </Split>
    </Panel>
  );
};

export default InstructionBlock;
