import Immutable from 'immutable';

const defaultState = new Immutable.Map(); // eslint-disable-line new-cap

export default function urlReducer(state = defaultState, action = {}) {
  switch (action.type) {
    case 'LOAD_URL':
      return state.set(action.payload.url, action.payload.json);
    default:
      return state;
  }
}
