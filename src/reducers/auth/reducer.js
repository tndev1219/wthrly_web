import actions from "./actions";

const initState = { 
   idToken: null,
   clientName: null,
   isSubscribed: null 
};

export default function authReducer(state = initState, action) {
   switch (action.type) {
      case actions.LOGIN_SUCCESS:
         return {
            idToken: action.token,
            clientName: action.clientName,
            isSubscribed: action.isSubscribed
         };
      case actions.AUTHORIZATION_CHECK_SUCCESS:
         return {
            idToken: action.token,
            clientName: action.clientName,
            isSubscribed: action.isSubscribed
         };
      case actions.LOGOUT:
         return initState;
      default:
         return state;
   }
}
