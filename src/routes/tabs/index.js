 /**
 * Tabs Page
 */
/* eslint-disable */
import React, { Fragment } from 'react';
import { connect } from "react-redux";
import FormControl from '@material-ui/core/FormControl';
import Grid from '@material-ui/core/Grid';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import CircularProgress from '@material-ui/core/CircularProgress';
import Button from '@material-ui/core/Button';

import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

//component
import ContentLoader from '../../components/global/loaders/ContentLoader';
import PageTitle from '../../components/widgets/PageTitle';
import Tab from '../../components/widgets/Tab';
import parse from '../../parse/parse';
import { showAlert } from "../../actions/action";
import authAction from '../../reducers/auth/actions';

const reorder = (list, startIndex, endIndex) => {
   const result = Array.from(list);
   const [removed] = result.splice(startIndex, 1);
   result.splice(endIndex, 0, removed);
 
   return result;
};

class TabsPage extends React.Component {

   constructor(props) {
      super(props);
      this.state = {
         user: null,
         locations: [],
         tabData: null,
         tabList: [],
         icons: [],
         selectedLocationID: 0,
         selectedTab: 0,
         tabAdding: false
      };
      this.onDragEnd = this.onDragEnd.bind(this);
      this.handleLocationSelect = this.handleLocationSelect.bind(this);
      this.handleTabSelect = this.handleTabSelect.bind(this);
      this.addTab = this.addTab.bind(this);
      this.resetTabData = this.resetTabData.bind(this);
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

                  const location = subLocations[0];
                  self._isMounted && parse.getTabs(self.state.user, location, function(err, res) {
                     if (err) {
                        self._isMounted && self.props.showAlert(err.message, 'error');
                     } else {
                        self._isMounted && self.resetTabData(res);

                        self._isMounted && parse.getIcons(function(err, res) {
                           if (err) {
                              self._isMounted && self.props.showAlert(err.message, 'error');
                           } else {
                              self._isMounted && self.setState({icons: res});
                           }
                        });
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
        this.state.tabData,
        result.source.index,
        result.destination.index
      );

      for (var i = 0; i < items.length; i++) {
         items[i].order = i+1;
      }

      this.setState({ tabData: items });
      const self = this;
      self._isMounted && parse.tabReorder(self.state.user, self.state.locations[self.state.selectedLocationID], items, function(err, msg) {
         if (err) {
            self._isMounted && self.props.showAlert(err.message, 'error');
         }
      });
   }

   handleLocationSelect(e) {
      this.setState({ selectedLocationID: e.target.value });

      const location = this.state.locations[e.target.value];
      const self = this;
      self._isMounted && parse.getTabs(self.state.user, location, function(err, res) {
         if (err) {
            self._isMounted && self.props.showAlert(err.message, 'error');
         } else {
            self._isMounted && self.resetTabData(res);
         }
      });
   }

   handleTabSelect(e) {
      this.setState({ selectedTab: e.target.value });
   }

   addTab() {
      this.setState({tabAdding: true});

      const self = this;
      const location = this.state.locations[this.state.selectedLocationID];
      const tabName = this.state.tabList[this.state.selectedTab];
      const order = this.state.tabData.length + 1;

      var tabData = {
         location: location,
         icon: tabName === 'image' ? 'gallery' : tabName,
         type: tabName,
         order: order,
         isMessages: undefined
      };

      if (tabName === 'messages') {
         tabData.isMessages = true;
      }

      self._isMounted && parse.addTab(self.state.user, tabData, function(err, res) {
         if (err) {
            self._isMounted && self.props.showAlert(err.message, 'error');
            self._isMounted && self.setState({tabAdding: false});
         } else {
            self.resetTabData(res);
            self._isMounted && self.setState({tabAdding: false});
         }
      });
   }

   resetTabData(tabData) {
      var tabList = ['messages', 'image', 'call', 'guestbook'];

      tabData.map((tab, index) => {
         tabList = tabList.filter(tabListItem => tabListItem !== tab.type);
      });
      tabList.push('web');

      this._isMounted && this.setState({ tabData, tabList });
   }

   render() {
      const { tabData } = this.state;

      return (
         <Fragment>
            <PageTitle
               title="Tabs"
               desc="Manage your app tabs here. Select to edit, or drag to re order in your app. Note; The app will automatically add a 'More' tab where the device width and number of tabs requires it."
            />
            <div className="container mt-20">
               <FormControl className="mb-20 ml-20">
                  <Select
                     value={this.state.selectedLocationID}
                     onChange={this.handleLocationSelect}
                     className="iron-select-width1"
                  >
                     {this.state.locations.map((location, index) => {
                        return (
                           <MenuItem key={index} value={index}>{location} Tabs</MenuItem>   
                        );
                     })}
                  </Select>
               </FormControl>
               <hr className="mb-25"></hr>
               <div>
                  <p className="lead mb-20">Add a new tab here.</p>
                  <FormControl className="mb-20 ml-20">
                     <Select
                        value={this.state.selectedTab}
                        onChange={this.handleTabSelect}
                        className="iron-select-width1"
                     >
                        {this.state.tabList.map((tab, index) => {
                           return (
                              <MenuItem key={index} value={index}>{tab}</MenuItem>   
                           );
                        })}
                     </Select>
                  </FormControl>
                  <Button className="button btn-active btn-sm ml-20" onClick={this.addTab} disabled={this.state.tabAdding}>Add Tab</Button>
                  {this.state.tabAdding && <CircularProgress size={24} className="btn-tabadd-spin" />}
               </div>
               <hr className="mb-25"></hr>
               <p className="lead">Tab List</p>
               {tabData && tabData.length !== 0 && this.state.icons.length !== 0 ?
                  <DragDropContext onDragEnd={this.onDragEnd}>
                     <Droppable droppableId="droppable">
                        {(provided, snapshot) => (
                           <div
                           {...provided.droppableProps}
                           ref={provided.innerRef}
                           >
                           {this.state.tabData.map((item, index) => (
                              <Draggable key={item.id} draggableId={item.id} index={index}>
                                 {(provided, snapshot) => (
                                 <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                 >
                                    <Tab 
                                       tab={item} 
                                       user={this.state.user}
                                       location={this.state.locations[this.state.selectedLocationID]} 
                                       icons={this.state.icons} 
                                       resetTabData={this.resetTabData}
                                       user={this.state.user}
                                       location={this.state.locations[this.state.selectedLocationID]}
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
                  tabData && tabData.length === 0 ?
                     <Grid container spacing={5} className="mt-20">
                        <Grid item  xs={12} sm={12} md={12} lg={12} xl={12} style={{display: "flex", justifyContent: "center"}}>
                           <p><i>No tabs to display!</i></p>
                        </Grid>
                     </Grid>
                  :
                     <Grid container spacing={5} className="mt-20">
                        <Grid item  xs={12} sm={12} md={12} lg={12} xl={12} style={{display: "flex", justifyContent: "center"}}>
                           {!this.state.messages && <CircularProgress className="btn-logoimg-spin" />}
                        </Grid>
                     </Grid>
               }
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

export default connect(
   mapStateToProps, 
   {
      showAlert, 
      logout: authAction.logout      
   })(TabsPage);