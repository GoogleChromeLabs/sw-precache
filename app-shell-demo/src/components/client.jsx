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
  document.querySelector('main')
);
