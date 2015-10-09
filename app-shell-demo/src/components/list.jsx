import React from 'react';
import {connect} from 'react-redux';

@connect(state => ({urls: state.urlReducer}))
export default class List extends React.Component {
  render() {
    const {urls, dispatch} = this.props;

    return (
      <div>
        {urls.first()}
      </div>
    );
  }
}
