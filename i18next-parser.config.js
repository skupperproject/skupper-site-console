const { CustomJSONLexer } = require('./i18n-scripts/lexers');

module.exports = {
  sort: true,
  createOldCatalogs: false,
  keySeparator: false,
  locales: ['en'],
  namespaceSeparator: '~',
  reactNamespace: false,
  defaultNamespace: 'plugin__site-console',
  useKeysAsDefaultValue: true,

  lexers: {
    htm: ['HTMLLexer'],
    html: ['HTMLLexer'],
    ts: ['JavascriptLexer'],
    tsx: ['JsxLexer'],
    json: [CustomJSONLexer],
    default: ['JavascriptLexer']
  }
};
