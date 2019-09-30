/**
 * reducer 
 */
import { combineReducers } from "redux";
import appSettings from "./appSettings";
import Auth from './auth/reducer';

const reducers = combineReducers({
   appSettings,
   Auth,
});

export default reducers;