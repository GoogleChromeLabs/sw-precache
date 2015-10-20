import React from 'react';

export default class GuidesWrapper extends React.Component {
  render() {
    let guide = this.props.guide || {};

    return (
      <ul>
        {JSON.stringify(guide)}
      </ul>
    );
  }
}
