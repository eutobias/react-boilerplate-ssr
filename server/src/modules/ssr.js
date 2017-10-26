/* eslint-disable func-style */
// import ReactDOM from 'react-dom/server';
// import { Helmet } from 'react-helmet';
import createHistory from 'history/createMemoryHistory';
// import get from 'lodash/get';
// import last from 'lodash/last';
// import split from 'lodash/split';
import { getClientInstance } from '../client';
// import logger from '../logger';

// Initializes the store with the starting url from request.
function configureStore(req, client) {
  console.log('server path', req.originalUrl);

  const history = createHistory({ initialEntries: [req.originalUrl] });
  const preloadedState = {};

  return client.app.createStore(history, preloadedState);
}

// Prepares the HTML string and the appropriate headers
// and subequently string replaces them into their placeholders
function renderToHtml(client, store) {
  const appObject = client.app.createApp(context.store, context.initialComponent);
  const appString = ReactDOM.renderToString(appObject);
  const helmet = Helmet.renderStatic();
  const initialState = JSON.stringify(context.store.getState()).replace(/</g, '\\u003c');

  context.renderedHtml = context.client
    .html()
    .replace(/<!--appContent-->/g, appString)
    .replace(/<!--appState-->/g, `<script>window.__INITIAL_STATE__ = ${initialState}</script>`)
    .replace(/<\/head>/g, [
      helmet.title.toString(),
      helmet.meta.toString(),
      helmet.link.toString(),
      '</head>',
    ].join('\n'))
    .replace(/<html>/g, `<html ${helmet.htmlAttributes.toString()}>`)
    .replace(/<body>/g, `<body ${helmet.bodyAttributes.toString()}>`);

  return context;
}

// SSR Main method
//
// Note: Each function in the promise chain beyond the thenable context
// should return the context or modified context.
function serverRender(req, res) {
  const client = getClientInstance(res.locals.clientFolders);
  const store = configureStore(req, client);

  Promise.resolve(null)
    .then(renderToHtml(client, store))
    .then((context) => {
      res.send(context.renderedHtml);
      return context;
    })
    .catch((err) => {
      console.log(`SSR error: ${err}`);
    });
}

export default serverRender;