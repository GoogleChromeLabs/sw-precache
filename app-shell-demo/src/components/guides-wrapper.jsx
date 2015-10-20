import React from 'react';
import {Link} from 'react-router';

class GuideItemWrapper extends React.Component {
  render() {
    return <li><Link to={this.props.to}>{this.props.title}</Link></li>;
  }
}

export default class GuidesWrapper extends React.Component {
  render() {
    const GUIDE_PREFIX = 'guide/';
    let guides = this.props.guides || [];

    return (
      <ul>
        {guides.map(guide => {
          return <GuideItemWrapper key={guide.get('guideid')}
                                   to={GUIDE_PREFIX + guide.get('guideid')}
                                   title={guide.get('title')}/>;
        })}
      </ul>
    );
  }
}
