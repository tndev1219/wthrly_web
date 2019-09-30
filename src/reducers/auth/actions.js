const actions = {
   CHECK_AUTHORIZATION: 'CHECK_AUTHORIZATION',
   AUTHORIZATION_CHECK_SUCCESS: 'AUTHORIZATION_CHECK_SUCCESS',
   LOGIN_REQUEST: 'LOGIN_REQUEST',
   LOGOUT: 'LOGOUT',
   LOGIN_SUCCESS: 'LOGIN_SUCCESS',
   LOGIN_ERROR: 'LOGIN_ERROR',
   checkAuthorization: () => ({ type: actions.CHECK_AUTHORIZATION }),
   login: (token, clientName, isSubscribed) => ({
      type: actions.LOGIN_SUCCESS,
      token,
      clientName,
      isSubscribed
   }),
   logout: () => ({
      type: actions.LOGOUT
   }),
   signup: () => ({
      type: actions.SIGNUP_REQUEST
   })
};
export default actions;
