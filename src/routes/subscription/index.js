/**
 * Messaging Page
 */
/* eslint-disable */
import React, { Fragment } from 'react';
import { connect } from "react-redux";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { Link } from 'react-router-dom';  

//component
import PageTitle from '../../components/widgets/PageTitle';
import parse from '../../parse/parse';
import { showAlert } from "../../actions/action";
import authAction from '../../reducers/auth/actions';

import { Products, PRODUCT_PLANS, STRIPE_PUBLISHABLE_KEY } from '../../constants/Consts';

import styled from "styled-components";
import StripeCheckout from "react-stripe-checkout";
import Parse from 'parse/node';

const Colors = {
   aqua: "#33cccc",
   grey: "#666",
   lightGrey: "#ccc",
   red: "#cc0000"
};

const SubscriptionPlansWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 30px;
`;

const SubscriptionPlanCard = styled.div`
  margin: auto;
  padding: 10px;
  border-radius: 8px;
  border-top: 90px solid ${Colors.aqua};
  height: auto;
  box-shadow: 0 2px 2px 0 rgba(14, 30, 37, 0.32);
`;

const SubscriptionPlanCardHeader = styled.div`
  margin-top: -80px;
  text-align: center;
`;

const SubscriptionPlanCardHeaderText1 = styled.p`
  color: white;
  font-size: 26px;
  line-height: 1rem;
`;

const SubscriptionPlanCardHeaderText2 = styled.p`
  color: white;
  font-size: 30px;
  line-height: 3.25rem;
`;

const SubscriptionPlanCardHeading = styled.h2`
  text-align: center;
  font-size: 1.65em;
  color: ${Colors.aqua};
  padding: 7px;
  text-transform: capitalize;
  margin-top: 40px;
`;

const SubscriptionPlanCardPrice = styled.h2`
  color: ${Colors.aqua};
  text-align: center;
  font-size: 2.95em;
`;

const CurrencySymbol = styled.span`
  color: ${Colors.grey};
  font-size: 0.5em;
`;

const SubscriptionPlanCardSubHeading = styled.p`
  color: ${Colors.aqua};
  font-weight: 100;
  text-align: center;
  border-bottom: 1px dotted ${Colors.lightGrey};
  padding-bottom: 10px;
`;

class HomePage extends React.Component {

   constructor(props) {
      super(props);
      this.state = {
         waiting: false,
         user: null
      };
   }

   UNSAFE_componentWillMount() {
      this._isMounted = true;
      const self = this;
      self._isMounted && parse.createUserFromToken( self.props.token, function( err, user ){
         if (err) {
            self._isMounted && self.props.logout();
         } else { 
            self._isMounted && self.setState({user});
         }
      });
      // var res = await Axios.get('https://api.stripe.com/v1/plans', {
      //    auth: {
      //       username: 'sk_live_GNB7bAYrlizDFpA7gOVO1gup',
      //       password: ''
      //    }
      // })
      // var res = await Axios({
      //    method: 'get',
      //    url: 'https://api.stripe.com/v1/plans',
      //    withCredentials: true,
      //    auth: {
      //       username: 'sk_live_GNB7bAYrlizDFpA7gOVO1gup',
      //       password: ''
      //    }
      // })
      // console.log(res)
   }

   sendEmail = (params) => {
      Parse.Cloud.run('sendEmail', params)
      .then((res) => {
      })
      .catch((err) => {
         console.log(JSON.parse(JSON.stringify(err)));
      });
   }

   subscribeToProductPlan = (token, productPlan) => {
      var self = this;
      var params = {
         email: token.email,
         source: token.id
      };

      this.setState({ waiting: true });

      Parse.Cloud.run('createStripeCustomer', params)
         .then((res) => {
            params = {
               customer: res.data.id,
               items: [
                  {
                     plan: productPlan
                  }
               ],
               expand: ['latest_invoice.payment_intent']
            };
            Parse.Cloud.run('createStripeSubscription', params)
            .then((res) => {
               if ( res.data.latest_invoice.payment_intent === null || (res.data.latest_invoice.payment_intent && res.data.latest_invoice.payment_intent.status === 'succeeded')) {

                  parse.UpdateSubscription(self.state.user, res.data.latest_invoice.payment_intent, res.data.trial_start, res.data.trial_end, res.data.created, res.data.current_period_start, res.data.current_period_end, res.data.plan.interval, res.data.id, function(err, res) {
                     if (err) {
                        self.props.showAlert(err.message, 'error');
                        self.setState({ waiting: false });
                     } else {
                        var isSubscribed = true;
                        self.props.login(self.props.token, self.props.clientName, isSubscribed);
                     }
                  });

                  // send mail to manager
                  params = {
                     status: 'success',
                     sub_info: res,
                     clientName: self.props.clientName
                  };
                  
                  self.sendEmail(params);

               } else if (res.data.latest_invoice.payment_intent.status === 'requires_payment_method') {
                  self.setState({ waiting: false });
                  self.props.showAlert('Subscription failed. Please use another payment method.', 'error');

                  // send mail to manager and user
                  params = {
                     status: 'fail',
                     sub_info: res,
                     clientName: self.props.clientName,
                     clientEmail: self.state.user.get('username'),
                     errorMessage: 'There is a problem with payment method. Please use a another payment method.'
                  };

                  self.sendEmail(params);

               } else if (res.data.latest_invoice.payment_intent.status === 'requires_action') {
                  self.setState({ waiting: false });
                  self.props.showAlert('Currently payment method require additional steps. Please complete payment process.', 'error');

                  // send mail to manager and user
                  params = {
                     status: 'fail',
                     sub_info: res,
                     clientName: self.props.clientName,
                     clientEmail: self.state.user.get('username'),
                     errorMessage: 'Currently payment method require additional steps. Please complete payment process.'
                  };

                  self.sendEmail(params);
               }
            })
            .catch((err) => {
               console.log(JSON.parse(JSON.stringify(err)));
               self.props.showAlert('There was an error creating the Subscription in Stripe', 'error');
               self.setState({ waiting: false });
            });
         }) 
         .catch((err) => {
            console.log(JSON.parse(JSON.stringify(err)));
            self.props.showAlert('There was an error creating the Customer in Stripe', 'error');
            self.setState({ waiting: false });
         })
   }

   render() {
      return (
         <Fragment>
            <PageTitle
               title="Select your plan"
               // desc="Select 30 days Trial + Monthly Subscription or Annual Subscription here."
            />
            <div className="container">
               {this.state.user &&
               <SubscriptionPlansWrapper>
                  <Grid container spacing={5} direction="row" justify="center" alignItems="center">
                     {PRODUCT_PLANS.map((product, key) => (
                        <Grid item xs={11} sm={6} md={5} lg={3} key={key}>
                           <SubscriptionPlanCard>
                              {product.interval === 'monthly' ?
                                 <SubscriptionPlanCardHeader>
                                    <SubscriptionPlanCardHeaderText1>Monthly.</SubscriptionPlanCardHeaderText1>
                                    <SubscriptionPlanCardHeaderText1>Cancel at any time.</SubscriptionPlanCardHeaderText1>
                                 </SubscriptionPlanCardHeader>
                              :
                                 <SubscriptionPlanCardHeader>
                                    <SubscriptionPlanCardHeaderText2>Save over 25%</SubscriptionPlanCardHeaderText2>
                                 </SubscriptionPlanCardHeader>
                              }
                              <SubscriptionPlanCardHeading>
                                 {product.interval}
                              </SubscriptionPlanCardHeading>
                              <SubscriptionPlanCardPrice>
                                 <CurrencySymbol>£</CurrencySymbol>&nbsp;{product.price/100}
                              </SubscriptionPlanCardPrice>
                              <SubscriptionPlanCardSubHeading>
                                 billed {product.interval}
                              </SubscriptionPlanCardSubHeading>
                              <SubscriptionPlanCardSubHeading>
                                 {product.name}
                                 {/* {product.description} */}
                              </SubscriptionPlanCardSubHeading>
                              <br />
                              <br />
                              <StripeCheckout
                                 name="Subscription"
                                 description={`${product.name} Package`}
                                 token={token => this.subscribeToProductPlan(token, product.id)}
                                 email={this.state.user.get('username')}
                                 allowRememberMe={false}
                                 panelLabel="Subscribe"
                                 stripeKey={STRIPE_PUBLISHABLE_KEY}
                              >
                                 <Button className="button btn-disabled" style={{display: 'flex', margin: 'auto', width: '-webkit-fill-available'}} disabled={this.state.waiting}>Select This Plan</Button>
                              </StripeCheckout>
                           </SubscriptionPlanCard>
                        </Grid>
                     ))}             
                     <Grid  item xs={12} sm={12} md={12} lg={12}>
                        <p className="lead ml-40 mt-40">Continue with <Link to="/home">FREE Plan</Link> for limited time</p>
                     </Grid>
                  </Grid>
               </SubscriptionPlansWrapper>}
            </div>            
         </Fragment>
      )
   }
}

// map state to props
const mapStateToProps = state => {
   const token = state.Auth.idToken;
   const clientName = state.Auth.clientName;
   return { token, clientName };
}

export default connect(
   mapStateToProps, 
   {
      showAlert, 
      login: authAction.login,
      logout: authAction.logout
   })(HomePage);