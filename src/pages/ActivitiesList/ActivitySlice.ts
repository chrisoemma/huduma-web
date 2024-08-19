import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

export async function getActivities(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any }
  ) {
    return request(`${API_URL}/activities`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }


  export async function getPendingActivities(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any }
  ) {
    return request(`${API_URL}/activities/pending_activities`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }



  export async function updateActivityStatus(options?: { [key: string]: any }) {
    const { action_by, status, ...otherOptions } = options || {};
  
    return request(`${API_URL}/activities/update_status`, {
      method: 'PUT',
      data: {
        method: 'PUT',
        action_by: action_by,
        status: status,
        ...(otherOptions || {}),
      },
    });
  }

