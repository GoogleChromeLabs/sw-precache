/**
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOMServer from 'react-dom/server';
import compression from 'compression';
import express from 'express';
import expressHandlebars from 'express-handlebars';
import fs from 'fs';
import path from 'path';
import promiseMiddleware from 'redux-promise';
import reducer from './reducer';
import routes from './routes';
import {Provider} from 'react-redux';
import {RouterContext, match} from 'react-router';
import {applyMiddleware, createStore} from 'redux';

let app = express();

app.use(compression());

function handleError(res, error) {
  console.error(error);
  return res.status(500).end(`Internal Server Error\n\n${error}`);
}

function setHeaders(res, file) {
  if (file.includes(`${path.sep}rev${path.sep}`)) {
    res.setHeader('Cache-Control', 'max-age=31536000');
  } else if (file.endsWith('service-worker.js')) {
    res.setHeader('Cache-Control', 'max-age=0, no-cache');
  } else {
    res.setHeader('Cache-Control', 'max-age=3600');
  }
}

app.use(express.static('build', {index: false, setHeaders}));

app.engine('handlebars', expressHandlebars());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

let revManifest = require('../build/rev-manifest.json');
let styles = new Map(
  Object.keys(revManifest).filter(originalFile => originalFile.endsWith('.css'))
    .map(originalFile => {
      let revFile = revManifest[originalFile];
      let contents = fs.readFileSync(
        path.join('build', 'rev', revFile), 'utf8');
      return [originalFile, contents];
    })
);

app.use((req, res) => {
  let createStoreWithMiddleware = applyMiddleware(
    promiseMiddleware)(createStore);
  let store = createStoreWithMiddleware(reducer);

  match({routes, location: req.url}, (error, redirect, renderProps) => {
    if (error) {
      return handleError(res, error);
    }

    if (!renderProps) {
      return res.status(404).end('Not Found');
    }

    if (redirect) {
      return res.redirect(302, redirect.pathname + redirect.search);
    }

    let fetchDataPromises = renderProps.components
      .filter(component => component.fetchData)
      .map(component => component.fetchData(store.dispatch, renderProps));

    let inlineStyles = renderProps.components
      .filter(component => component.needsStyles)
      .map(component => 'styles/' + component.needsStyles())
      .reduce((stylesSoFar, styleName) => {
        return stylesSoFar + styles.get(styleName);
      }, '');

    Promise.all(fetchDataPromises).then(() => {
      let InitialComponent = (
        <Provider store={store}>
          <RouterContext {...renderProps}/>
        </Provider>
      );

      res.setHeader('Cache-Control', 'max-age=0, no-cache');
      res.render('index', {
        reactHtml: ReactDOMServer.renderToString(InitialComponent),
        state: JSON.stringify(store.getState()),
        revManifest,
        inlineStyles
      });
    }).catch(error => handleError(res, error));
  });
});

export default app;
