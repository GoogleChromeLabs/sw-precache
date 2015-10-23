import React from 'react';

export default class App extends React.Component {
  render() {
    return (
      <article>
        {this.props.children}
      </article>
    );
  }
}
