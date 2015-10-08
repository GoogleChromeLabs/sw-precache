import React from 'react';
import {Link} from 'react-router'

export default class Hello extends React.Component {
  render() {
    return <Link to="thanks">Want to be thanked?</Link>;
  }
}
