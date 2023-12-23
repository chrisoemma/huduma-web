import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

export async function getProviderSubservices(
    params: {
      current?: number;
      pageSize?: number;
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/admin/new_provider_sub_services`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }


export async function changeStatus(subId:number, options?: { [key: string]: any }) {

  return request(`${API_URL}/admin/status_change/${subId}`, {
    method: 'PUT',
    data: {
      method: 'put',
      ...(options || {}),
    },
  });
}




