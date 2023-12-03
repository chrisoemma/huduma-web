import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

export async function getDashbordRequests(
    params: {
      current?: number;
      pageSize?: number;
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/admin/dashboard_requests`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }

  export async function getDashbordClients(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/admin/dashboard_clients`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }

  export async function getDashbordProviders(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/admin/dashboard_providers`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }



  export async function getDashbordAgents(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/admin/dashboard_agents`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }

  export async function getDashbordRequestVsServices(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/admin/charts/requests-vs-businesses`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }
