
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
    icon: 'crown',
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
    icon: 'user',
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
    name: 'System logs',
    icon: 'table',
    path: '/list',
    component: './TableList',
  },
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
