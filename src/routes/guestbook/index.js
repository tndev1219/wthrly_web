/**
 * GuestBook Page
 */
/* eslint-disable */
import React, { Fragment } from 'react';
import { connect } from "react-redux";
import Grid from '@material-ui/core/Grid';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Card from '@material-ui/core/Card';
import CircularProgress from '@material-ui/core/CircularProgress';
import $ from 'jquery';

//component
import ContentLoader from '../../components/global/loaders/ContentLoader';

// page title bar
import PageTitle from '../../components/widgets/PageTitle';

// Section
import Section from '../../components/widgets/Section';

// Parse
import parse from '../../parse/parse';

// action
import { showAlert } from "../../actions/action";
import authAction from '../../reducers/auth/actions';

// Editor
import CKEditor from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

// Drag and Drop
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
   const result = Array.from(list);
   const [removed] = result.splice(startIndex, 1);
   result.splice(endIndex, 0, removed);
 
   return result;
};

class GuestBookPage extends React.Component {

   constructor(props) {
      super(props);
      this.state = {
         user: null,
         locations: [],
         selectedLocationID: 0,
         sectionData: null,
         isNotExist: true,
         imageFile: null,
         guestbookData: null,
         introductionData: "<p>Hello from CKEditor 5!</p>",
         sectionTitle: 'New Section Title',
         uploadingImage: false
      };
      this.handleSubmit = this.handleSubmit.bind(this);
      this.handleChange = this.handleChange.bind(this);
      this.handleSelect = this.handleSelect.bind(this);
      this.onDragEnd = this.onDragEnd.bind(this);
      this.setSectionTitle = this.setSectionTitle.bind(this);
      this.addSection = this.addSection.bind(this);
      this.deleteSection = this.deleteSection.bind(this);
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
                  var subLocations = [];

						locations.map(location => {
							location.subLocations.map(subLocation => {
								subLocations.push(subLocation.name);
							});
						});
                  self._isMounted && self.setState({ locations: subLocations });

                  self._isMounted && parse.getGuestBookForUser(self.state.user, subLocations[0], function ( err, guestbookData ) {
                     if (err) {
                        self._isMounted && self.props.showAlert(err.message, 'error');
                     } else {
                        if (guestbookData === null) {
                           self._isMounted && self.setState({
                              isNotExist : true, 
                              guestbookData: {image: undefined, introduction: undefined},
                              sectionData: 'isEmpty'
                           });
                        } else {
                           self._isMounted && self.setState({isNotExist : false, guestbookData, introductionData: guestbookData.introduction });

                           self._isMounted && parse.getSectionData(guestbookData.id, function ( err, sectionData ) {
                              if (err) {
                                 self._isMounted && self.props.showAlert(err.message, 'error');
                              } else {
                                 if (sectionData) {
                                    self._isMounted && self.setState({ sectionData });
                                 } else {
                                    self._isMounted && self.setState({ sectionData: 'isEmpty' });
                                 }
                              }
                           });
                        }
                     }
                  });
               }
            });
         }
      });
   }

   componentWillUnmount() {
      this._isMounted = false;
   }

   onDragEnd(result) {
      // dropped outside the list
      if (!result.destination) {
        return;
      }
  
      const items = reorder(
        this.state.sectionData,
        result.source.index,
        result.destination.index
      );
      const self = this;
      
      for (var i = 0; i < items.length; i++) {
         items[i].order = i+1;
      }

      this.setState({ sectionData: items });

      parse.sectionReorder(items, function(err, msg) {
         if (err) {
            self._isMounted && self.props.showAlert(err.message, 'error');
         }
      });
   }

   handleSelect(e) {
      document.getElementById("outlined-button-file").value = ""; // file input reset
      this.setState({ selectedLocationID: e.target.value, guestbookData: null, sectionData: null });
      const self = this;

      self._isMounted && parse.getGuestBookForUser(self.state.user, self.state.locations[e.target.value], function ( err, guestbookData ) {
         if (err) {
            self._isMounted && self.props.showAlert(err.message, 'error');
         } else {
            if (guestbookData === null) {
               self._isMounted && self.setState({
                  isNotExist : true, 
                  guestbookData: {['introduction']: undefined},
                  sectionData: 'isEmpty'                  
               });
            } else {
               self._isMounted && self.setState({isNotExist : false, guestbookData});

               self._isMounted && parse.getSectionData(guestbookData.id, function ( err, sectionData ) {
                  if (err) {
                     self._isMounted && self.props.showAlert(err.message, 'error');
                  } else {
                     if (sectionData) {
                        self._isMounted && self.setState({ sectionData });
                     } else {
                        self._isMounted && self.setState({ sectionData: 'isEmpty' });
                     }
                  }
               });
            }
         }
      });
   }

   handleChange(e) {
      this.setState({imageFile: e.target.files[0]});
   }

   handleSubmit(e) {
      if ($(e.target).text() === "Submit" && this.state.imageFile === null) {
         e.preventDefault();
      } else {
         const self = this;

         this.setState({ uploadingImage: true });

         self._isMounted && parse.saveGuestBookData(self.state.user, self.state.locations[self.state.selectedLocationID], self.state.imageFile, self.state.introductionData, function(err, guestbookData) {
            if (err) {
               self._isMounted && self.setState({ uploadingImage: false });
               self._isMounted && self.props.showAlert(err.message, 'error');
            } else {
               self._isMounted && self.setState({ uploadingImage: false, guestbookData });
               self._isMounted && self.props.showAlert('Success!', 'success');

               if (self.state.isNotExist) {
                  self._isMounted && self.setState({isNotExist: !self.state.isNotExist});
               }
            }
         });         
      }
   }

   setSectionTitle(e) {
      this.setState({sectionTitle: e.target.value});
   }

   addSection() {
      var order;
      var sectionIntroduction = "<p>Hello from CKEditor 5!</p>";

      if (this.state.sectionData !== 'isEmpty') {
         order = this.state.sectionData.length + 1;
      } else {
         order = 1;
      }

      var self = this;

      self._isMounted && parse.addSection(order, this.state.guestbookData.id, this.state.sectionTitle, sectionIntroduction, function (err, sectionData) {
         if (err) {
            self._isMounted && self.props.showAlert(err.message, 'error');
         } else {
            self._isMounted && self.setState({sectionData});
            self._isMounted && self.props.showAlert("Success!", 'success');            
         }
      });
   }

   deleteSection(order) {
      var sectionData = this.state.sectionData;
      const self = this;

      for (var i = 0; i < sectionData.length; i++) {
         if (sectionData[i].order === order) {
            sectionData.splice(i, 1);
         }
      }

      if (sectionData.length === 0) {
         this.setState({ sectionData: 'isEmpty' });
      } else {
         for (var i = 0; i < sectionData.length; i++) {
            sectionData[i].order = i+1;
         }
      }      
      
      self._isMounted && parse.sectionReorder(sectionData, function(err, msg) {
         if (err) {
            self._isMounted && self.props.showAlert(err.message, 'error');
         }
      });
   }

   render() {
      return (
         <Fragment>
            <PageTitle
               title="Guestbook"
               desc="Manage your Guestbooks here."
            />
            <div className="container">
               <FormControl className="mb-20 ml-20">
                  <Select
                     value={this.state.selectedLocationID}
                     onChange={(e) => this.handleSelect(e)}
                     className="iron-select-width1"
                  >
                     {this.state.locations.map((location, index) => {
                        return (
                           <MenuItem key={index} value={index}>{location} Guestbook</MenuItem>   
                        );
                     })}
                  </Select>
               </FormControl>
               <hr className="mb-25"></hr>
               <div>
                  <h4>{this.state.locations[this.state.selectedLocationID]} Guestbook</h4>
                  <p className="lead mb-20">You can add an image to your LocationName Guestbook intro paragraph here.</p>
                  
                  {this.state.guestbookData ?
                     <div>
                        {this.state.guestbookData.image &&
                           <Card className="section-image ml-20" style={{marginBottom: "25px"}}>
                              <img src={this.state.guestbookData.image} alt="section-img" width={200}></img>
                           </Card>
                        }
                        <form className="guestbook-image mb-20 mt-30">
                           <label className="ml-20">Image: </label>
                           <input accept="image/*" id="outlined-button-file" name="image" type="file" onChange={this.handleChange}/>
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

                        <p className="lead mb-20">Edit your introduction</p>
                        <div className="ml-20">
                           <CKEditor
                              // config={{
                              //    toolbar: [ 'Heading', '|', 'Bold', 'Italic', 'Link', 'bulletedList', 'numberedList', 'BlockQuote', 'InsertTable', 'Undo', 'Redo' ]
                              // }}
                              editor={ ClassicEditor }
                              data={this.state.guestbookData.introduction !== undefined ? this.state.guestbookData.introduction : "<p>Hello from CKEditor 5!</p>"}
                              onInit={ editor => {} }
                              onChange={ ( event, editor ) => {
                                 const introductionData = editor.getData();
                                 this.setState({ introductionData });
                              } }
                           />
                           <Button 
                              className="button btn-active btn-sm mt-20 mb-20" 
                              onClick={this.handleSubmit}
                              disabled={this.state.uploadingImage}
                           >
                              Save
                           </Button>
                           {this.state.uploadingImage && <CircularProgress size={24} className="btn-spin" style={{marginTop: 25, marginLeft: -44}} />}
                        </div>
                     </div>
                  :
                     <Grid container spacing={5} className="mt-60 mb-60">
                        <Grid item  xs={12} sm={12} md={12} lg={12} xl={12} style={{display: "flex", justifyContent: "center"}}>
                           <CircularProgress className="btn-spin" />
                        </Grid>
                     </Grid>
                  }
               </div>
               <hr className="mb-25"></hr>
                  <div>
                     <p className="lead mb-20">Change the order of sections by dragging up and down</p>
                     {this.state.sectionData && this.state.sectionData !== 'isEmpty' ?
                        <DragDropContext onDragEnd={this.onDragEnd}>
                           <Droppable droppableId="droppable">
                              {(provided, snapshot) => (
                                 <div
                                 {...provided.droppableProps}
                                 ref={provided.innerRef}
                                 >
                                 {this.state.sectionData.map((item, index) => (
                                    <Draggable key={item.id} draggableId={item.id} index={index}>
                                       {(provided, snapshot) => (
                                       <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                       >
                                          <Section 
                                             item={item}
                                             deleteSection={this.deleteSection}
                                          />
                                       </div>
                                       )}
                                    </Draggable>
                                 ))}
                                 {provided.placeholder}
                                 </div>
                              )}
                           </Droppable>
                        </DragDropContext>                  
                     :
                        this.state.sectionData === 'isEmpty' ?
                           <Grid container spacing={5} className="mt-20">
                              <Grid item  xs={12} sm={12} md={12} lg={12} xl={12} style={{display: "flex", justifyContent: "center"}}>
                                 <p><i>No section to display!</i></p>
                              </Grid>
                           </Grid>
                        :
                           <Grid container spacing={5} className="mt-60 mb-60">
                              <Grid item  xs={12} sm={12} md={12} lg={12} xl={12} style={{display: "flex", justifyContent: "center"}}>
                                 <CircularProgress className="btn-spin" />
                              </Grid>
                           </Grid>
                     }
                     <hr className="mb-25"></hr>
                  </div>
               <div>
                  <p className="lead mb-20">Add a new section here.</p>
                  <TextField
                     value={this.state.sectionTitle}
                     className="ml-20"
                     onChange={this.setSectionTitle}
                  />
                  {this.state.isNotExist ? 
                     <Button className="button btn-active btn-sm ml-20 mb-60" disabled>Add New Section</Button>
                  : 
                     <Button className="button btn-active btn-sm ml-20 mb-60" onClick={this.addSection}>Add New Section</Button>
                  }
               </div>
            </div>
            <div style={{height: 100}}></div>
         </Fragment>
      )
   }
}

// map state to props
const mapStateToProps = state => {
   const token = state.Auth.idToken;
   return { token };
}

export default connect(mapStateToProps, {showAlert, logout: authAction.logout})(GuestBookPage);
