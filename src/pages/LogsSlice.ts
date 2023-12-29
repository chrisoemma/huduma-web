import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

export async function getUserLogs(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/admin/logs/users`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }