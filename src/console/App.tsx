import { FC, Suspense } from 'react';

import { Bullseye, Page, PageSection, Spinner } from '@patternfly/react-core';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

import AppContent from 'console/AppContent';

import { Wrapper } from './Wrapper';

import '@patternfly/patternfly/patternfly-addons.css';

import './App.css';

interface ErrorConsoleProps {
  error: {
    stack?: string;
  };
}

const ErrorConsole: FC<ErrorConsoleProps> = function ({ error }) {
  return <PageSection data-testid="sk-js-error-view">{JSON.stringify(error.stack)}</PageSection>;
};

const App = function () {
  return (
    <Wrapper>
      <Page
        additionalGroupedContent={
          <QueryErrorResetBoundary>
            {({ reset }) => (
              <ErrorBoundary onReset={reset} FallbackComponent={ErrorConsole}>
                <Suspense
                  fallback={
                    <Bullseye>
                      <Spinner size="xl" />
                    </Bullseye>
                  }
                >
                  <AppContent />
                </Suspense>
              </ErrorBoundary>
            )}
          </QueryErrorResetBoundary>
        }
      />
    </Wrapper>
  );
};

export default App;
