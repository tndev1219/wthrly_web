/**
 * Sign In Page
 */
import React, { Component } from 'react';
import Grid from '@material-ui/core/Grid';

//component
import SignIn from '../../../components/global/forms/SignIn';

export default class SignInPage extends Component {

   render() {
      return (
         <div className="iron-sign-in-page-wrap">
            <div className="inner-container">
               <Grid container spacing={5} justify="center" alignItems="center">
                  <Grid item xs={12} sm={12} md={12} lg={12} className="d-flex justify-content-center align-items-center">
                     <img src={require("../../../assets/images/_logo.png")} width="200" alt="sigin-img" />
                  </Grid>
                  <Grid item xs={11} sm={6} md={5} lg={3}>
                     <div className="iron-forgot-pwd-form iron-shadow bg-base p-sm-25 py-20 px-15 rounded">
                        <SignIn />
                     </div>
                  </Grid>
               </Grid>
            </div>
         </div>
      );
   }
}
