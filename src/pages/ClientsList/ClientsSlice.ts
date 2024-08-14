import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

export async function getClients(
    params: {
      current?: number;
      pageSize?: number;
      reg_number,
      phone,
      name
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/clients`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }

  export async function addClient(options?: { [key: string]: any }) {
    return request(`${API_URL}/clients`, {
      method: 'POST',
      data:{
        method: 'post',
        ...(options || {}),
      }
    });
  }


  export async function removeClient(options?: { [key: string]: any }) {

    const { action_by, ...otherOptions } = options || {};

return request(`${API_URL}/clients/destroy_bunch`, {
  method: 'DELETE',
  data:{
    method: 'delete',
    action_by: action_by,
    ...(otherOptions || {}),
  }
});
}


export async function updateClient(clientId: number, options?: { [key: string]: any }) {

  return request(`${API_URL}/clients/update_client_web/${clientId}`, {
    method: 'PUT',
    data: {
      method: 'put',
      ...(options || {}),
    },
  });
}

