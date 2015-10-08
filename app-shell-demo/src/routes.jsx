import React from 'react'; // eslint-disable-line no-unused-vars
import {Route} from 'react-router';

import App from './components/app';
import Hello from './components/hello';
import Shell from './components/shell';
import Thanks from './components/thanks';

export default (
  <Route path="/" handler={App}>
    <Route name="thanks" handler={Thanks} />
    <Route name="shell" handler={Shell} />
    <Route path="*" handler={Hello} />
  </Route>
);
