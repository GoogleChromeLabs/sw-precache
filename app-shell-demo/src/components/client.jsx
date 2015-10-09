/* eslint-env browser */
import React from 'react';
import routes from '../routes';
import {Router} from 'react-router';
import {createHistory} from 'history';

const history = createHistory();

React.render(
  <Router children={routes} history={history}/>,
  document.getElementById('content')
);
