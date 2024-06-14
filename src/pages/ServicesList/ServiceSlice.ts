import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

export async function getServices(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/admin/services`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }

  export async function addService(options?: { [key: string]: any }) {
    return request(`${API_URL}/services`, {
      method: 'POST',
      data:{
        method: 'post',
        ...(options || {}),
      }
    });
  }

  export async function removeService(options?: { [key: string]: any }) {
    const { deleted_by, ...otherOptions } = options || {};
return request(`${API_URL}/services/destroy_bunch`, {
  method: 'DELETE',
  data:{
    method: 'delete',
    deleted_by: deleted_by,
    ...(otherOptions || {}),
  }
});
}


export async function updateService(serviceId: number, options?: { [key: string]: any }) {
     
  return request(`${API_URL}/services/${serviceId}`, {
    method: 'PUT',
    data: {
      method: 'put',
      ...(options || {}),
    },
  });
}

