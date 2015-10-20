import fetch from 'isomorphic-fetch';
import {createAction} from 'redux-actions';

let loadUrl = createAction('LOAD_URL', url => {
  return fetch(url).then(response => response.json()).then(json => {
    return {url, json};
  });
});

export {loadUrl};
