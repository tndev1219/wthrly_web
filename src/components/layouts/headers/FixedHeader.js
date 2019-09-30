/**
 * Fixed header component
 */
/* eslint-disable */
import React from 'react';
import { connect } from "react-redux";
import Grid from "@material-ui/core/Grid";

// components
import HeaderMenu from "./HeaderMenu";
import SidebarMenu from '../sidebar';
import AppConfig from '../../../constants/AppConfig';

class FixedHeader extends React.Component {
   render() {
      return (
         <div className="iron-fixed-header bg-primary">
            <div className="container">
               <Grid container spacing={0} >
                  <Grid item xs={10} sm={10} md={4} lg={4} xl={5} className="d-flex justify-content-start align-items-center" >
                     <div className="iron-app-logo text-md-center">
                        <img src={AppConfig.AppLogo} alt="header-logo"/>
                        <div>{this.props.clientName} - Admin</div>
                     </div>
                  </Grid>
                  <Grid item xs={2} sm={2} md={8} lg={8} xl={7} >
                     <div className="text-right">
                        <HeaderMenu />
                        <SidebarMenu />
                     </div>
                  </Grid>
               </Grid>
            </div>
         </div>
      );      
   }
}

// map state to props
const mapStateToProps = state => {
   const clientName = state.Auth.clientName;
   return { clientName };
}

export default connect(mapStateToProps, {})(FixedHeader);