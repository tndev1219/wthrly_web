/**
 * Main App
 */
import React, { Fragment } from 'react';
import { connect } from "react-redux";
import SweetAlert from 'react-bootstrap-sweetalert';
import { MuiThemeProvider } from '@material-ui/core/styles';
import { IntlProvider } from 'react-intl';
import { Route, Switch } from 'react-router-dom';
import { Redirect } from 'react-router';

// css
import './lib/css.js';

// App locale
import AppLocale from './lang';

//layout 
import Header from "./components/layouts/headers/Header";
import HeaderWithOutTab from "./components/layouts/headers/HeaderWithOutTab";

//Add Loaders
import {
   AsyncHomePageComponent,
   AsyncMessagePageComponent,
   AsyncMessageAddPageComponent,
   AsyncMessageEditPageComponent,
   AsyncGuestBookPageComponent,
   AsyncStylesPageComponent,
   AsyncTabsPageComponent,
   AsyncStatisticsPageComponent,
   AsyncSignInPageComponent,
   AsyncSignUpPageComponent,
   AsyncSubscriptionPageComponent,
   AsyncPageNotFoundComponent,
   AsyncGuestbookViewPageComponent
} from './util/AsyncRoutes';

// actions
import { hideAlert } from "./actions/action";

// themes
import primaryTheme from './themes/primaryTheme';

class App extends React.Component {

   /**
    * method for update window top when new page render
    */
   componentDidUpdate(prevProps) {
      if (this.props.location !== prevProps.location) {
         window.scrollTo(0, 0);
      }
	}
	
	getUrl(pathname) {
      let pathArray = pathname.split('/');
      return `/${pathArray[1]}` === '/sign-in' || `/${pathArray[1]}` === '/sign-up' ? true : false;
   }

   checkSubscriptionUrl(pathname) {
      let pathArray = pathname.split('/');
      return `/${pathArray[1]}` === '/subscription' ? false : true;
   }

   checkGuestbookViewUrl(pathName) {
      let pathArray = pathName.split('/');
      return `/${pathArray[1]}` === '/view_guestbook' ? true : false;
   }

   render() {
		const { location, isLoggedIn, selectedLocation, isSubscribed } = this.props;
      const { selectedLocale, showAlert, alertMessage, alertType, hideAlert } = this.props;
      const currentAppLocale = AppLocale[selectedLocale.locale];

      return (
         <MuiThemeProvider theme={primaryTheme}>
            <IntlProvider
               locale={currentAppLocale.locale}
               messages={currentAppLocale.messages}
            >
               <Fragment>
                  {this.checkGuestbookViewUrl(location.pathname) ?

                     <Switch>
                        <Route path="/view_guestbook/:id" component={AsyncGuestbookViewPageComponent} exact />
                     </Switch>
                     :
                     this.getUrl(location.pathname) ?

                        <Switch>
                           {isLoggedIn && <Redirect to={'/home'} />}
                           <Route path="/sign-up" component={AsyncSignUpPageComponent} exact />
                           <Route path="/sign-in" component={AsyncSignInPageComponent} exact />
                        </Switch>
                        :
                        <div className="app-container">
                           <Fragment>
                           {this.checkSubscriptionUrl(location.pathname) ?
                              <Header />
                           :
                              <HeaderWithOutTab />
                           }								
                           </Fragment>

                           <Switch>
                              {isSubscribed && location.pathname === '/subscription' && <Redirect to={'/home'} />}
                              {!isLoggedIn && <Redirect to={{pathname:'/sign-in', state: {from: location}}} />}
                              {!selectedLocation && <Redirect exact from={'/message/add'} to={'/message'} />}
                              <Redirect exact from={"/"} to={"/home"} />
                              <Route path="/home" component={AsyncHomePageComponent} />
                              <Route exact path="/message" component={AsyncMessagePageComponent} />
                              <Route path="/message/add" component={AsyncMessageAddPageComponent} />
                              <Route path="/message/edit/:id" component={AsyncMessageEditPageComponent} />
                              <Route path="/guestbook" component={AsyncGuestBookPageComponent} />
                              <Route path="/styles" component={AsyncStylesPageComponent} />
                              <Route path="/tabs" component={AsyncTabsPageComponent} />
                              <Route path="/statistics" component={AsyncStatisticsPageComponent} />
                              <Route path="/subscription" component={AsyncSubscriptionPageComponent} />
                              <Route path="*" component={AsyncPageNotFoundComponent} />
                           </Switch>
                        </div>
                  }
                  <SweetAlert
                     success={alertType === 'success'}
                     error={alertType === 'error'}
                     title=''
                     confirmBtnText="Ok"
                     confirmBtnBsStyle="warning"
                     className="iron-alert-box"
                     show={showAlert}
                     onConfirm={hideAlert}
                     onCancel={hideAlert}
                     closeOnClickOutside
                  >
                     {alertMessage}
                  </SweetAlert>
               </Fragment>
            </IntlProvider>
         </MuiThemeProvider>
      )
   }
}

// map state to props
const mapStateToProps = state => {
   const { showAlert, alertMessage, alertType, selectedLocale, selectedLocation } = state.appSettings;
   const isLoggedIn = state.Auth.idToken !== null ? true : false;
   const isSubscribed = state.Auth.isSubscribed === true || state.Auth.isSubscribed === "true" ? true: false;
   return { showAlert, alertMessage, alertType, selectedLocale, selectedLocation, isLoggedIn, isSubscribed };
}

export default connect(mapStateToProps, { hideAlert })(App);