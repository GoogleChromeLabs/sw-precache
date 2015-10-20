/* eslint-env browser */
import React from 'react';
import promiseMiddleware from 'redux-promise';
import reducer from '../reducer';
import routes from '../routes';
import {Provider} from 'react-redux';
import {Router} from 'react-router';
import {applyMiddleware, createStore} from 'redux';
import {createHistory} from 'history';
import {fromJS} from 'immutable';

let state = window.__STATE__;
Object.keys(state).forEach(key => {
  state[key] = fromJS(state[key]);
});
let createStoreWithMiddleware = applyMiddleware(promiseMiddleware)(createStore);
let store = createStoreWithMiddleware(reducer, state);

let history = createHistory();

React.render(
  <Provider store={store}>
    {() => <Router children={routes} history={history}/>}
  </Provider>,
  document.getElementById('content')
);
