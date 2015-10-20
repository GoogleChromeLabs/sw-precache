import fetch from 'isomorphic-fetch';
import {createAction} from 'redux-actions';

/* export function loadUrl(url) {
  console.log('called loadUrl', url);
  return dispatch => {
    console.log('dispatch and fetch', dispatch, fetch);
    dispatch({type: 'FETCHING_STARTED'});

    return fetch(url).then(response => {
      if (response.ok) {
        return response.json();
      }
      throw Error(`Request for ${url} failed: HTTP ${response.code}, ${response.statusText}`);
    }).then(json => {
      console.log('fetching done', json);
      dispatch({
        type: 'FETCHING_COMPLETE',
        payload: {
          url: url,
          json: json
        }
      });
    }).catch(error => {
      dispatch({
        type: 'FETCHING_FAILED',
        payload: error,
        error: true
      });
    });
  };
} */

let loadUrl = createAction('LOAD_URL', url => {
  return fetch(url).then(response => response.json()).then(json => {
    return {url, json};
  });
});

export {loadUrl};
