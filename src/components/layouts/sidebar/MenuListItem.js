/**
 * Menu List Item
 */
import React, { Component } from 'react';
import { connect } from "react-redux";
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import { Link } from 'react-router-dom';
import Button from '@material-ui/core/Button';

//Intl message
import IntlMessages from '../../../util/IntlMessages';

//action
import authAction from '../../../reducers/auth/actions';

class MenuListItem extends Component {

   logout = () => {
      this.props.logout();
      this.props.closeDrawer();
   }

   render() {
      const { menu } = this.props;
      return (
         <ListItem button component="li">
         {menu.menu_title === "menu.logout" ? 
            <Button
               to={menu.path}
               component={Link}
               className="tab-element"
               onClick={this.logout}
            >
               <ListItemIcon>
                  <i className="material-icons">{menu.icon}</i>
               </ListItemIcon>
               <IntlMessages id={menu.menu_title} />
            </Button>
            : 
            <Button
               to={menu.path}
               component={Link}
               className="tab-element"
               onClick={this.props.closeDrawer}
            >
               <ListItemIcon>
                  <i className="material-icons">{menu.icon}</i>
               </ListItemIcon>
               <IntlMessages id={menu.menu_title} />
            </Button>
         }
         </ListItem>
      );
   }
}

export default connect(null, {logout: authAction.logout})(MenuListItem);
