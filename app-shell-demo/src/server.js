import React from 'react';
import express from 'express';
import expressHandlebars from 'express-handlebars';
import fs from 'fs';
import path from 'path';
import promiseMiddleware from 'redux-promise';
import reducer from './reducer';
import routes from './routes';
import {Provider} from 'react-redux';
import {RoutingContext, match} from 'react-router';
import {applyMiddleware, createStore} from 'redux';
import {createMemoryHistory} from 'history';

let app = express();

app.use(express.static('build'));

app.engine('handlebars', expressHandlebars());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

let revManifest = JSON.parse(fs.readFileSync(path.join('build', 'rev-manifest.json'), 'utf8'));
let styles = new Map(
  Object.keys(revManifest).filter(originalFile => originalFile.endsWith('.css'))
    .map(originalFile => {
      let revFile = revManifest[originalFile];
      let contents = fs.readFileSync(path.join('build', 'rev', revFile), 'utf8');
      return [originalFile, contents];
    })
);

function handleError(res, error) {
  console.error(error);
  return res.status(500).end(`Internal Server Error\n\n${error}`);
}

app.use((req, res) => {
  let location = createMemoryHistory().createLocation(req.url);
  let createStoreWithMiddleware = applyMiddleware(promiseMiddleware)(createStore);
  let store = createStoreWithMiddleware(reducer);

  match({routes, location}, (error, redirectLocation, renderProps) => {
    if (error) {
      return handleError(res, error);
    }

    if (!renderProps) {
      return res.status(404).end('Not Found');
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
          {() => <RoutingContext {...renderProps}/>}
        </Provider>
      );

      res.render('index', {
        reactHtml: React.renderToString(InitialComponent),
        state: JSON.stringify(store.getState()),
        revManifest,
        inlineStyles
      });
    }).catch(error => handleError(res, error));
  });
});

export default app;
