import React from 'react';
import { connect } from "react-redux";
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CircularProgress from '@material-ui/core/CircularProgress';
import CKEditor from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Animate } from "react-show";
import SweetAlert from 'react-bootstrap-sweetalert';
import $ from 'jquery';

// Parse
import parse from '../../parse/parse';

// action
import { showAlert } from "../../actions/action";

class Section extends React.Component {
   constructor(props) {
      super(props);
      this.state = {
         isUploaded: false,
         sectionShow: false,
         introductionData: this.props.item.sectionIntroduction,
         sectionTitle: this.props.item.sectionTitle,
         imageFile: null,
         srcImageURL: this.props.item.image,
         showAlert: false,
         uploadingImage: false
      };
      this.toggleSectionShow = this.toggleSectionShow.bind(this);
      this.handleChange = this.handleChange.bind(this);
      this.setImageFile = this.setImageFile.bind(this);
      this.isImageDeleted = this.isImageDeleted.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
      this.deleteConfirm = this.deleteConfirm.bind(this);
      this.hideAlert = this.hideAlert.bind(this);
      this.handleSectionDelete = this.handleSectionDelete.bind(this);
      this._isMounted = false;
   }

   UNSAFE_componentWillMount() {
      this._isMounted = true;
   }

   componentWillUnmount() {
      this._isMounted = false;
   }

   toggleSectionShow() {
      this.setState({ sectionShow: !this.state.sectionShow });
   }

   handleChange(e) {
      this.setState({ sectionTitle: e.target.value });
   }

   setImageFile(e) {
      this.setState({imageFile: e.target.files[0]});
   }

   isImageDeleted() {
      this.setState({imageFile: null, srcImageURL: null});
      const self = this;

      self._isMounted && parse.updateSectionData(this.props.item.guestbookId, this.props.item.order, this.state.sectionTitle, 'isImageDeleted', this.state.introductionData, function( err, res ) {
         if (err) {
            self._isMounted && self.props.showAlert(err.message, 'error');
         } else {
            self._isMounted && self.props.showAlert("Success!", 'success');
         }
      });
   }

   handleSubmit(e) {
      if ($(e.target).text() === "Submit" && this.state.imageFile === null) {
         e.preventDefault();
      } else {
         this.setState({ uploadingImage: true });
         const self = this;

         if (this.state.imageFile === null) {
            self._isMounted && parse.updateSectionData(this.props.item.guestbookId, this.props.item.order, this.state.sectionTitle, null, this.state.introductionData, function( err, res ) {
               if (err) {
                  self._isMounted && self.setState({ uploadingImage: false });
                  self._isMounted && self.props.showAlert(err.message, 'error');
               } else {
                  self._isMounted && self.setState({ uploadingImage: false });
                  self._isMounted && self.props.showAlert("Success!", 'success');
               }
            });
         } else {
            self._isMounted && parse.updateSectionData(this.props.item.guestbookId, this.props.item.order, this.state.sectionTitle, this.state.imageFile, this.state.introductionData, function( err, image ) {
               if (err) {
                  self._isMounted && self.setState({ uploadingImage: false });
                  self._isMounted && self.props.showAlert(err.message, 'error');
               } else {
                  self._isMounted && self.setState({ uploadingImage: false });

                  if (image !== null) {
                     self._isMounted && self.setState({srcImageURL: image, imageFile: null});
                  }            

                  self._isMounted && self.props.showAlert("Success!", 'success');
               }
            });            
         }
      }
   }

   deleteConfirm() {
      this.setState({showAlert: true});
   }

   hideAlert() {
      this.setState({showAlert: false});
   }

   handleSectionDelete() {
      this.setState({showAlert: false});
      const self = this;
      
      self._isMounted && parse.deleteSectionData(this.props.item.guestbookId, this.props.item.order, function(err, msg) {
         if (err) {
            self._isMounted && self.props.showAlert(err.message, 'error');
         } else {
            self._isMounted && self.props.deleteSection(self.props.item.order);
            self._isMounted && self.props.showAlert(msg, 'success');
         }
      });
   }

   render() {
      return (
         <div>
            <div className="section-header" onClick={this.toggleSectionShow} style={{borderRadius: 10}}>
               <Grid container justify="space-between">
                  <Grid item>
                     <h3>{this.state.sectionTitle}</h3>
                  </Grid>
                  <Grid item>
                     <h3 sytle={{float: 'right'}}>{this.state.sectionShow ? "-" : "+"}</h3>
                  </Grid>
               </Grid>
            </div>
            <Animate
               show={this.state.sectionShow}
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
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                     <TextField
                        value={this.state.sectionTitle}
                        onChange={this.handleChange}
                     />
                     <Button className="button btn-active btn-sm ml-20" onClick={this.handleSubmit} disabled={this.state.uploadingImage}>Save</Button>
                     {this.state.uploadingImage && <CircularProgress size={24} className="btn-spin"  style={{marginTop: 5, marginLeft: -44}} />}
                  </Grid>
                  {this.state.srcImageURL ? 
                     <Grid item xs={12} sm={12} md={12} lg={12}>
                        <h4 className="mb-10">{this.state.sectionTitle} image</h4>
                        <Card className="section-image">
                           <img src={this.state.srcImageURL} alt="section-img" width={200}></img>
                        </Card>
                        <Button className="button btn-active btn-sm mt-20 mb-20" onClick={this.isImageDeleted}>Delete</Button>
                     </Grid>
                     :
                     <Grid item xs={12} sm={12} md={12} lg={12}>
                        <h4>{this.state.sectionTitle} image</h4>
                        <form className="guestbook-image mb-20 mt-30">
                           <label>Your image: </label>
                           <input accept="image/*" id="outlined-button-file" name="image" type="file" onChange={this.setImageFile}/>
                           <Button 
                              className="button btn-active btn-sm submit-btn" 
                              variant="contained"
                              onClick={this.handleSubmit}
                              disabled={this.state.uploadingImage}
                           >
                              Submit
                           </Button>
                           {this.state.uploadingImage && <CircularProgress size={24} className="btn-spin" style={{marginTop: 5, marginLeft: -50}} />}
                        </form>
                     </Grid>
                  }
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                     <CKEditor
                        // config={{
                        //    toolbar: [ 'Heading', '|', 'Bold', 'Italic', 'Link', 'bulletedList', 'numberedList', 'BlockQuote', 'InsertTable', 'Undo', 'Redo' ]
                        // }}
                        editor={ ClassicEditor }
                        data={this.state.introductionData}
                        onInit={ editor => {} }
                        onChange={ ( event, editor ) => {
                           const introductionData = editor.getData();
                           this.setState({introductionData})
                        } }
                     />
                     <Button className="button btn-active btn-sm mt-20 mb-20" onClick={this.handleSubmit} disabled={this.state.uploadingImage}>Save</Button>
                     {this.state.uploadingImage && <CircularProgress size={24} className="btn-spin"  style={{marginTop: 25, marginLeft: '-44px'}} />}
                  </Grid>
               </Grid>
               <p className="lead">Delete this section here, it cannot be undone.</p>
               <Button className="button btn-active mt-10 mb-10" onClick={this.deleteConfirm}>Delete Section</Button>
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
               onConfirm={this.handleSectionDelete}
               onCancel={this.hideAlert}
               closeOnClickOutside
            >
               Are you sure you want to delete this section? it cannot be undone!
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

export default connect(mapStateToProps, {showAlert})(Section);