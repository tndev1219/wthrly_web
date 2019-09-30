/* eslint-disable */
/**
 * Header menu component
 */
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { connect } from "react-redux";

// intl messages
import IntlMessages from '../../../util/IntlMessages';

// nav links
import navLinks from '../../../assets/data/NavLinks.js';

//action
import authAction from '../../../reducers/auth/actions';

class HeaderMenu extends Component {
   logout = () => {
      this.props.logout();
   }
   render() {
      return (
         <div className="horizontal-menu">
            <ul className="d-inline-block iron-header-menu mb-0">
               {navLinks.map((navLink, index) => {
                  return(
                     navLink.menu_title === "menu.logout" ?
                        <li key={index} onClick={this.logout}>
                           <Link to={navLink.path}><IntlMessages id={navLink.menu_title} /></Link>
                        </li>
                        :
                        <li key={index}>
                           <Link to={navLink.path}><IntlMessages id={navLink.menu_title} /></Link>
                        </li>
                  )
               })}
            </ul>
         </div>
      );     
   }
}

export default connect(null, {logout: authAction.logout})(HeaderMenu);
