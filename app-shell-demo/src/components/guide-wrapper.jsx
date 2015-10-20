import React from 'react';

export default class GuidesWrapper extends React.Component {
  render() {
    let guide = this.props.guide;
    if (!guide) {
      return <h3>Loading...</h3>;
    }

    return (
      <div>
        <h1>{guide.get('title')}</h1>
        <h3>By {guide.get('author').get('username')}</h3>
        <h4>Last updated on {new Date(guide.get('modified_date') * 1000).toDateString()}</h4>
      </div>
    );
  }
}
