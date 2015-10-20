import {handleActions} from 'redux-actions';
import Immutable from 'immutable';

let reducer = handleActions({
  LOAD_URL: (state, action) => ({
    urlToResponse: state.urlToResponse.set(action.payload.url, action.payload.json)
  })
}, {urlToResponse: new Immutable.Map()});

export default reducer;
