import React from 'react';
import express from 'express';
import expressHandlebars from 'express-handlebars';
import path from 'path';
import routes from './routes';
import {RoutingContext, match} from 'react-router';
import {createMemoryHistory} from 'history';

const app = express();

app.use(express.static('build'));

app.engine('handlebars', expressHandlebars());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res) => {
  const location = createMemoryHistory().createLocation(req.url);

  match({routes, location}, (err, redirectLocation, renderProps) => {
    if (err) {
      console.error(err);
      return res.status(500).end('Internel Server Error');
    }

    if (!renderProps) {
      return res.status(404).end('Not Found');
    }

    const InitialComponent = (
      <RoutingContext {...renderProps}/>
    );

    res.render('index', {
      reactHtml: React.renderToString(InitialComponent)
    });
  });
});

export default app;
