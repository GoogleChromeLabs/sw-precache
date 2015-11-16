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
  constructor() {
    super();
    this._handleRefresh = this._handleRefresh.bind(this);
  }

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

  _handleRefresh() {
    this.constructor.fetchData(this.props.dispatch);
  }

  render() {
    let {guides, dispatch} = this.props;

    return (
      <div>
        <div id="title-bar">
          <span id="title">Featured iFixit Guides</span>
          <svg id="refresh"
               title="Refresh Guides"
               role="button"
               onClick={this._handleRefresh}
               height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            <path d="M0 0h24v24H0z" fill="none"/>
          </svg>
        </div>
        <GuidesWrapper guides={guides} {...bindActionCreators(Actions, dispatch)}/>
      </div>
    );
  }
}

export default connect(state => ({guides: state.urlToResponse.get(GUIDE_URL)}))(Guides);
