import React from 'react';
import { connect } from "react-redux";
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import CircularProgress from '@material-ui/core/CircularProgress';
import Card from '@material-ui/core/Card';
import { Animate } from "react-show";
import SweetAlert from 'react-bootstrap-sweetalert';
import ReactPhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/dist/style.css';
import validator from 'validator';

import parse from '../../parse/parse';
import { showAlert } from "../../actions/action";

class Tab extends React.Component {
   constructor(props) {
      super(props);
      this.state = {
         tabShow: false,
         showAlert: false,
         tabIcon: this.props.icons.filter(icon => this.props.tab.icon === icon.iconName),
         image: null,
         fields: {
            telephone: this.props.tab.telephone,
            url: this.props.tab.url,
            iconText: this.props.tab.iconText
         },
         telephoneUpdate: false,
         urlUpdate: false,
         iconTextUpdate: false,
         imageUpload: false,
         tabDelete: false
      };
      this.toggleTabShow = this.toggleTabShow.bind(this);
      this.handleChange = this.handleChange.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
      this.handleOnChange = this.handleOnChange.bind(this);
      this.handleClick = this.handleClick.bind(this);
      this.deleteConfirm = this.deleteConfirm.bind(this);
      this.hideAlert = this.hideAlert.bind(this);
      this.handleTabDelete = this.handleTabDelete.bind(this);
      this.tabImageUpload = this.tabImageUpload.bind(this);
      this.handleImageUploadEvent = this.handleImageUploadEvent.bind(this);
      this._isMounted = false;
   }

   UNSAFE_componentWillMount() {
      this._isMounted = true;

      this.setState({ tabIcon: this.state.tabIcon[0].iconFile });
   }

   componentDidMount() {
      const self = this;

      if (this.props.tab.type === 'image' && this.props.tab.image) {
         self._isMounted && parse.getTabImage(this.props.tab.image, function(err, res) {
            if (err) {
               self._isMounted && self.props.showAlert(err.message, 'error');
            } else {
               self._isMounted && self.setState({ image: res });
            }
         });
      }
   }

   UNSAFE_componentWillReceiveProps(nextProps) {
      const self = this;

      if (nextProps.tab.type === 'image' && nextProps.tab.image) {
         self._isMounted && parse.getTabImage(nextProps.tab.image, function(err, res) {
            if (err) {
               self._isMounted && self.props.showAlert(err.message, 'error');
            } else {
               self._isMounted && self.setState({ image: res });
            }
         });
      }
   }

   componentWillUnmount() {
      this._isMounted = false;
   }

   toggleTabShow() {
      this.setState({ tabShow: !this.state.tabShow });
   }

   handleClick(icon) {
      this.setState({ tabIcon: icon.iconFile });
      var self = this;
      self._isMounted && parse.saveTabIcon(self.props.tab.id, icon, function(err, res) {
         if (err) {
            self._isMounted && self.props.showAlert(err.message, 'error');
         }
      });
   }

   handleChange(e) {
      var fields = this.state.fields;
      fields[e.target.name] = e.target.value;
      this.setState({ fields });
   }

   handleSubmit(field) {
      if (field === "telephone") {
         var phoneNum = this.state.fields[field];
         // if (phoneNum.split('+')[1] === undefined) {
         //    phoneNum = `+${phoneNum}`;
         // }
         if (phoneNum === undefined) {
            this.props.showAlert('Please input the correct phone number...', 'error');
            return;
         // } else if (!validator.isMobilePhone(phoneNum)) {
         //    this.props.showAlert('Please input the correct phone number...', 'error');
         //    return;
         } else {
            this.setState({ telephoneUpdate: true });
         }
      }
      if (field === "url") {
         if (this.state.fields[field] === undefined) {
            this.props.showAlert('Please input the correct URL...', 'error');
            return;
         } else if (!validator.isURL(this.state.fields[field], {protocols: ['https']})) {
            this.props.showAlert('Please input the correct URL...', 'error');
            return;
         } else {
            this.setState({ urlUpdate: true });
         }
      }
      if (field === "iconText") {
         this.setState({ iconTextUpdate: true });   
      }
      
      const self = this;
      self._isMounted && parse.updateTabInfo(self.props.tab.id, field, self.state.fields[field], function( err, msg ) {
         if (err) {
            self._isMounted && self.setState({ 
               telephoneUpdate: false,  
               urlUpdate: false,
               iconTextUpdate: false
            });
            self._isMounted && self.props.showAlert(err.message, 'error');
         } else {
            self._isMounted && self.setState({ 
               telephoneUpdate: false,  
               urlUpdate: false,
               iconTextUpdate: false
            });
         }
      });            
   }

   handleOnChange(value) {
      var fields = this.state.fields;
      fields.telephone = value;
      this.setState({ fields });
   }

   deleteConfirm() {
      this.setState({showAlert: true});
   }

   hideAlert() {
      this.setState({showAlert: false});
   }

   handleTabDelete() {
      this.setState({showAlert: false, tabDelete: true});
      const self = this;
      self._isMounted && parse.deleteTabData(this.props.user, this.props.location, this.props.tab.order, this.props.tab.id, function(err, res) {
         if (err) {
            self._isMounted && self.props.showAlert(err.message, 'error');
            self.setState({tabDelete: false});
         } else {
            self.setState({tabDelete: false});
            self.props.resetTabData(res);
         }
      });
   }

   handleImageUploadEvent(e) {
      const fields = this.state.fields;
      fields.image = e.target.files[0];
      this.setState({ fields });
   }

   tabImageUpload() {
      if (this.state.fields.image) {
         const self = this;

         this.setState({ imageUpload: true });

         self._isMounted && parse.tabImageUpload(self.props.user, self.props.location, self.props.tab.id, self.props.tab.image, self.state.fields.image, function( err, res ) {
            if (err) {
               self._isMounted && self.props.showAlert(err.message, 'error');
               self._isMounted && self.setState({ imageUpload: false });
            } else {
               self._isMounted && self.setState({ imageUpload: false });
               self.props.resetTabData(res);
            }
         });
      } else {
         return;
      }
   }

   render() {
      return (
         <div>
            <div className="section-header" onClick={this.toggleTabShow} style={{borderRadius: 10}}>
               <Grid container justify="space-between">
                  <Grid item>
                     {this.state.tabIcon && <img src={this.state.tabIcon} alt='icon' width={40} />}                     
                  </Grid>
                  <Grid item className="item-center">
                     <h3 sytle={{float: 'right'}}>{this.state.tabShow ? "-" : "+"}</h3>
                  </Grid>
               </Grid>
            </div>
            <Animate
               show={this.state.tabShow}
               transitionOnMount
               stayMounted={false}
               style={{ height: "auto" }}
               start={{
                  opacity: 0,
                  height: 0
               }}
               className="section-content"
            >
               <Grid container spacing={4}>
                  <h4>{this.props.tab.type}</h4>
                  <Grid item xs={12} sm={12} md={12} lg={12} style={{marginBottom: "-20px"}}>
                     <p className="lead">Icon - {this.props.tab.type} Tab</p>
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                     <p className="lead">Select your preferred icon</p>
                     {this.props.icons.map((icon, index) => (
                        <Button key={index} onClick={() => this.handleClick(icon)}>
                           <img src={icon.iconFile} alt='iconList' width={40} />
                        </Button>
                     ))}
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                     <p className="lead">Icon Label</p>
                     <TextField
                        className="ml-20"
                        defaultValue={this.props.tab.iconText}
                        inputProps={{
                           maxLength: 9
                        }}
                        name="iconText"
                        onChange={this.handleChange}
                     />
                     <Button 
                        className="button btn-active btn-sm ml-20" 
                        onClick={() => this.handleSubmit("iconText")}
                        disabled={this.state.iconTextUpdate}
                     >
                        Save
                     </Button>
                     {this.state.iconTextUpdate && <CircularProgress size={24} className="btn-spin" style={{marginTop: 5, marginLeft: -44}} />}
                  </Grid>
                  {this.props.tab.type === "image" &&
                     <Grid item xs={12} sm={12} md={12} lg={12}>
                        <p className="lead">Upload image</p>
                        {this.state.image &&
                           <Card className="section-image ml-20" style={{marginBottom: "25px"}}>
                              <img src={this.state.image} alt="section-img" width={200}></img>
                           </Card>
                        }
                        <form className="guestbook-image mt-30">
                           <label className="ml-20">Image: </label>
                           <input accept="image/*" id="outlined-button-file" name="logoSmall" type="file" onChange={this.handleImageUploadEvent}/>
                           <Button 
                              className="button btn-active btn-sm submit-btn" 
                              variant="contained"
                              onClick={this.tabImageUpload}
                              disabled={this.state.imageUpload}
                           >
                              Submit
                           </Button>
                           {this.state.imageUpload && <CircularProgress size={24} className="btn-spin" style={{marginTop: 5, marginLeft: -50}} />}
                        </form>
                     </Grid>
                  }
                  {this.props.tab.type === "call" &&
                     <Grid item xs={12} sm={12} md={12} lg={12}>
                        <p className="lead">Telephone Number (use international code).</p>
                        <div className="phone-input">
                           <ReactPhoneInput defaultCountry={'us'} value={this.state.fields['telephone']} onChange={this.handleOnChange} />
                           <Button 
                              className="button btn-active btn-sm ml-20" 
                              onClick={() => this.handleSubmit('telephone')}
                              disabled={this.state.telephoneUpdate}
                           >
                              Save
                           </Button>   
                           {this.state.telephoneUpdate && <CircularProgress size={24} className="btn-spin" style={{marginTop: 5, marginLeft: 260}} />}                  
                        </div>
                     </Grid>
                  }
                  {this.props.tab.type === "web" &&
                     <Grid item xs={12} sm={12} md={12} lg={12}>
                        <p className="lead">Icon Destination</p>
                        <TextField
                           className="ml-20"
                           name="url"
                           onChange={this.handleChange}
                           defaultValue={this.props.tab.url}
                        />
                        <Button 
                           className="button btn-active btn-sm ml-20" 
                           onClick={() => this.handleSubmit('url')}
                           disabled={this.state.urlUpdate}
                        >
                           Save
                        </Button>
                        {this.state.urlUpdate && <CircularProgress size={24} className="btn-spin" style={{marginTop: 5, marginLeft: -44}} />}
                     </Grid>
                  }
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                     <Button 
                        className="button btn-active mt-10 mb-10" 
                        onClick={this.deleteConfirm}
                        disabled={this.state.tabDelete}
                     >
                        Delete Tab
                     </Button>
                     {this.state.tabDelete && <CircularProgress size={24} className="btn-spin" style={{marginTop: 17, marginLeft: -65}} />}
                  </Grid>
               </Grid>               
            </Animate>  
            <SweetAlert
               type='warning'
               title=''
               showCancel
               confirmBtnText="Ok"
               cancelBtnText="Cancel"
               confirmBtnBsStyle="warning"
               cancelBtnBsStyle="info"
               className="iron-alert-box"
               show={this.state.showAlert}
               onConfirm={this.handleTabDelete}
               onCancel={this.hideAlert}
               closeOnClickOutside
            >
               Are you sure you want to delete this tab? it cannot be undone!
            </SweetAlert>  
         </div>            
      );
   }   
}

// map state to props
const mapStateToProps = state => {
   const token = state.Auth.idToken;
   return { token };
}

export default connect(mapStateToProps, {showAlert})(Tab);