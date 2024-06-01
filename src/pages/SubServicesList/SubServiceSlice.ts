import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

export async function getSubServices(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/admin/sub_services`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }

  export async function addSubService(options?: { [key: string]: any }) {
    return request(`${API_URL}/sub_services`, {
      method: 'POST',
      data:{
        method: 'post',
        ...(options || {}),
      }
    });
  }

  export async function removeSubService(options?: { [key: string]: any }) {
    //console.log('keyyyyeyye',options)
return request(`${API_URL}/sub_services/destroy_bunch`, {
  method: 'DELETE',
  data:{
    method: 'delete',
    ...(options || {}),
  }
});
}


export async function updateSubService(serviceId: number, options?: { [key: string]: any }) {
     
  return request(`${API_URL}/sub_services/${serviceId}`, {
    method: 'PUT',
    data: {
      method: 'put',
      ...(options || {}),
    },
  });
}

