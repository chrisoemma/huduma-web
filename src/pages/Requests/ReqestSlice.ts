import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

export async function getActiveRequests(
    params: {
      current?: number;
      pageSize?: number;
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/admin/active_requests`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }


  export async function getPastRequests(
    params: {
      current?: number;
      pageSize?: number;
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/admin/past_requests`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }