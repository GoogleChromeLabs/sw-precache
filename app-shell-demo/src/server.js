import React from 'react';
import Router from 'react-router';
import express from 'express';
import expressHandlebars from 'express-handlebars';
import path from 'path';
import routes from './routes';

const app = express();

app.use(express.static('build'));

app.engine('handlebars', expressHandlebars());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res) => {
  Router.create({
    routes: routes,
    location: req.url
  }).run(Handler => {
    res.render('index', {
      reactHtml: React.renderToString(React.createElement(Handler))
    });
  });
});

export default app;
