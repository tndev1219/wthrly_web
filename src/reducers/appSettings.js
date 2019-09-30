/**
 * App Settings
 */
//data
import { languages } from "../assets/data/localeData";

//action types
import {
   HIDE_ALERT,
   SHOW_ALERT,
   COLLAPSED_SIDEBAR,
   SAVE_MESSAGE_TITLE,
   SAVE_SELECTED_LOCATION
} from "../actions/types";

//app config
import AppConfig from "../constants/AppConfig";

const INITIAL_STATE = {
   languages,
   selectedLocale: AppConfig.locale,
   showAlert: false,
   alertType: 'success',
   alertMessage: 'Initial Message',
   navCollapsed: AppConfig.navCollapsed,
   messageTitle: '',
   selectedLocation: null
};

export default (state = INITIAL_STATE, action) => {
   switch (action.type) {
      // collapse sidebar
      case COLLAPSED_SIDEBAR:
         return { ...state, navCollapsed: action.isCollapsed };
      case SHOW_ALERT:
         return {
            ...state,
            showAlert: true,
            alertMessage: action.payload.message,
            alertType: action.payload.type
         }
      case HIDE_ALERT:
         return {
            ...state,
            showAlert: false
         }
      case SAVE_MESSAGE_TITLE:
         return {
            ...state,
            messageTitle: action.payload.title
         }
      case SAVE_SELECTED_LOCATION:
         return {
            ...state,
            selectedLocation: action.payload.location
         }
      default:
         return { ...state };
   }
}