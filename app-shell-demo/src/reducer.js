import {handleActions} from 'redux-actions';
import {default as Immutable, fromJS} from 'immutable';

let reducer = handleActions({
  LOAD_URL: (state, action) => ({
    urlToResponse: state.urlToResponse.set(action.payload.url, fromJS(action.payload.json))
  })
}, {urlToResponse: new Immutable.Map()});

export default reducer;
