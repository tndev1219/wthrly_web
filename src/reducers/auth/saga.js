import { all, takeEvery, put, fork } from 'redux-saga/effects';
import { push } from 'react-router-redux';
import actions from './actions';
import { clearToken, getToken, getClientName, getSubscriptionStatus } from '../../util';

export function* loginRequest() {
   yield takeEvery('LOGIN_REQUEST', function*(payload) {
      yield put({});
   });
}

export function* loginSuccess() {
   yield takeEvery(actions.LOGIN_SUCCESS, function*(payload) {
      yield localStorage.setItem('id_token', payload.token);
      yield localStorage.setItem('id_clientName', payload.clientName);
      yield localStorage.setItem('id_subscribe', payload.isSubscribed);
      yield put(push('/subscription'));
   });
}

export function* loginError() {
   yield takeEvery(actions.LOGIN_ERROR, function*() {
      yield alert("Login Failed. Please try again later...");
   });
}

export function* logout() {
   yield takeEvery(actions.LOGOUT, function*() {
      clearToken();
      yield put(push('/sign-in'));
   });
}
export function* checkAuthorization() {
   yield takeEvery(actions.CHECK_AUTHORIZATION, function*() {
      const token = getToken();
      const clientName = getClientName();
      const isSubscribed = getSubscriptionStatus();
      if (token && clientName) {
         yield put({ type: actions.AUTHORIZATION_CHECK_SUCCESS, token, clientName, isSubscribed });
      }
   });
}
export default function* rootSaga() {
  yield all([
    fork(checkAuthorization),
    fork(loginRequest),
    fork(loginSuccess),
    fork(loginError),
    fork(logout)
  ]);
}
