import React from 'react';
import Grid from '@material-ui/core/Grid';
import { Animate } from "react-show";

export default class Section extends React.Component {
   constructor(props) {
      super(props);
      this.state = {
         sectionShow: false,
      };
      this.toggleSectionShow = this.toggleSectionShow.bind(this);
   }

   toggleSectionShow() {
      this.setState({ sectionShow: !this.state.sectionShow });
   }

   render() {
      var { section } = this.props;

      return(
         <div>
            <div className="section-header" onClick={this.toggleSectionShow} style={{borderRadius: 10}}>
               <Grid container justify="space-between">
                  <Grid item>
                     <h4>{section.sectionTitle}</h4>
                  </Grid>
                  <Grid item>
                     <h4 sytle={{float: 'right'}}>{this.state.sectionShow ? "-" : "+"}</h4>
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
                     {section.image && 
                        <img src={section.image} alt="section-img"></img>
                     }
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12} dangerouslySetInnerHTML={{ __html: section.sectionIntroduction }}>
                  </Grid>
               </Grid>
            </Animate>    
         </div>                
      )
   }
}