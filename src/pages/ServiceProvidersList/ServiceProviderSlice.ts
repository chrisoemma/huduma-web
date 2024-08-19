import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

export async function getProviders(
    params: {
      current?: number;
      pageSize?: number;
      reg_number,
      nida,
      phone,
      name
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/providers`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }

  export async function addProvider(options?: { [key: string]: any }) {
    return request(`${API_URL}/providers`, {
      method: 'POST',
      data:{
        method: 'post',
        ...(options || {}),
      }
    });
  }


  export async function removeProvider(options?: { [key: string]: any }) {
    //console.log('keyyyyeyye',options)
    const { action_by, ...otherOptions } = options || {};

return request(`${API_URL}/providers/destroy_bunch`, {
  method: 'DELETE',
  data:{
    method: 'delete',
    action_by: action_by,
    ...(otherOptions || {}),
  }
});
}


export async function updateProvider(providerId: number, options?: { [key: string]: any }) {
   
  return request(`${API_URL}/providers/update_provider_web/${providerId}`, {
    method: 'PUT',
    data: {
      method: 'put',
      ...(options || {}),
    },
  });
}




export async function approveProfession(id: number, options?: { [key: string]: any }) {
   
  return request(`${API_URL}/designations/professional_approval/${id}`, {
    method: 'PUT',
    data: {
      method: 'put',
      ...(options || {}),
    },
  });
}


export async function fetchBusinessesData(providerId: number, options?: { [key: string]: any }) {
   
  return request(`${API_URL}/businesses/provider_businesses/${providerId}`, {
    method: 'GET',
    data: {
      method: 'get',
      ...(options || {}),
    },
  });
}

