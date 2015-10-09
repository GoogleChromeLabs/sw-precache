import React from 'react';
import {RouteHandler} from 'react-router';

import Footer from './footer';
import Header from './header';

export default class App extends React.Component {
  render() {
    return (
      <div>
        <Header/>
        <RouteHandler/>
        <Footer/>
      </div>
    );
  }
}
