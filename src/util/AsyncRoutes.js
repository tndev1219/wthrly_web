/**
 * AsyncRoutes
 * Code Splitting Component / Server Side Rendering
 */
import React from 'react';
import Loadable from 'react-loadable';

//app loader
import ContentLoader from '../components/global/loaders/ContentLoader';

//Home
const AsyncHomePageComponent = Loadable({
   loader: () => import('../routes/home'),
   loading: () => <ContentLoader />
});

// Message
const AsyncMessagePageComponent = Loadable({
   loader: () => import('../routes/message'),
   loading: () => <ContentLoader />
});

// Message Add
const AsyncMessageAddPageComponent = Loadable({
  loader: () => import('../routes/message/add'),
  loading: () => <ContentLoader />
});

// Message Edit
const AsyncMessageEditPageComponent = Loadable({
  loader: () => import('../routes/message/edit'),
  loading: () => <ContentLoader />
});

// GuestBook
const AsyncGuestBookPageComponent = Loadable({
   loader: () => import('../routes/guestbook'),
   loading: () => <ContentLoader />
});

// Styles
const AsyncStylesPageComponent = Loadable({
   loader: () => import('../routes/styles'),
   loading: () => <ContentLoader />
});

// Tabs
const AsyncTabsPageComponent = Loadable({
   loader: () => import('../routes/tabs'),
   loading: () => <ContentLoader />
});

// Statistics
const AsyncStatisticsPageComponent = Loadable({
   loader: () => import('../routes/statistics'),
   loading: () => <ContentLoader />
});

// page404
const AsyncPageNotFoundComponent = Loadable({
   loader: () => import('../routes/page-404'),
   loading: () => <ContentLoader />,
});

// SignIn
const AsyncSignInPageComponent = Loadable({
   loader: () => import('../routes/session/sign-in'),
   loading: () => <ContentLoader />,
});

// SignIn
const AsyncSignUpPageComponent = Loadable({
  loader: () => import('../routes/session/sign-up'),
  loading: () => <ContentLoader />,
});

// Subscription
const AsyncSubscriptionPageComponent = Loadable({
  loader: () => import('../routes/subscription'),
  loading: () => <ContentLoader />,
});

// Guestbook View Page
const AsyncGuestbookViewPageComponent = Loadable({
   loader: () => import('../routes/view_guestbook'),
   loading: () => <ContentLoader />,
 });

export {
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
};