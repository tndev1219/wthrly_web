/**
 * Sign in form
 */
import React from 'react';

import { Link } from 'react-router-dom';

// Material ui
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import CircularProgress from '@material-ui/core/CircularProgress';

import { connect } from "react-redux";
import Parse from 'parse/node';

import authAction from "../../../reducers/auth/actions";
import { showAlert } from "../../../actions/action";
import parse from '../../../parse/parse';

const { login } = authAction;

class SignIn extends React.Component {
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
   }

   handleValidation = () => {
      let fields = this.state.fields;
      let errors = {};
      let formIsValid = true;
  
      //Email
      if (!fields["userName"]) {
         formIsValid = false;
         errors["userName"] = true;
      }
  
      //Password
      if (!fields["password"]) {
         formIsValid = false;
         errors["password"] = true;
      }
  
      this.setState({ errors: errors });
      return formIsValid;
   };

   handleSubmit = () => {
      const { login, showAlert } = this.props;
      const loginData = this.state.fields;
      const self = this;

      this.setState({ waiting: true });

      parse.getTokenForUsernamePassword(loginData.userName, loginData.password, function(err, token, clientName){
         if (err) {
            showAlert(err.message, 'error');
            self.setState({ waiting: false });
         } else {
            parse.createUserFromToken(token, function(err, user) {
               if (err) {
                  showAlert(err.message, 'error');
                  self.setState({ waiting: false });
               } else {
                  parse.getSubscriptionId(user, function(err, res) {
                     if (err) {
                        showAlert(err.message, 'error');
                        self.setState({ waiting: false });
                     } else {
                        if (!res) {
                           var isSubscribed = false;
                           self.setState({ waiting: false });
                           login(token, clientName, isSubscribed);
                        } else {
                           var params = {
                              id: res.sub_id
                           };

                           Parse.Cloud.run('getStripeSubscriptionStatus', params)
                              .then((sub_info) => {
                                 if (sub_info.data.latest_invoice.payment_intent === null || (sub_info.data.latest_invoice.payment_intent && sub_info.data.latest_invoice.payment_intent.status === 'succeeded')) {
                                    parse.UpdateSubscription(user, sub_info.data.latest_invoice.payment_intent, sub_info.data.trial_start, sub_info.data.trial_end, sub_info.data.created, sub_info.data.current_period_start, sub_info.data.current_period_end, sub_info.data.plan.interval, sub_info.data.id, function(err, res) {
                                       if (err) {
                                          self.props.showAlert(err.message, 'error');
                                          self.setState({ waiting: false });
                                       } else {
                                          var isSubscribed = true;
                                          login(token, clientName, isSubscribed);
                                       }
                                    });
                                 } else {
                                    var isSubscribed = false;
                                    login(token, clientName, isSubscribed);
                                 }
                              })
                              .catch((err) => {
                                 console.log(JSON.parse(JSON.stringify(err)));
                                 self.props.showAlert('There was an error geting the Subscription Information in Stripe', 'error');
                                 self.setState({ waiting: false });
                              });
                        }
                     }
                  });
               }
            });            
         }
      });
   };

   render() {
      return (
         <div>
            <h4>sign in</h4>
            <form>
               <div>
                  <TextField
                     required
                     label="UserName"
                     className="iron-form-input-wrap"
                     type="text"
                     name="userName" 
                     error={this.state.errors["userName"]} 
                     autoComplete="current-userName"
                     onChange={this.handleChange}
                  />
               </div>
               <div className="mb-15">
                  <TextField
                     required
                     label="Password"
                     className="iron-form-input-wrap"
                     type="password"
                     name="password" 
                     error={this.state.errors["password"]} 
                     autoComplete="current-password"
                     onChange={this.handleChange}
                  />
               </div>
               <div className="item-center">
                  <Button className="button btn-active btn-lg mb-25" onClick={this.handleClick} disabled={this.state.waiting}>
                     sign in
                  </Button>
                  {this.state.waiting && <CircularProgress size={24} className="btn-auth-spin" />}
               </div>
               <div className="item-center">
                  <p className="mb-0">Don't have an account? <Link to="/sign-up">Click here to create one</Link></p>
               </div>
            </form>
         </div>
      )
   }
}

export default connect(
   state => ({
     isLoggedIn: state.Auth.idToken !== null ? true : false
   }),
   { login, showAlert }
 )(SignIn);