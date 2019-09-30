import "core-js/stable";
import "regenerator-runtime/runtime";
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import App from './App';
import registerServiceWorker from './registerServiceWorker';
import { history } from './util/History';
import { Router, Switch, Route } from 'react-router-dom';

// configureStore 
import { configureStore } from './store/index';

// Boot 
import Boot from './reducers/boot';

// store
export const store = configureStore();

Boot();

ReactDOM.render(
   <Provider store={store}>
      <Router history={history}>
         <Switch>
            <Route path="/" component={App} />
         </Switch>
      </Router>
   </Provider>
   , document.getElementById('root'));

registerServiceWorker();
