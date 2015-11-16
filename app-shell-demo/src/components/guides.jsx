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

import * as Actions from '../actions';
import GuidesWrapper from './guides-wrapper';
import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

const GUIDE_URL = 'https://www.ifixit.com/api/2.0/guides/featured';

class Guides extends React.Component {
  static fetchData(dispatch) {
    let boundActions = bindActionCreators(Actions, dispatch);
    return boundActions.loadUrl(GUIDE_URL);
  }

  static needsStyles() {
    return 'guides.css';
  }

  componentDidMount() {
    if (this.props.guides === undefined) {
      this.constructor.fetchData(this.props.dispatch);
    }
  }

  render() {
    let {guides, dispatch} = this.props;

    return (
      <div>
        <div id="title-bar">Featured iFixit Guides</div>
        <GuidesWrapper guides={guides} {...bindActionCreators(Actions, dispatch)}/>
      </div>
    );
  }
}

export default connect(state => ({guides: state.urlToResponse.get(GUIDE_URL)}))(Guides);
