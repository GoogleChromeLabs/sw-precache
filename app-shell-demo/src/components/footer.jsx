import React from 'react';
import {Link} from 'react-router';

export default class Footer extends React.Component {
  render() {
    return (
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/guides">Guides</Link></li>
        <li><Link to="/shell">Shell</Link></li>
      </ul>
    );
  }
}
