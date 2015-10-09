import React from 'react'; // eslint-disable-line no-unused-vars
import {Route} from 'react-router';

import App from './components/app';
import List from './components/list';
import Shell from './components/shell';
import Welcome from './components/welcome';

export default (
  <Route path="/" handler={App}>
    <Route name="shell" handler={Shell}/>
    <Route name="list" handler={List}/>
    <Route path="*" handler={Welcome}/>
  </Route>
);
