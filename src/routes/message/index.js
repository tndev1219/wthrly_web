/**
 * Messaging Page
 */
/* eslint-disable */
import React, { Fragment } from 'react';
import { connect } from "react-redux";
import { Link } from 'react-router-dom';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';

//component
import ContentLoader from '../../components/global/loaders/ContentLoader';
import PageTitle from '../../components/widgets/PageTitle';
import parse from '../../parse/parse';
import { showAlert, saveMessageTitle, saveSelectedLocation } from "../../actions/action";
import authAction from '../../reducers/auth/actions';

class MessagingPage extends React.Component {

   constructor(props) {
      super(props);
      this.state = {
         user: null,
         locations: [],
         messages: null,
         selectedLocationID: 0,
         messageTitle: 'Add New Message Headline'
      };
      this.handleSelect = this.handleSelect.bind(this);
      this.setMessageTitle = this.setMessageTitle.bind(this);
      this.addMessage = this.addMessage.bind(this);
      this._isMounted = false;
   }

   UNSAFE_componentWillMount() {
      this._isMounted = true;
      const self = this;
      self._isMounted && parse.createUserFromToken( self.props.token, function( err, user ){
         if (err) {
            self._isMounted && self.props.logout();
         } else { 
            self._isMounted && self.setState({user});
            self._isMounted && parse.getLocationsForUser(user, function ( err, locations ) {
               if (err) {
                  self._isMounted && self.props.showAlert(err.message, 'error');
               } else {
                  self._isMounted && self.setState({ locations });
                  self._isMounted && self.props.saveSelectedLocation(locations[0].name);

                  const resorts = [];
                  for (var i = 0; i < locations[0].subLocations.length; i++) {
                     resorts.push(locations[0].subLocations[i].locationId);
                  }
                  self._isMounted && parse.getMessages(self.state.user, resorts, function(err, res) {
                     if (err) {
                        self._isMounted && self.props.showAlert(err.message, 'error');
                     } else {
								self._isMounted && self.setState({messages: res});
                     }
                  })
               }
            });
         }
      });
   }

   componentWillUnmount() {
      this._isMounted = false;
   }

   handleSelect(e) {
      this.setState({ selectedLocationID: e.target.value, messages: null });
      this.props.saveSelectedLocation(this.state.locations[e.target.value].name);

      const self = this;
      const resorts = [];

      for (var i = 0; i < this.state.locations[e.target.value].subLocations.length; i++) {
         resorts.push(this.state.locations[e.target.value].subLocations[i].locationId);
      }

      self._isMounted && parse.getMessages(self.state.user, resorts, function(err, res) {
         if (err) {
            self._isMounted && self.props.showAlert(err.message, 'error');
         } else {
            self._isMounted && self.setState({messages: res});
         }
      })
   }

   setMessageTitle(e) {
      this.setState({ messageTitle: e.target.value });
   }

   addMessage() {
      this.props.saveMessageTitle(this.state.messageTitle);
   }

   render() {
      return (
         <Fragment>
            <PageTitle
               title="Messages"
               desc="Manage your messaging here. Filter by location."
            />
            <div className="container">
               <FormControl className="mb-20 ml-20">
                  <Select
                     value={this.state.selectedLocationID}
                     onChange={this.handleSelect}
                     className="iron-select-width1"
                  >
                     {this.state.locations.map((location, index) => {
                        return (
                           <MenuItem key={index} value={index}>{location.name} Messages</MenuItem>   
                        );
                     })}
                  </Select>
               </FormControl>
               <hr className="mb-25"></hr>
               <div>
                  <p className="lead mb-20">Add a new message here.</p>
                  <TextField
                     value={this.state.messageTitle}
                     className="ml-20 iron-select-width1"
                     onChange={this.setMessageTitle}
                  />
                  <Button component={Link} to={'/message/add'} className="button btn-active btn-sm ml-20 mb-30" onClick={this.addMessage}>Add Message</Button>
               </div>
               <hr className="mb-25"></hr>
               <div>
                  <p className="lead">Message List</p>
                  {!this.state.messages ? 
                     <Grid container spacing={5} className="mt-20">
                        <Grid item  xs={12} sm={12} md={12} lg={12} xl={12} style={{display: "flex", justifyContent: "center"}}>
                           <CircularProgress className="btn-spin" />
                        </Grid>
                     </Grid>
                  :
                  this.state.messages && this.state.messages.length === 0 ? 
                     <Grid container spacing={5} className="mt-20">
                        <Grid item  xs={12} sm={12} md={12} lg={12} xl={12} style={{display: "flex", justifyContent: "center"}}>
                           <p><i>No message to display!</i></p>
                        </Grid>
                     </Grid>
                     :
                        <Grid container spacing={5}>                  
                           {this.state.messages.map((message, index) => (
                              <Grid item xs={12} sm={12} md={12} lg={12} xl={12} key={index} className="ml-20">
                                 <Card className="section-image">
                                    {message.image === "" ? 
                                       <img src={require(`../../assets/images/_logo200.png`)} alt="section-img" width={200}></img>
                                    :
                                       <img src={message.image} alt="section-img" width={200}></img>
                                    }                              
                                 </Card>
                                 <div style={{display: "flex"}}>
                                    <p className="lead mb-20 mt-20">{message.title}</p>
                                    <Button component={Link} to={`/message/edit/${message.id}`} className="button btn-active btn-sm mt-20 mb-20 ml-20">Edit</Button>
                                 </div>
                              </Grid>   
                           ))}
                        </Grid>
                  }                     
               </div>
               <div style={{height: 100}}></div>
            </div>
         </Fragment>
      )
   }
}

// map state to props
const mapStateToProps = state => {
   const token = state.Auth.idToken;
   return { token };
}

export default connect(
   mapStateToProps, 
   {
      showAlert, 
      saveMessageTitle,
      saveSelectedLocation,
      logout: authAction.logout      
   })(MessagingPage);