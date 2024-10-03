import { FC, useCallback, useState } from 'react';

import {
  FileUpload,
  DropEvent,
  Card,
  CardTitle,
  Title,
  CardBody,
  Button,
  CardFooter,
  Stack,
  StackItem
} from '@patternfly/react-core';
import { ImportIcon } from '@patternfly/react-icons';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { parse } from 'yaml';

import { RESTApi } from '@API/REST.api';
import { I18nNamespace } from '@config/config';
import SkTable from '@core/components/SkTable';
import { createListenerRequest } from '@core/utils/createCRD';
import { ListenerCrdParams, ListenerParams, ListenerSpec } from '@interfaces/CRD_Listener';
import { Listener } from '@interfaces/REST.interfaces';
import { SKColumn } from '@interfaces/SkTable.interfaces';

interface ListenerCrdAttributes extends ListenerSpec {
  name: string;
  resourceVersion?: string;
  status?: 'Error' | 'Updated' | 'Created';
}

const title = 'Create or Update Listeners';

export const ImportListenersForm: FC<{ oldItems: Listener[]; onSubmit: () => void; onCancel: () => void }> = function ({
  oldItems,
  onSubmit
}) {
  const { t } = useTranslation(I18nNamespace);

  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [items, setItems] = useState<ListenerCrdAttributes[]>([]);

  const mutationCreate = useMutation({
    mutationFn: async (data: ListenerCrdParams) =>
      RESTApi.createOrUpdateListener(data, data.metadata.resourceVersion && data.metadata.name)
  });

  const handleImport = useCallback(async () => {
    const newItemsPromised = items.map(async ({ name, routingKey, host, port, type, tlsCredentials }) => {
      const data: ListenerCrdParams = createListenerRequest({
        metadata: {
          name
        },
        spec: {
          routingKey,
          host,
          port: Number(port),
          type,
          tlsCredentials
        }
      });

      const match = oldItems.find((item) => item.name === name);

      if (match) {
        data.metadata.resourceVersion = match.resourceVersion;
      }

      const json: ListenerCrdAttributes = {
        ...data.metadata,
        ...data.spec
      };

      try {
        const status = await mutationCreate.mutateAsync(data);

        return { ...json, status } as ListenerCrdAttributes;
      } catch {
        return { ...json, status: 'Error' } as ListenerCrdAttributes;
      }
    });

    const newItems = await Promise.all(newItemsPromised);
    setItems(newItems);
  }, [items, mutationCreate, oldItems]);

  const handleFileContentChange = useCallback((_: DropEvent, content: string) => {
    setFileContent(content);
    setItems(
      content
        .split('---')
        .filter((doc) => doc.trim() !== '')
        .map((doc) => parse(doc))
        .map(({ metadata, spec }: ListenerParams) => ({
          name: metadata.name,
          routingKey: spec.routingKey,
          host: spec.host,
          port: spec.port,
          type: spec.type,
          tlsCredentials: spec.tlsCredentials
        }))
    );
  }, []);

  const handleFileInputChange = useCallback((_: DropEvent, file: File) => {
    setFileName(file.name);
  }, []);

  const Columns: SKColumn<ListenerCrdAttributes>[] = [
    {
      name: t('Name'),
      prop: 'name',
      customCellName: 'linkCell'
    },
    {
      name: t('Routing key'),
      prop: 'routingKey'
    },
    {
      name: t('Service name'),
      prop: 'host'
    },
    {
      name: t('Port'),
      prop: 'port'
    },
    {
      name: t('Type'),
      prop: 'type'
    },
    {
      name: t('Status'),
      prop: 'status'
    }
  ];

  return (
    <Card isPlain>
      <CardTitle>
        <Title headingLevel="h1">{t(title)}</Title>
      </CardTitle>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <FileUpload
              id="access-token-file"
              type="text"
              value={fileContent}
              filename={fileName}
              filenamePlaceholder="Drag and drop a file or upload one"
              browseButtonText="Upload"
              hideDefaultPreview={true}
              isClearButtonDisabled={true}
              onFileInputChange={handleFileInputChange}
              onDataChange={handleFileContentChange}
            />
          </StackItem>
          <StackItem>
            <Button onClick={handleImport} icon={<ImportIcon />} isDisabled={!fileContent}>
              {t('Import')}
            </Button>
          </StackItem>

          <StackItem>
            <SkTable columns={Columns} rows={items} alwaysShowPagination={false} isPlain />
          </StackItem>
        </Stack>
      </CardBody>
      <CardFooter>
        <Button variant="link" onClick={onSubmit}>
          {t('Dismiss')}
        </Button>
      </CardFooter>
    </Card>
  );
};