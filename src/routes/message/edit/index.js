/**
 * Messaging Page
 */
/* eslint-disable */
import React, { Fragment } from 'react';
import { connect } from "react-redux";
import { Link } from 'react-router-dom';
import Checkbox from '@material-ui/core/Checkbox';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Card from '@material-ui/core/Card';
import CircularProgress from '@material-ui/core/CircularProgress';

//component
import ContentLoader from '../../../components/global/loaders/ContentLoader';
import parse from '../../../parse/parse';
import { showAlert } from "../../../actions/action";
import authAction from '../../../reducers/auth/actions';
import DatePicker from '../../../components/global/forms/DatePicker';

class MessagingPage extends React.Component {

   constructor(props) {
      super(props);
      this.state = {
         user: null,
         locations: [],
         tags: [],
         fields: {
            title: '',
            sharingEnabled: false,
            ytCode: '',
            details: '',
            resorts: []
         },
         uploading: false,
         deleting: false,
         messages: []
      };
      this.handleClick = this.handleClick.bind(this);
      this.handleChange = this.handleChange.bind(this);
      this.handleCheck = this.handleCheck.bind(this);
      this.handleDate = this.handleDate.bind(this);
      this.handleInputFile = this.handleInputFile.bind(this);
      this.handleDelete = this.handleDelete.bind(this);
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
            self._isMounted && parse.getLocationsForUser(user, function(err, locations) {
               if (err) {
                  self._isMounted && self.props.showAlert(err.message, 'error');
               } else {
                  self._isMounted && self.setState({ locations });
                  
                  self._isMounted && parse.getTagsForUser( user, function(err, tags){
                     if (err) {
                        self._isMounted && self.props.showAlert(err.message, 'error');
                     } else {
                        var fields = self.state.fields;
                        for (var i = 0; i < tags.length; i++) {
                           fields[tags[i].name] = false;
                        }
                        self._isMounted && self.setState({ fields, tags });

                        self._isMounted && parse.getMessageWithId(user, self.props.match.params.id, function(err, res) {
                           if (err) {
                              self._isMounted && self.props.showAlert(err.message, 'error');
                           } else {
                              var fields = {
                                 title: res.title,
                                 startDate: res.publishDate,
                                 endDate: res.expiryDate,
                                 resorts: res.resorts
                              };

                              if (res.ytCode) {
                                 fields['ytCode'] = res.ytCode;
                              } else {
                                 fields['ytCode'] = "";
                              }

                              if (res.details) {
                                 fields['details'] = res.details;
                              } else {
                                 fields['details'] = "";
                              }

                              for (var i = 0; i < self.state.tags.length; i++) {
                                 fields[tags[i].name] = false;
                              }

                              for (var i = 0; i < res.tags.length; i++) {
                                 fields[res.tags[i]] = true;
                              }                 

                              fields['sharingEnabled'] = res.sharingEnabled;
                              self._isMounted && self.setState({messages: res, fields});
                           }
                        })
                     }
                  })
               }
            })
         }
      });      
   }

   componentWillUnmount() {
      this._isMounted = false;
   }

   handleInputFile(e) {
      const fields = this.state.fields;
      fields[e.target.name] = e.target.files[0];
      this.setState({fields});
   }

   handleChange(e) {
      const fields = this.state.fields;
      fields[e.target.name] = e.target.value;
      this.setState({fields});
   }

   handleCheck(e) {
      var fields = this.state.fields;
      
      if (e.target.checked) {
         fields.resorts.push(e.target.name);
      } else {
         fields.resorts = fields.resorts.filter(resort => resort !== e.target.name);
      }

      fields[e.target.name] = !fields[e.target.name];

      this.setState({fields});
   }

   handleDate(e, field) {
      const fields = this.state.fields;
      fields[field] = e;
      this.setState({fields});
   }

   handleClick() {
      this.setState({uploading: true});
      if (this.state.fields['title'] === '') {
         this.setState({uploading: false});
         this.props.showAlert('Please input Headline...', 'error');
         return;
      }
      if (!this.state.fields['startDate'] || !this.state.fields['endDate'] || this.state.fields['startDate'] > this.state.fields['endDate']) {
         this.setState({uploading: false});
         this.props.showAlert('Please input correct publish date...', 'error');
         return;
      }
      if (this.state.fields.resorts.length === 0) {
         this.setState({uploading: false});
         this.props.showAlert('Please check locations...', 'error');
         return;
      }

      const fields = this.state.fields;
      const tags = [];
      const payload = {
         title: fields['title'],
         publishDate: fields['startDate'],
         expiryDate: fields['endDate']
      }

      if (this.state.fields['imageFile']) {
         payload['imageFile'] = fields['imageFile'];
      }
      if (this.state.fields['pdfFile']) {
         payload['pdfFile'] = fields['pdfFile'];
      }
      if (this.state.fields['ytCode']) {
         payload['ytCode'] = this.state.fields['ytCode'];
      }
      if (this.state.fields['details']) {
         payload['details'] = this.state.fields['details'];
      }

      payload['resorts'] = fields.resorts;

      for (var i = 0; i < this.state.tags.length; i++) {
         if (fields[this.state.tags[i].name]) {
            tags.push(this.state.tags[i].name)
         } 
      }
      payload['tags'] = tags;
      
      payload['sharingEnabled'] = this.state.fields['sharingEnabled'];

      var self = this;
      parse.updateMessage(self.state.messages.id, payload, function (err, res) {
         if (err) {
            self._isMounted && self.setState({uploading: false});
            self._isMounted && self.props.showAlert(err.message, 'error');
         } else {
            self._isMounted && self.setState({uploading: false});
            if (res) {
               self._isMounted && self.props.showAlert(res, 'success');   
            } else {
               self._isMounted && self.props.showAlert('Operation Failed. Please try again later...', 'error');
            }            
         }
      });
   }

   handleDelete() {
      this.setState({deleting: true});
      var self = this;
      parse.deleteMessage(this.state.messages.id, function (err, res) {
         if (err) {
            self._isMounted && self.setState({deleting: false});
            self._isMounted && self.props.showAlert(err.message, 'error');
         } else {
            self._isMounted && self.setState({deleting: false});
            if (res) {
               self._isMounted && self.props.showAlert(res, 'success');   
            } else {
               self._isMounted && self.props.showAlert('Operation Failed. Please try again later...', 'error');
            }            
            self._isMounted && self.props.history.push('/message');
         }
      });
   }

   render() {

      return (
         <Fragment>
            <div className="container">
               <Grid container spacing={4}>
                  <Grid item xs={12} sm={12} md={12} lg={12} className="mt-60">
                     <p className="lead">Add an Image</p>
                        {this.state.messages.image === "" ? 
                           ""
                        :
                           <Card className="section-image ml-20" style={{marginBottom: "25px"}}>
                              <img src={this.state.messages.image} alt="section-img" width={200}></img>
                           </Card>
                        }     
                     <form className="ml-20">
                        <input accept="image/*" id="outlined-button-file" name="imageFile" type="file" onChange={this.handleInputFile}/>
                     </form>
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                     <p className="lead">or Add a PDF</p>
                     <form className="ml-20">
                        <input accept="application/pdf" id="outlined-button-file" name="pdfFile" type="file" onChange={this.handleInputFile}/>
                     </form>
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                     <p className="lead">or Add a YouTubu video</p>
                     <Grid container>
                        <Grid item>
                           <p className="ml-20">https://www.youtube.com/watch?v=</p>
                        </Grid>
                        <Grid item style={{marginTop: "-6px"}}>
                           <TextField
                              value={this.state.fields['ytCode']}
                              className="iron-select-width1"
                              onChange={this.handleChange}
                              name="ytCode"
                           />
                        </Grid>
                     </Grid>
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12} style={{marginTop: "-20px"}}>
                     <p className="lead">Headline</p>
                     <TextField
                        value={this.state.fields['title']}
                        className="ml-20 iron-select-width1"
                        multiline={true}
                        onChange={this.handleChange}
                        name="title"
                        style={{marginTop: "-10px"}}
                     />
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                     <p className="lead">Details</p>
                     <TextField
                        value={this.state.fields['details']}
                        className="ml-20 iron-select-width1"
                        multiline={true}
                        onChange={this.handleChange}
                        name="details"
                        style={{marginTop: "-10px"}}
                     />
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                     <p className="lead" style={{marginBottom: 0}}>Publish from</p>
                     <DatePicker name={"startDate"} initTime={this.state.fields['startDate']} handleChange={this.handleDate} />
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                     <p className="lead" style={{marginBottom: 0}}>Publish to</p>
                     <DatePicker name={"endDate"} initTime={this.state.fields['endDate']} handleChange={this.handleDate} />
                  </Grid>
                  {this.state.locations.map((location, index) => (
                     <Grid key={index} item xs={12} sm={12} md={12} lg={12} style={{paddingBottom: 0}}>
                        <p className="lead">Publish to locations listed in {location.name}</p>
                        {location.subLocations.map((subLocation, index) => (
                           <Grid container spacing={1} key={index}>
                              <Grid item>
                                 <p className="ml-20">{subLocation.name}</p>
                              </Grid>
                              <Grid item style={{marginTop: "-10px"}}>
                                 <Checkbox
                                    checked={this.state.fields.resorts.includes(subLocation.locationId)}
                                    inputProps={{
                                       'aria-label': 'uncontrolled-checkbox',
                                    }}
                                    name={subLocation.locationId}
                                    onChange={this.handleCheck}
                                 />
                              </Grid>
                           </Grid>
                        ))}                           
                     </Grid>                     
                  ))}
                  <Grid item xs={12} sm={12} md={12} lg={12} style={{paddingBottom: 0}}>
                     <p className="lead">Tags</p>
                     <Grid container>
                        {this.state.tags.map((tag, index) => (
                           <Grid item xs={12} sm={4} md={3} lg={2} xl={2} key={index}>
                              <Grid container spacing={1}>
                                 <Grid item style={{width: 135}}>
                                    <p className="ml-20">{tag.name}</p>
                                 </Grid>
                                 <Grid item style={{marginTop: "-10px"}}>
                                    <Checkbox
                                       checked={this.state.fields[tag.name]}
                                       inputProps={{
                                          'aria-label': 'uncontrolled-checkbox',
                                       }}
                                       name={tag.name}
                                       onChange={this.handleCheck}
                                    />
                                 </Grid>
                              </Grid>
                           </Grid>
                        ))}                           
                     </Grid>   
                  </Grid>

                  <Grid item xs={12} sm={12} md={12} lg={12}>
                     <p className="lead">Include Social Media?</p>
                     <embed type="image/svg+xml" src={require(`../../../assets/images/facebook.svg`)} width={42} className="ml-20" />
                     <embed type="image/svg+xml" src={require(`../../../assets/images/twitter.svg`)} width={42} className="ml-20" />
                     <Checkbox
                        checked={this.state.fields['sharingEnabled']}
                        inputProps={{
                           'aria-label': 'uncontrolled-checkbox',
                        }}
                        name="sharingEnabled"
                        onChange={this.handleCheck}
                        className="ml-40"
                        style={{marginTop: "-30px"}}
                     />
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                     <Grid container spacing={5}>
                        <Grid item>
                           <Button 
                              className="button btn-active" 
                              variant="contained"
                              disabled={this.state.uploading}
                              onClick={this.handleClick}
                           >
                              Update Item
                           </Button>
                           {this.state.uploading && <CircularProgress size={24} className="btn-message-spin" />}
                        </Grid>
                        <Grid item>
                           <Button component={Link} to={'/message'} className="button">Cancel</Button>
                        </Grid>
                        <Grid item>
                           <Button
                              className="button btn-active" 
                              variant="contained"
                              disabled={this.state.deleting}
                              onClick={this.handleDelete}
                           >
                              Delete
                           </Button>
                           {this.state.deleting && <CircularProgress size={24} className="btn-messageDel-spin" />}
                        </Grid>
                     </Grid>
                  </Grid>
               </Grid>
               <div style={{height: "60px"}}></div>
            </div>
         </Fragment>
      )
   }
}

// map state to props
const mapStateToProps = state => {
   const token = state.Auth.idToken;
   const messageTitle = state.appSettings.messageTitle;
   const selectedLocation = state.appSettings.selectedLocation;
   return { token, messageTitle, selectedLocation };
}

export default connect(mapStateToProps, {showAlert, logout: authAction.logout})(MessagingPage);