/**
 * Styles Page
 */
/* eslint-disable */
import React, { Fragment } from 'react';
import { connect } from "react-redux";
import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';

//component
import ContentLoader from '../../components/global/loaders/ContentLoader';
import PageTitle from '../../components/widgets/PageTitle';
import parse from '../../parse/parse';
import { showAlert } from "../../actions/action";
import authAction from '../../reducers/auth/actions';
import ColorPicker from '../../components/global/forms/ColorPicker';

class StylesPage extends React.Component {

   constructor(props) {
      super(props);
      this.state = {
         user: null,
         logo: {},
         fields: {
            deepNavColour: '#ff5722',
            shallowNavColour: '#ff5722',
            iconColour: '#ff5722',
            iconLiveColour: '#ff5722',
            textColour: '#ff5722',
            bottomBarColour: '#ff5722',
            storyBackgroundColour: '#ff5722',
            contentBackgroundColour: '#ff5722',
            tagsTextColour: '#ff5722'
         },
         styles: {
            logo: "",
            logoSmall: ""
         },
         uploadingLogo: false,
         uploadingSmallLogo: false,
         uploadingColour: false
      };
      this.handleChange = this.handleChange.bind(this);
      this.handleSubmitLogo = this.handleSubmitLogo.bind(this);
      this.handleSubmitSmallLogo = this.handleSubmitSmallLogo.bind(this);
      this.handleChangeColour = this.handleChangeColour.bind(this);
      this.handleSubmitColour = this.handleSubmitColour.bind(this);
      this.handleParse = this.handleParse.bind(this);
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
            self._isMounted && parse.getStyle(user, function(err, styles) {
               if (err) {
                  self._isMounted && self.props.showAlert(err.message, 'error');
               } else {
                  if (styles) {
                     var fields = self.state.fields;
                     fields = {
                        deepNavColour: styles.deepNavColour,
                        shallowNavColour: styles.shallowNavColour,
                        iconColour: styles.iconColour,
                        iconLiveColour: styles.iconLiveColour,
                        textColour: styles.textColour,
                        bottomBarColour: styles.bottomBarColour,
                        storyBackgroundColour: styles.storyBackgroundColour,
                        contentBackgroundColour: styles.contentBackgroundColour,
                        tagsTextColour: styles.tagsTextColour
                     }
                     self._isMounted && self.setState({ fields, styles });
                  }
               }
            })
         }
      });
   }

   componentWillUnmount() {
      this._isMounted = false;
   }

   handleChange(e) {
      const logo = this.state.logo;
      logo[e.target.name] = e.target.files[0];
      this.setState({ logo });
   }

   handleChangeColour(color, field) {
      const fields = this.state.fields;
      fields[field] = color;
      this.setState({ fields });
   }

   handleSubmitLogo(e) {
      if (!this.state.logo['logo']) {
         e.preventDefault();
      } else {
         this.setState({ uploadingLogo: true });
         this.handleParse(this.state.logo['logo'], 'logo');
      }
   }

   handleSubmitSmallLogo(e) {
      if (!this.state.logo['logoSmall']) {
         e.preventDefault();
      } else {
        this.setState({ uploadingSmallLogo: true });
         this.handleParse(this.state.logo['logoSmall'], 'logoSmall');
      }
   }

   handleSubmitColour(e) {
      this.setState({ uploadingColour: true });
      const self = this;
      self._isMounted && parse.saveStyle(self.state.user, self.state.fields, function(err, msg) {
         if (err) {
            self._isMounted && self.setState({ uploadingColour: false });
            self._isMounted && self.props.showAlert(err.message, 'error');
         } else {
            self._isMounted && self.setState({ uploadingColour: false });
         }
      })
   }

   handleParse(file, uploadedFileName) {
      const self = this;
      self._isMounted && parse.saveLogoImage(self.state.user, uploadedFileName, file, function(err, msg) {
         if (err) {
            if (uploadedFileName === 'logo') {
               self._isMounted && self.setState({ uploadingLogo: false });
            } else {
               self._isMounted && self.setState({ uploadingSmallLogo: false });
            }
            self._isMounted && self.props.showAlert(err.message, 'error');
         } else {
            if (uploadedFileName === 'logo') {
               self._isMounted && self.setState({ uploadingLogo: false });
            } else {
               self._isMounted && self.setState({ uploadingSmallLogo: false });
            }

            self._isMounted && parse.getStyle(self.state.user, function(err, styles) {
               if (err) {
                  self._isMounted && self.props.showAlert(err.message, 'error');
               } else {
                  if (styles) {
                     var fields = self.state.fields;
                     fields = {
                        deepNavColour: styles.deepNavColour,
                        shallowNavColour: styles.shallowNavColour,
                        iconColour: styles.iconColour,
                        iconLiveColour: styles.iconLiveColour,
                        textColour: styles.textColour,
                        bottomBarColour: styles.bottomBarColour,
                        storyBackgroundColour: styles.storyBackgroundColour,
                        contentBackgroundColour: styles.contentBackgroundColour,
                        tagsTextColour: styles.tagsTextColour
                     }
                     self._isMounted && self.setState({ fields, styles });
                  }
               }
            })
         }
      });    
   }

   render() {
      return (
         <Fragment>
            <PageTitle
               title="Styles"
               desc="Manage your app styles here."
            />
            <div className="container">
               <Grid container spacing={3}>
                  <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                     <p className="lead">Main Logo</p>
                     {this.state.styles.logo === "" ? 
                        ""
                     :
                        <Card className="section-image ml-20" style={{marginBottom: "25px"}}>
                           <img src={this.state.styles.logo} alt="section-img" width={200}></img>
                        </Card>
                     }
                     <form className="guestbook-image mb-20 mt-30">
                        <label className="ml-20">Logo: </label>
                        <input accept="image/*" id="outlined-button-file" name="logo" type="file" onChange={this.handleChange}/>
                        <Button 
                           className="button btn-active btn-sm submit-btn"
                           variant="contained" 
                           onClick={this.handleSubmitLogo}
                           disabled={this.state.uploadingLogo}
                        >
                           Submit
                        </Button>
                        {this.state.uploadingLogo && <CircularProgress size={24} className="btn-spin" style={{marginTop: 5, marginLeft: -50}} />}
                     </form>
                     <hr className="mt-15"></hr>
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                     <p className="lead">Small Logo</p>
                     {this.state.styles.logoSmall === "" &&
                        <Card className="section-image ml-20" style={{marginBottom: "25px"}}>
                           <img src={this.state.styles.logoSmall} alt="section-img" width={200}></img>
                        </Card>
                     }
                     <form className="guestbook-image mb-20 mt-30">
                        <label className="ml-20">Logo: </label>
                        <input accept="image/*" id="outlined-button-file" name="logoSmall" type="file" onChange={this.handleChange}/>
                        <Button 
                           className="button btn-active btn-sm submit-btn" 
                           variant="contained"
                           onClick={this.handleSubmitSmallLogo}
                           disabled={this.state.uploadingSmallLogo}
                        >
                           Submit
                        </Button>
                        {this.state.uploadingSmallLogo && <CircularProgress size={24} className="btn-spin" style={{marginTop: 5, marginLeft: -50}} />}
                     </form>
                     <hr className="mt-15"></hr>
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                     <p className="lead">Deep Navigation Colour</p>
                     <ColorPicker field={"deepNavColour"} color={this.state.fields['deepNavColour']} handleChange={this.handleChangeColour} />
                     <hr className="mt-15"></hr>
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                     <p className="lead">Shallow Navigation Colour</p>
                     <ColorPicker field={"shallowNavColour"} color={this.state.fields['shallowNavColour']} handleChange={this.handleChangeColour} />
                     <hr className="mt-15"></hr>
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                     <p className="lead">Icon Colour</p>
                     <ColorPicker field={"iconColour"} color={this.state.fields['iconColour']} handleChange={this.handleChangeColour} />
                     <hr className="mt-15"></hr>
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                     <p className="lead">Icon Live Colour</p>
                     <ColorPicker field={"iconLiveColour"} color={this.state.fields['iconLiveColour']} handleChange={this.handleChangeColour} />
                     <hr className="mt-15"></hr>
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                     <p className="lead">Text Colour</p>
                     <ColorPicker field={"textColour"} color={this.state.fields['textColour']} handleChange={this.handleChangeColour} />
                     <hr className="mt-15"></hr>
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                     <p className="lead">Bottom Bar Colour</p>
                     <ColorPicker field={"bottomBarColour"} color={this.state.fields['bottomBarColour']} handleChange={this.handleChangeColour} />
                     <hr className="mt-15"></hr>
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                     <p className="lead">Story Background Colour</p>
                     <ColorPicker field={"storyBackgroundColour"} color={this.state.fields['storyBackgroundColour']} handleChange={this.handleChangeColour} />
                     <hr className="mt-15"></hr>
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                     <p className="lead">Content Background Colour</p>
                     <ColorPicker field={"contentBackgroundColour"} color={this.state.fields['contentBackgroundColour']} handleChange={this.handleChangeColour} />
                     <hr className="mt-15"></hr>
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                     <p className="lead">Tags Text Colour</p>
                     <ColorPicker field={"tagsTextColour"} color={this.state.fields['tagsTextColour']} handleChange={this.handleChangeColour} />
                     <hr className="mt-15"></hr>
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                     <h5>Save these style updates - they are live and will update the app.</h5>
                     <Button 
                        className="button btn-active"
                        variant="contained"
                        onClick={this.handleSubmitColour}
                        disabled={this.state.uploadingColour}
                     >
                        Submit
                     </Button>
                     {this.state.uploadingColour && <CircularProgress size={24} className="btn-spin" style={{marginTop: 7, marginLeft: -50}} />}
                  </Grid>
               </Grid>
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
      logout: authAction.logout      
   })(StylesPage);