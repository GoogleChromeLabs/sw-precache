import * as Actions from '../actions';
import Guides from './guides';
import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

@connect(state => ({urls: state.urlReducer}))
export default class List extends React.Component {
  static fetchData(dispatch) {
    var boundActions = bindActionCreators(Actions, dispatch);
    return boundActions.loadUrl('https://www.ifixit.com/api/2.0/guides/featured');
  }

  componentDidMount() {
    console.log('componentDidMount', this.props);
    if (this.props.urls.size === 0) {
      this.constructor.fetchData(this.props.dispatch);
    }
  }

  render() {
    const {urls, dispatch} = this.props;

    return (
      <div>
        <Guides urls={urls} {...bindActionCreators(Actions, dispatch)}/>
      </div>
    );
  }
}
