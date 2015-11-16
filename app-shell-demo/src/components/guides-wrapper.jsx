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

import React from 'react';
import {Link} from 'react-router';

class GuidesItemWrapper extends React.Component {
  render() {
    return (
      <div className="card">
        <Link to={this.props.to} title={this.props.title}><img src={this.props.image}/></Link>
      </div>
    );
  }
}

export default class GuidesWrapper extends React.Component {
  render() {
    const GUIDE_PREFIX = '/guide/';
    let guides = this.props.guides || [];

    return (
      <div className="card-container">
        {guides.map(guide => {
          return <GuidesItemWrapper key={guide.get('guideid')}
                                    to={GUIDE_PREFIX + guide.get('guideid')}
                                    image={guide.get('image').get('standard')}
                                    title={guide.get('title')}/>;
        })}
      </div>
    );
  }
}
