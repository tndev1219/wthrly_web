import authActions from './auth/actions';

import { store } from "../index";

export default () =>
  new Promise(() => {
    store.dispatch(authActions.checkAuthorization());
  });
