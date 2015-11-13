import * as Actions from '../actions';
import GuidesWrapper from './guides-wrapper';
import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

class Search extends React.Component {
  static fetchData(dispatch, props) {
    let url = `https://www.ifixit.com/api/2.0/search/${props.params.query}?filter=guide`;
    let boundActions = bindActionCreators(Actions, dispatch);
    return boundActions.loadUrl(url);
  }

  static needsStyles() {
    return 'guides.css';
  }

  componentDidMount() {
    let url = `https://www.ifixit.com/api/2.0/search/${this.props.params.query}?filter=guide`;
    if (this.props.urlToResponse.get(url) === undefined) {
      this.constructor.fetchData(this.props.dispatch, this.props);
    }
  }

  render() {
    let url = `https://www.ifixit.com/api/2.0/search/${this.props.params.query}?filter=guide`;
    let results = this.props.urlToResponse.get(url);
    let guides = results ? results.get('results') : null;

    return (
      <div>
        <div id="title-bar">{`iFixit Guides: '${this.props.params.query}'`}</div>
        <GuidesWrapper guides={guides} {...bindActionCreators(Actions, this.props.dispatch)}/>
      </div>
    );
  }
}

export default connect(state => ({urlToResponse: state.urlToResponse}))(Search);
