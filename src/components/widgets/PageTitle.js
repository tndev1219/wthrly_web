/**
 * Page title component
 */
import React from 'react';

function PageTitle(props) {
   return (
      <div className="page-title-bar">
         <div className="container">
            <h3 className="mb-30"> {props.title}</h3>
            <p className="lead mb-0"> {props.desc} </p>
         </div>
      </div>
   )
}

export default PageTitle;