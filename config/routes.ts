
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
    ],
  },
  {
    path: '/documents',
    routes: [
      {
        name: 'Provider-docs',
        path: 'provider/:id',
        component: './ProviderDocsList/',
      },
    ],
  },
  {
    path: '/employees',
    routes: [
      {
        name: 'Employees',
        path: 'provider/:id',
        component: './EmployeeList/',
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
        path: '/settings/services',
        name: 'Services', 
        component: './ServicesList',
      },
      {
        path: '/settings/sub-services',
        name: 'Sub services',
        component: './SubServicesList',
      },
      {
        path: '/settings/registration-docs',
        name: 'Registration docs',
        component: './RegistrationDocList',
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
    path: '/administrations',
    name: 'Administrative',
    icon: 'holder',
    routes: [
      {
        path: '/administrations/system-admins',
        name: 'System admins',
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
