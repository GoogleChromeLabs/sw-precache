/* eslint-env browser */
import * as reducers from '../reducers';
import React from 'react';
import routes from '../routes';
import {Provider} from 'react-redux';
import {Router} from 'react-router';
import {createHistory} from 'history';
import {createStore, combineReducers} from 'redux';
import {fromJS} from 'immutable';

let state = window.__STATE__;
Object.keys(state).forEach(key => {
  state[key] = fromJS(state[key]);
});
let reducer = combineReducers(reducers);
let store = createStore(reducer, state);

let history = createHistory();

React.render(
  <Provider store={store}>
    {() => <Router children={routes} history={history}/>}
  </Provider>,
  document.getElementById('content')
);
