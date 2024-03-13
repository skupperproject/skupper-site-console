import { FC, useState } from 'react';

import { Bullseye, Button, Flex, FlexItem, Icon, Modal, ModalVariant, Text, TextContent } from '@patternfly/react-core';
import { CubesIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

import { I18nNamespace } from '@config/config';

import SiteForm from './components/CreateSiteForm';

interface InitProps {
  onClick: () => void;
}

const Init: FC<InitProps> = function ({ onClick }) {
  const { t } = useTranslation(I18nNamespace);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = () => {
    handleClose();
    onClick();
  };

  const handleClose = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <>
      <Bullseye>
        <TextContent>
          <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsCenter' }}>
            <FlexItem>
              <Icon iconSize="xl">
                <CubesIcon color="var(--pf-global--palette--black-600)" />
              </Icon>
            </FlexItem>
            <FlexItem>
              <Text component="h1">No site configured</Text>
            </FlexItem>
            <FlexItem className="pf-u-mb-xl">
              <Text component="small">
                This namespace is not configured to be a skupper site. Please create a site to get started.
              </Text>
            </FlexItem>
            <FlexItem>
              <Button onClick={handleClose}>{t('Create site')}</Button>
            </FlexItem>
          </Flex>
        </TextContent>
      </Bullseye>
      <Modal title={t('Create site')} variant={ModalVariant.medium} isOpen={isModalOpen} onClose={handleClose}>
        <SiteForm onSubmit={handleSubmit} onCancel={handleClose} />
      </Modal>
    </>
  );
};

export default Init;
