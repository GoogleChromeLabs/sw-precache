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

export default class GuideWrapper extends React.Component {
  render() {
    let guide = this.props.guide;
    if (!guide) {
      return (
        <div id="title-bar">
          <Link to="/" title="Back to Guides">
            <svg id="back" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0h24v24H0z" fill="none"/>
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </Link>
          Loading...
        </div>
      );
    }

    let optionalIntroduction = guide.get('introduction_rendered') ? (
      <section>
        <header>Introduction</header>
        <div dangerouslySetInnerHTML={{__html: guide.get('introduction_rendered')}}/>
      </section>) : '';

    let optionalConclusion = guide.get('conclusion_rendered') ? (
      <section>
        <header>Conclusion</header>
        <div dangerouslySetInnerHTML={{__html: guide.get('conclusion_rendered')}}/>
      </section>) : '';

    return (
      <div>
        <div id="title-bar">
          <Link to="/" title="Back to Guides">
            <svg id="back" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0h24v24H0z" fill="none"/>
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </Link>
          <span id="title">{guide.get('title')}</span>
        </div>
        <h5 className="attribution">By {guide.get('author').get('username')} • Difficulty: {guide.get('difficulty')}</h5>
        {optionalIntroduction}
        {guide.get('steps').map((step, stepCounter) => {
          return (
            <section key={`section-${stepCounter}`} id={`Step${stepCounter + 1}`}>
              <header key={`header-${stepCounter}`}>{step.get('title') || `Step ${stepCounter + 1}`}</header>
              {step.get('media').get('data').map((image, imageCounter) => {
                if (image && image.get && image.get('standard')) {
                  return (
                    <a key={`a-${imageCounter}`}
                       href={image.get('original')}>
                      <img key={`img-${imageCounter}`}
                           className="card"
                           src={image.get('standard')}/>
                    </a>
                  );
                }
              })}
              <ul key={`ul-${stepCounter}`}>
                {step.get('lines').map((line, lineCounter) => {
                  return <li key={`li-${lineCounter}`}
                             className={`level-${line.get('level')} bullet-${line.get('bullet')}`}
                             dangerouslySetInnerHTML={{__html: line.get('text_rendered')}}/>;
                })}
              </ul>
            </section>
          );
        })}
        {optionalConclusion}
      </div>
    );
  }
}
