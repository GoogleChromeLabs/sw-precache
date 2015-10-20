import * as Actions from '../actions';
import Guides from './guides';
import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

const GUIDE_URL = 'https://www.ifixit.com/api/2.0/guides/featured';

@connect(state => ({guides: state.urlToResponse.get(GUIDE_URL)}))
export default class List extends React.Component {
  static fetchData(dispatch) {
    var boundActions = bindActionCreators(Actions, dispatch);
    return boundActions.loadUrl(GUIDE_URL);
  }

  componentDidMount() {
    console.log('componentDidMount', this.props);
    if (this.props.guides === undefined) {
      this.constructor.fetchData(this.props.dispatch);
    }
  }

  render() {
    const {guides, dispatch} = this.props;

    return (
      <div>
        <Guides guides={guides} {...bindActionCreators(Actions, dispatch)}/>
      </div>
    );
  }
}
