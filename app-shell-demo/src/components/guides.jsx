import * as Actions from '../actions';
import GuidesWrapper from './guides-wrapper';
import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

const GUIDE_URL = 'https://www.ifixit.com/api/2.0/guides/featured';

@connect(state => ({guides: state.urlToResponse.get(GUIDE_URL)}))
export default class Guides extends React.Component {
  static fetchData(dispatch) {
    let boundActions = bindActionCreators(Actions, dispatch);
    return boundActions.loadUrl(GUIDE_URL);
  }

  componentDidMount() {
    if (this.props.guides === undefined) {
      this.constructor.fetchData(this.props.dispatch);
    }
  }

  render() {
    let {guides, dispatch} = this.props;

    return (
      <div>
        <GuidesWrapper guides={guides} {...bindActionCreators(Actions, dispatch)}/>
      </div>
    );
  }
}
