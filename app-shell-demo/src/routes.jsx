import React from 'react'; // eslint-disable-line no-unused-vars
import {Route, IndexRoute} from 'react-router';

import App from './components/app';
import Guide from './components/guide';
import Guides from './components/guides';
import NotFound from './components/notfound';
import Shell from './components/shell';

export default (
  <Route path="/" component={App}>
    <IndexRoute component={Guides}/>
    <Route path="shell" component={Shell}/>
    <Route path="guide/:guideId" component={Guide}/>
    <Route path="*" component={NotFound}/>
  </Route>
);
