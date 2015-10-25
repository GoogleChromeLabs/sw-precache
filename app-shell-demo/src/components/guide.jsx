import * as Actions from '../actions';
import GuideWrapper from './guide-wrapper';
import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

const GUIDE_URL_PREFIX = 'https://www.ifixit.com/api/2.0/guides/';

@connect(state => ({urlToResponse: state.urlToResponse}))
export default class Guide extends React.Component {
  static fetchData(dispatch, props) {
    let url = GUIDE_URL_PREFIX + props.params.guideId;
    let boundActions = bindActionCreators(Actions, dispatch);
    return boundActions.loadUrl(url);
  }

  static needsStyles() {
    return 'guide.css';
  }

  componentDidMount() {
    let url = GUIDE_URL_PREFIX + this.props.params.guideId;
    if (this.props.urlToResponse.get(url) === undefined) {
      this.constructor.fetchData(this.props.dispatch, this.props);
    }
  }

  render() {
    let url = GUIDE_URL_PREFIX + this.props.params.guideId;
    let guide = this.props.urlToResponse.get(url);

    return (
      <div>
        <GuideWrapper guide={guide} {...bindActionCreators(Actions, this.props.dispatch)}/>
      </div>
    );
  }
}
