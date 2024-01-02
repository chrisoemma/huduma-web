import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

export async function getActiveCommisions(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/admin/commisions/active`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }

  export async function getPreviousCommisions(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/admin/commisions/previous`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }

  export async function AddPayment(commisionId: number, options?: { [key: string]: any }) {
    
    return request(`${API_URL}/admin/commisions/payment/${commisionId}`, {
      method: 'Post',
      data: {
        method: 'post',
        ...(options || {}),
      },
    });
  }





