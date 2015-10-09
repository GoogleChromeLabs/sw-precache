import React from 'react'; // eslint-disable-line no-unused-vars
import {Route, IndexRoute} from 'react-router';

import App from './components/app';
import List from './components/list';
import Shell from './components/shell';
import NotFound from './components/notfound';
import Welcome from './components/welcome';

export default (
  <Route path="/" component={App}>
    <IndexRoute component={Welcome}/>
    <Route path="shell" component={Shell}/>
    <Route path="list" component={List}/>
    <Route path="*" component={NotFound}/>
  </Route>
);
