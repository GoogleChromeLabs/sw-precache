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

import {handleActions} from 'redux-actions';
import {default as Immutable, fromJS} from 'immutable';

let reducer = handleActions({
  LOAD_URL: (state, action) => ({
    urlToResponse: state.urlToResponse.set(action.payload.url,
        fromJS(action.payload.json))
  })
}, {urlToResponse: new Immutable.Map()});

export default reducer;
