import React from 'react';
import { connect } from "react-redux";
import Grid from '@material-ui/core/Grid';
import CircularProgress from '@material-ui/core/CircularProgress';
import Section from './section';

// Parse
import parse from '../../parse/parse';

import { showAlert } from "../../actions/action";

class GuestbookView extends React.Component {
   constructor(props) {
      super(props);
      this.state = {
         guestbookData: null,
         sectionData: null
      };
   }

   UNSAFE_componentWillMount() {
      var guestbookId = this.props.match.params.id;
      const self = this;

      parse.getGuestBookFromId(guestbookId, function(err, res) {
         if (err) {
            self.props.showAlert(err.message, 'error');
         } else {
            self.setState({ guestbookData: res });

            parse.getSectionData(guestbookId, function(err, res) {
               if (err) {
                  self.props.showAlert(err.message, 'error');
               } else {
                  self.setState({ sectionData: res });
               }
            });
         }
      });      
   }

   render() {
      var { guestbookData, sectionData } = this.state;

      return (
         <div className="mt-40 ml-20 mr-20">
            {guestbookData && sectionData ?
               <div>
                  <div>
                     <h3>Welcome to {guestbookData.location}</h3>
                     <Grid container spacing={4}>
                        <Grid item xs={12} sm={12} md={12} lg={12}>
                           {guestbookData.image && 
                              <img src={guestbookData.image} alt="guestbook-title-img"></img>
                           }
                        </Grid>
                        <Grid item xs={12} sm={12} md={12} lg={12} dangerouslySetInnerHTML={{ __html: guestbookData.introduction }}>
                        </Grid>
                     </Grid>
                  </div>
                  {sectionData.map((section, index) => (
                     <Section 
                        key={index} 
                        section={section}
                     />                     
                  ))}
               </div>            
            :
               <Grid container spacing={5} className="mt-60 mb-60">
                  <Grid item  xs={12} sm={12} md={12} lg={12} xl={12} style={{display: "flex", justifyContent: "center"}}>
                     <CircularProgress className="btn-logoimg-spin" />
                  </Grid>
               </Grid>
            }
         </div>
      );
   }   
}

export default connect(null, {showAlert})(GuestbookView);