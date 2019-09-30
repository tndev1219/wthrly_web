/**
 * site header one component
 */
/* eslint-disable */
import React from 'react';
import { connect } from "react-redux";
import AppBar from '@material-ui/core/AppBar';
import Grid from "@material-ui/core/Grid";

// components
import HeaderMenu from "./HeaderMenu";
import SidebarMenu from '../sidebar';
import FixedHeader from './FixedHeader';
import AppConfig from '../../../constants/AppConfig';

class Header extends React.Component {
   constructor(props) {
      super(props);
      this.state = {
         fixedHeader: false   
      };
   }

   UNSAFE_componentWillMount() {
      window.addEventListener('scroll', this.hideBar);
   }

   componentWillUnmount() {
      window.removeEventListener('scroll', this.hideBar);
   }

   // function to show and hide fixed header
   hideBar = () => {
      const { fixedHeader } = this.state;
      this.scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      this.scrollTop >= 200 ?
         !fixedHeader && this.setState({ fixedHeader: true })
         :
         fixedHeader && this.setState({ fixedHeader: false });
   };

   render() {
      return (
         <div>
            <AppBar position="static" className={`iron-header-wrapper bg-primary iron-header-v1 ${(this.state.fixedHeader) ? 'header-fixed' : ''}`}>
               <div className="iron-header-top py-30">
                  <div className="container">                     
							<div className="iron-app-logo text-md-center">
                        <img src={AppConfig.AppLogo} alt="header-logo" />
   							<div>{this.props.clientName} - Admin</div>
							</div>                        
                  </div>
               </div>
               <div className="iron-header-bottom">
                  <div className="container">
                     <Grid container spacing={0} >
                        <Grid item xs={12} sm={12} md={12} lg={12} xl={12} >
                           <div className="text-center position-relative">
                              <HeaderMenu />
                              <SidebarMenu />
                           </div>
                        </Grid>
                     </Grid>
                  </div>
               </div>
               <FixedHeader />
            </AppBar>
         </div>
      );
   }
}

// map state to props
const mapStateToProps = state => {
   const clientName = state.Auth.clientName;
   return { clientName };
}

export default connect(mapStateToProps, {})(Header);