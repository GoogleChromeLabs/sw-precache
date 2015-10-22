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
