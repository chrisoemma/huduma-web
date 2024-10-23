export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        name: 'login',
        path: '/user/login',
        component: './User/Login',
      },
      {
        name: 'verify-account',
        path: '/user/verify-account',
        component: './User/VerifyAccount',
      },
      {
        name: 'create-account-password',
        path: '/user/create-account-password',
        component: './User/CreateAccountPassword',
      },

    ],
  },
  // {
  //   path: '/account',
  //   layout: false,
  //   routes: [
  //     {
  //       name: 'account',
  //       path: '/verify-account',
  //       component: './User/VerifyAccount',
  //     },
  //   ],
  // },
  {
    path: '/user-management',
    routes: [
      {
        name: 'Provider-docs',
        path: 'service-providers/documents/provider/:id',
        component: './ProviderDocsList/',
      },
    ],
  },
  {
    path: '/user-management',
    routes: [
      {
        name: 'Agents-docs',
        path: 'agents/documents/agent/:id',
        component: './AgentDocsList/',
      },
    ],
  },
  {
    path: '/user-management',
    routes: [
      {
        name: 'Employees',
        path: 'service-providers/employees/provider/:id',
        component: './EmployeeList/',
      },
    ],
  },

  {
    path: '/user-management',
    routes: [
      {
        name: 'Agent Commissions',
        path: 'agents/commisions/:id',
        component: './AgentList/CommissionList',
      },
    ],
  },
  {
    path: '/user-management',
    routes: [
      {
        name: 'Clients',
        path: 'agents/clients/:id',
        component: './AgentList/ClientList',
      },
    ],
  },
  {
    path: '/user-management',
    routes: [
      {
        name: 'Providers',
        path: 'agents/providers/:id',
        component: './AgentList/ProviderList',
      },
    ],
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    icon: 'home',
    component: './Welcome',
  },
  {
    path: '/user-management',
    name: 'user-management',
    icon: 'gold',
    routes: [
      {
        path: '/user-management/agents',
        name: 'Agents',
        component: './AgentList',
      },
      {
        path: '/user-management/service-providers',
        name: 'Service providers', 
        component: './ServiceProvidersList',
      },

  
      {
        path: '/user-management/clients',
        name: 'Clients',
        component: './ClientsList',
      },
      {
        path: '/user-management/employees',
        name: 'Employees',
        component: './AllEmployeesList',
      },
    ],
  },

  {
    path: '/requests',
    name: 'Requests',
    icon: 'tool',
    routes: [

      {
        path: '/requests/active-requests',
        name: 'Active Requests',
        component: './Requests/ActiveRequests',
      },
      {
        path: '/requests/requests-history',
        name: 'History',
        component: './Requests/PastRequests',
      },
     
    ],
  },
  {
    path: '/provider-sub-services',
    name: 'Provider sub services',
    icon: 'table',
    routes: [
      {
        path: '/provider-sub-services/approval',
        name: 'Approval of sub services',
        component: './SubserviceChangeStatus',
      },
      {
        path: '/provider-sub-services/list',
        name: 'Provider sub service list', 
        component: './ProviderSubServiceList',
      },
    ],
  },
  {
    path: '/commissions',
    name: 'Commissions',
    icon: 'alert',
    routes: [
      {
        path: '/commissions/outstanding-payments',
        name: 'Outstanding Payments',
        component: './Commisions/ActiveCommisionList',
      },
      {
        path: '/commissions/completed-payments',
        name: 'Completed Payments',
        component: './Commisions/PreviousCommisionList',
      },
     
    ],
  },

  {
    path: '/provider-subscriptions',
    name: 'Provider-subscriptions',
    icon: 'alert',
    routes: [
      {
        path: '/provider-subscriptions/active-list',
        name: 'Active subscriptions',
        component: './ProviderSubscriptionList/ActiveSubscriptionsList',
      },
      {
        path: '/provider-subscriptions/expired-list',
        name: 'Expired subscriptions',
        component: './ProviderSubscriptionList/ExpiredSubscriptionsList',
      },
     
    ],
  },
  {
    name: 'Activities',
    icon:'table',
    path: '/activities',
    component: './ActivitiesList',
  },
  
   {
    name: 'Banners',
    icon: 'table',
    path: '/banners',
    component: './BannerList',
  },
  {
    path: '/administrations',
    name: 'Administrative',
    icon: 'holder',
    routes: [
      {
        path: '/administrations/internal-users',
        name: 'Internal users',
        component: './AdminList',
      },
      {
        path: '/administrations/permissions',
        name: 'User permissions',
        component: './PermissionsList',
      },
      {
        path: '/administrations/roles',
        name: 'User roles',
        component: './RolesList',
      },
    ]
  },
  {
    path: '/settings',
    name: 'Settings',
    icon: 'windows',
    routes: [

      {
        path: '/settings/categories',
        name: 'Categories',
        component: './CategoryList',
      },
      {
        path: '/settings/sub-categories',
        name: 'Sub category', 
        component: './SubCategory',
      },
      {
        path: '/settings/services',
        name: 'Services',
        component: './ServicesList',
      },
      {
        path: '/settings/documents',
        name: 'Documents',
        component: './RegistrationDocList',
      },
      {
        path: '/settings/professionals',
        name: 'Professionals',
        component: './DesignationList',
      },
      {
        path: '/settings/feeback-templates',
        name: 'Feedback Templates',
        component: './FeedbackTemplateList',
      },
      {
        path: '/settings/subscriptions-packages',
        name: 'Subscriptions Packages',
        component: './SubscriptionPackageList',
      },
      {
        path: '/settings/discounts',
        name: 'Packages Discounts',
        component: './DiscountList',
      },
      {
        path: '/settings/set-commission-amount',
        name: 'Set Commission Amount',
        component: './setCommissionAmountList',
      },
      {
        path: '/settings/terms-of-services',
        name: 'Terms of services',
        component: './TermsOfServices',
      },

    ],
  },
  {
    path: '/system-logs',
    name: 'System logs',
    icon: 'apartment',
    routes: [
      {
        path: '/system-logs/users',
        name: 'Users',
        component: './UserLogList',
      },
      // {
      //   path: '/system-logs/settings',
      //   name: 'Settings Logs',
      //   component: './PermissionsList',
      // },
      // {
      //   path: '/system-logs/administrative',
      //   name: 'Administrative logs',
      //   component: './RolesList',
      // },
    ]
  },

  // {
  //   name: 'System logs',
  //   icon: 'table',
  //   path: '/list',
  //   component: './TableList',
  // },
 
  {
    path: '/',
    redirect: 'dashboard',
  },
  {
    path: '*',
    layout: false,
    component: './404',
  },

];
