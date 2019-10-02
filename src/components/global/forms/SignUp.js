/**
 * Sign up form
 */
import React from 'react';

import { Link } from 'react-router-dom';


// Material ui
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import CircularProgress from '@material-ui/core/CircularProgress';

import { connect } from "react-redux";
import authAction from "../../../reducers/auth/actions";
import { showAlert } from "../../../actions/action";
import parse from '../../../parse/parse';
import validator from 'validator';

const { login } = authAction;

class SignUp extends React.Component {
   constructor(props) {
      super(props);
      this.state = {
         fields: {},
         errors: {},
         waiting: false
      };
   }

   handleChange = (e) => {
      let fields = this.state.fields;
      fields[e.target.name] = e.target.value;
      this.setState({ fields });
   }

   handleClick = () => {
      if (this.handleValidation()) {
         this.handleSubmit();
         return true;
      } else {
         return false;
      }
   };

   handleValidation = () => {
      let fields = this.state.fields;
      let errors = {};
      let formIsValid = true;

      //Hotel/Resort Name
      if (!fields["hotelName"]) {
         formIsValid = false;
         errors["hotelName"] = true;
      }

      //Hotel/Resort Website
      if (!fields["websiteUrl"]) {
         formIsValid = false;
         errors["websiteUrl"] = true;
      } else if (!validator.isURL(fields['websiteUrl'], {protocols: ['https']})) {
         formIsValid = false;
         errors["websiteUrl"] = true;
      }

      //Hotel/Resort Telephone
      var phoneNum = fields['phoneNumber'];

      if (!phoneNum) {
         formIsValid = false;
         errors["phoneNumber"] = true;
      } 

      //Email
      if (typeof fields["email"] !== "undefined") {
         let lastAtPos = fields["email"].lastIndexOf('@');
         let lastDotPos = fields["email"].lastIndexOf('.');
   
         if (!(lastAtPos < lastDotPos && lastAtPos > 0 && fields["email"].indexOf('@@') === -1 && lastDotPos > 2 && (fields["email"].length - lastDotPos) > 2)) {
           formIsValid = false;
           errors["email"] = true;
         }
       }
  
      //Password
      if (!fields["password"]) {
         formIsValid = false;
         errors["password"] = true;
      }

      //Confirm Password
      if (!fields["confirmpassword"]) {
         formIsValid = false;
         errors["confirmpassword"] = true;
      }

      if (typeof fields["confirmpassword"] !== "undefined") {
         if (fields["confirmpassword"] !== fields["password"]) {
         formIsValid = false;
         errors["confirmpassword"] = true;
         }
      }
  
      this.setState({ errors: errors });
      return formIsValid;
   };

   handleSubmit = () => {
      const { login, showAlert } = this.props;
      const signupData = this.state.fields;
      const self = this;

      this.setState({ waiting: true });

      const defaultTabs = ['home', 'messages', 'call', 'web']; // list of default tab

      parse.getDefaultTabIcon(defaultTabs, function (err, iconList) {
         if (err) {
            showAlert(err.message, 'error');
         } else {
            parse.addNewUser(signupData.hotelName, signupData.websiteUrl, signupData.phoneNumber, signupData.email, signupData.password, iconList, function(err, token, clientName) {
               self.setState({ waiting: false });

               if (err) {
                  showAlert(err.message, 'error');
               } else {
                  var isSubscribed = false;
                  login(token, clientName, isSubscribed);
               }
            });
         }
      })


   };

   render() {
      return (
         <div>
            <h4>sign up</h4>
            <form>
               <TextField
                  required
                  label="Hotel/Resort Name"
                  className="iron-form-input-wrap"
                  type="text"
                  name="hotelName" 
                  error={this.state.errors["hotelName"]} 
                  onChange={this.handleChange}
               />
               <TextField
                  required
                  label="Hotel/Resort Website"
                  className="iron-form-input-wrap"
                  type="text"
                  name="websiteUrl" 
                  error={this.state.errors["websiteUrl"]} 
                  onChange={this.handleChange}
               />
               <TextField
                  required
                  label="Hotel/Resort Telephone"
                  className="iron-form-input-wrap"
                  type="number"
                  name="phoneNumber" 
                  error={this.state.errors["phoneNumber"]} 
                  onChange={this.handleChange}
               />
               <TextField
                  required
                  label="email"
                  className="iron-form-input-wrap"
                  type="email"
                  name="email" 
                  error={this.state.errors["email"]} 
                  onChange={this.handleChange}
               />
               <TextField
                  required
                  label="Password"
                  className="iron-form-input-wrap"
                  type="password"
                  name="password" 
                  error={this.state.errors["password"]} 
                  onChange={this.handleChange}
               />
               <div className="mb-25">
                  <TextField
                     required
                     label="retype Password"
                     className="iron-form-input-wrap"
                     type="password"
                     name="confirmpassword" 
                     error={this.state.errors["confirmpassword"]} 
                     onChange={this.handleChange}
                  />
               </div>
               <div className="item-center">
                  <Button className="button btn-active btn-lg mb-25" onClick={this.handleClick} disabled={this.state.waiting}>
                     sign up
                  </Button>
                  {this.state.waiting && <CircularProgress size={24} className="btn-auth-spin" />}
               </div>
            </form>
            <div className="item-center">
               <span className="text-14 text-capitalize pt-10 d-inline-block">already have an account ? then <Link to="/sign-in">sign in</Link></span>
            </div>
         </div>
      )
   }
}

export default connect(
   state => ({
     isLoggedIn: state.Auth.idToken !== null ? true : false
   }),
   { login, showAlert }
 )(SignUp);