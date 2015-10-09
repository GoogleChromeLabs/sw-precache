import React from 'react';
import {Link} from 'react-router';

export default class Welcome extends React.Component {
  render() {
    return (
      <div>
        <p>Welcome to the web app!</p>
        <p>Let's <Link to="list">explore</Link>!</p>
      </div>
    );
  }
}
