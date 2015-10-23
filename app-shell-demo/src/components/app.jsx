import React from 'react';

export default class App extends React.Component {
  render() {
    return (
      <main>
        {this.props.children}
      </main>
    );
  }
}
