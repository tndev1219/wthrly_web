/**
 * Messaging Page
 */
/* eslint-disable */
import React, { Fragment } from 'react';
import { connect } from "react-redux";
import Grid from '@material-ui/core/Grid';
import CircularProgress from '@material-ui/core/CircularProgress';
import Moment from 'moment';

import Parse from 'parse/node';


//component
import PageTitle from '../../components/widgets/PageTitle';
import parse from '../../parse/parse';
import { showAlert } from "../../actions/action";
import authAction from '../../reducers/auth/actions';

class HomePage extends React.Component {

   constructor(props) {
      super(props);
      this.state = {
         user: null,
         sub_info: null,
         isNotSubscribed: null
      };
      this._isMounted = false;
   }

   UNSAFE_componentWillMount() {
      this._isMounted = true;
      const self = this;

      self._isMounted && parse.createUserFromToken( self.props.token, function( err, user ){
         if (err) {
            self._isMounted && self.props.logout();
         } else { 
            self._isMounted && self.setState({ user });
            self._isMounted && parse.getSubscriptionId(user, function(err, res) {
               if (err) {
                  showAlert(err.message, 'error');
               } else {
                  if (res) {
                     self._isMounted && self.setState({ sub_info: res });
                  } else {
                     self._isMounted && self.setState({ isNotSubscribed: 'You have not subscribed to any plans yet!' });
                  }
               }
            });
         }
      });     
   }

   componentWillUnmount() {
      this._isMounted = false;
   }

   render() {
      var { sub_info, isNotSubscribed } = this.state;

      return (
         <Fragment>
            <PageTitle
               title={`${this.props.clientName} Admin Home`}
               // desc="Subscription Information"
            />
            <div className="container">
               <div>
                  <h4>Subscription Information</h4>
                  {sub_info ? 
                     <div>                     
                        <p className="lead ml-30">Your subscription was created on <strong>{Moment(sub_info.subscription_created*1000).format('MMMM Do, YYYY')}</strong>.</p>
                        {sub_info.interval === 'month' ?
                           sub_info.payment_intent === 'trial' ?
                              <p className="lead ml-30">You are currently subscribed <strong>Monthly</strong> with <strong>Trial</strong> version.</p>
                              :
                              <p className="lead ml-30">You are currently subscribed <strong>Monthly</strong>.</p>
                           :
                           <p className="lead ml-30">You are currently subscribed <strong>Annual</strong>.</p>
                        }
                        {sub_info.payment_intent === 'trial' ?
                           <p className="lead ml-30">Trial version will be completed on <strong>{Moment(sub_info.trial_end*1000).format('MMMM Do, YYYY')}</strong>.</p>
                        :
                           <p className="lead ml-30">Your subscription will be completed on <strong>{Moment(sub_info.current_period_end*1000).format('MMMM Do, YYYY')}</strong>.</p>
                        }
                     </div>
                  :
                     isNotSubscribed ?
                     <p className="lead ml-30">{isNotSubscribed}</p>
                     :
                        <Grid container spacing={5} className="mt-50">
                           <Grid item  xs={12} sm={12} md={12} lg={12} xl={12} style={{display: "flex", justifyContent: "center"}}>
                              <CircularProgress />
                           </Grid>
                        </Grid>
                  }
               </div>
               <div>
                  <h4>Content Admin</h4>
                  <p className="lead ml-30">Manage the content of your app - <strong>live!</strong></p>

                  <h5>Messaging</h5>
                  <p className="lead ml-30">Add messages to engage and inform, a headline, text and image.</p>

      				<h5>Guestbook</h5>
      				<p className="lead ml-30">A digital version of in room guest folders, with key / emergency information and more.</p>

      				<h5>Styles</h5>
      				<p className="lead ml-30">Match your brand colours, add your logo and home page image.</p>

      				<h5>Tabs</h5>
      				<p className="lead ml-30">Add and order your app Tabs.</p>

      				<h5>Statistics</h5>
      				<p className="lead ml-30">Monitor how your guests are engaging with your Pocket Concierge app.</p>
               </div>
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
      logout: authAction.logout      
   })(HomePage);