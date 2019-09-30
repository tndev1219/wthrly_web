/**
 * store
 */

import { createStore, applyMiddleware } from 'redux';
// import Thunk from "redux-thunk";
import createSagaMiddleware from 'redux-saga';
import { routerMiddleware } from 'react-router-redux';
import reducers from '../reducers';
import rootSaga from '../reducers/sagas';
import { history } from '../util/History';

// const middleware = applyMiddleware(Thunk)
const routersMiddleware = routerMiddleware(history);
// create the saga middlewar
const sagaMiddleware = createSagaMiddleware();
const middleware = applyMiddleware(sagaMiddleware, routersMiddleware);

export function configureStore() {
  const store = createStore(
    reducers,
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
    middleware
  )
  sagaMiddleware.run(rootSaga);
  return store;
}

