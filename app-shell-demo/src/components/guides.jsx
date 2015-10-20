import React from 'react';

export default class Guides extends React.Component {
  render() {
    return (
      <ul id="guides">
        {JSON.stringify(this.props.guides)}
      </ul>
    );
  }
}
