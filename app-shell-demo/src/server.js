import * as reducers from './reducers';
import React from 'react';
import express from 'express';
import expressHandlebars from 'express-handlebars';
import path from 'path';
import routes from './routes';
import {Provider} from 'react-redux';
import {RoutingContext, match} from 'react-router';
import {createMemoryHistory} from 'history';
import {createStore, combineReducers} from 'redux';

const app = express();

app.use(express.static('build'));

app.engine('handlebars', expressHandlebars());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res) => {
  const location = createMemoryHistory().createLocation(req.url);
  const reducer = combineReducers(reducers);
  const store = createStore(reducer);

  match({routes, location}, (err, redirectLocation, renderProps) => {
    if (err) {
      console.error(err);
      return res.status(500).end('Internel Server Error');
    }

    if (!renderProps) {
      return res.status(404).end('Not Found');
    }

    const InitialComponent = (
      <Provider store={store}>
        {() => <RoutingContext {...renderProps}/>}
      </Provider>
    );

    res.render('index', {
      reactHtml: React.renderToString(InitialComponent),
      state: JSON.stringify(store.getState())
    });
  });
});

export default app;
