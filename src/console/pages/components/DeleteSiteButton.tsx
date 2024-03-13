import { FC, useState } from 'react';

import {
  Button,
  Toolbar,
  ToolbarItem,
  ToolbarGroup,
  Modal,
  ModalVariant,
  Title,
  Card,
  CardHeader,
  CardBody,
  Icon
} from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { RESTApi } from '@API/REST.api';
import { I18nNamespace } from '@config/config';
import { getConfigMap } from '@K8sResources/resources';

const DeleteSiteButton: FC<{ onClick: (name: undefined) => void }> = function ({ onClick }) {
  const { t } = useTranslation(I18nNamespace);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const mutationDeleteSite = useMutation({
    mutationFn: (name: string) => RESTApi.deleteSite(name),
    onSuccess: () => onClick(undefined)
  });

  const handleDeleteSite = () => {
    const name = getConfigMap().metadata?.name;

    if (name) {
      mutationDeleteSite.mutate(name);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <Toolbar>
      <ToolbarGroup alignment={{ default: 'alignRight' }}>
        <ToolbarItem>
          <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
            {t('Delete site')}
          </Button>
        </ToolbarItem>
      </ToolbarGroup>
      <Modal
        variant={ModalVariant.small}
        isOpen={isModalOpen}
        onClose={handleClose}
        actions={[
          <Button variant="danger" onClick={handleDeleteSite} key="submit">
            {t('Delete')}
          </Button>,
          <Button variant="secondary" onClick={handleClose} key="cancel">
            {t('Cancel')}
          </Button>
        ]}
      >
        <Card isPlain>
          <CardHeader>
            <Title headingLevel="h1">
              <Icon size="lg">
                <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" />
              </Icon>
              {'    '}
              {t('Permanently remove the site')}
            </Title>
          </CardHeader>

          <CardBody>{t('Are you sure you want to remove this site?')}</CardBody>
        </Card>
      </Modal>
    </Toolbar>
  );
};

export default DeleteSiteButton;
