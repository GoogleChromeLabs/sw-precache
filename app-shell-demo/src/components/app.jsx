import React from 'react';

import Footer from './footer';
import Header from './header';

export default class App extends React.Component {
  render() {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
}
