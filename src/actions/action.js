/**
 * Action Types
 */
import {
   COLLAPSED_SIDEBAR,
   SHOW_ALERT,
   HIDE_ALERT,
   SAVE_MESSAGE_TITLE,
   SAVE_SELECTED_LOCATION
} from './types';

//show alert box
export const showAlert = (message, type) => ({
   type: SHOW_ALERT,
   payload: { message, type }
})

//hide alert box
export const hideAlert = () => ({
   type: HIDE_ALERT,
})

//Redux Action To Emit Collapse Sidebar
export const collapsedSidebarAction = (isCollapsed) => ({
   type: COLLAPSED_SIDEBAR,
   isCollapsed
});

//for give the headline to message add page from message page
export const saveMessageTitle = (title) => ({
   type: SAVE_MESSAGE_TITLE,
   payload: { title }
})

//for give the selected location to message add page from message page
export const saveSelectedLocation = (location) => ({
   type: SAVE_SELECTED_LOCATION,
   payload: { location }
})
