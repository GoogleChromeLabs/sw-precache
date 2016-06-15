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
import {Route, IndexRoute} from 'react-router';

import App from './components/app';
import Guide from './components/guide';
import Guides from './components/guides';
import NotFound from './components/notfound';
import Shell from './components/shell';

export default (
  <Route path="/" component={App}>
    <IndexRoute component={Guides}/>
    <Route path="shell" component={Shell}/>
    <Route path="guide/:guideId" component={Guide}/>
    <Route path="*" component={NotFound}/>
  </Route>
);
