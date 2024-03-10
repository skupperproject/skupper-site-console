import i18n from 'i18next';
import { render } from 'react-dom';
import { initReactI18next } from 'react-i18next';

import { setI18nNamespace } from '@config/config';

import { loadMockServer } from './server';
import translation from '../../locales/en/plugin__site-console.json';
import App from '../console/App';

import '@patternfly/patternfly/patternfly.css';

const rootElement = document.getElementById('app') as HTMLDivElement;

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation
    }
  },
  lng: 'en',
  fallbackLng: 'en',

  interpolation: {
    escapeValue: false
  }
});
render(<App />, rootElement);
loadMockServer();
setI18nNamespace('');
