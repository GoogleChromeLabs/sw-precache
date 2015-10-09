import Immutable from 'immutable';

const defaultState = Immutable.Map().set('http://a.com', {number: 34}); // eslint-disable-line new-cap

export default function urlReducer(state = defaultState, action = {}) {
  switch (action.type) {
    case 'LOAD_URL':
      return state.set(action.url, {number: Math.random()});
    default:
      return state;
  }
}
