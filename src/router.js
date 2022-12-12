import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('./pages/Home.vue'),
      meta: { authenticated: true } // user must be authenticated to join
    },
    {
      path: '/team/:id',
      name: 'home-team',
      component: () => import('./pages/Home.vue'),
      meta: { authenticated: true } // user must be authenticated to join
    },
    {
      path: '/index.html',
      name: 'home-alt',
      component: () => import('./pages/Home.vue'),
      meta: { authenticated: true } // user must be authenticated to join
    },
    {
      path: '/channel/:id/:resource?',
      name: 'channel',
      component: () => import('./pages/Channel.vue'),
      meta: { requiresHash: true }
    },
    {
      path: '/channel/:id/:resource/*',
      name: 'channel-sub',
      component: () => import('./pages/Channel.vue'),
      meta: { requiresHash: true }
    },
    {
      path: '/files',
      name: 'files',
      component: () => import('./pages/Files.vue'),
      meta: { authenticated: true } // user must be authenticated to join
    },
    {
      path: '/files/*',
      name: 'files-sub',
      component: () => import('./pages/Files.vue'),
      meta: { requiresHash: true }
    },
    {
      path: '/actions',
      name: 'actions',
      component: () => import('./pages/Actions.vue'),
      meta: { authenticated: true } // user must be authenticated to join
    },
    {
      path: '/meeting/:hash',
      name: 'meeting',
      component: () => import('./pages/Meeting.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('./pages/Login.vue'),
      meta: { unauthenticated: true } // unauthenticated only
    },
    {
      path: '/authentication/:client',
      name: 'authentication',
      component: () => import('./pages/oauth/Authentication.vue')
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('./pages/Signup.vue'),
      meta: { unauthenticated: true } // unauthenticated only
    },
    {
      path: '/user.verify',
      name: 'user-verify',
      component: () => import('./pages/UserVerify.vue'),
      meta: { unauthenticated: true } // unauthenticated only
    },
    {
      path: '/recover',
      name: 'recover',
      component: () => import('./pages/ForgetPassword.vue'),
      meta: { unauthenticated: true } // unauthenticated only
    },
    {
      path: '/password.reset',
      name: 'password-reset',
      component: () => import('./pages/ForgetPasswordReset.vue'),
      meta: { unauthenticated: true } // unauthenticated only
    },
    {
      path: '/email-settings',
      name: 'email-settings',
      component: () => import('./pages/EmailSettings.vue')
    },
    {
      path: '/report',
      name: 'report',
      component: () => import('./pages/Report.vue')
    },
    {
      path: '/oauth',
      name: 'oauth',
      component: () => import('./pages/oauth/Auth.vue')
      // meta: { unauthenticated: true } // unauthenticated only
    },
    {
      path: '/oauth/clients',
      name: 'oauth-clients',
      component: () => import('./pages/oauth/Clients.vue')
    },
    // MOCKS
    {
      path: '/mocks/channel',
      name: 'mocks-channel',
      component: () => import('./pages/Mocks/Channel.vue')
    },
    {
      path: '/mocks/home',
      name: 'mocks-home',
      component: () => import('./pages/Mocks/Home.vue')
    }
  ]
});
