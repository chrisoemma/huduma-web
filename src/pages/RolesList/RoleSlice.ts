import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

export async function getRoles(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/admin/roles`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }

  export async function addRole(options?: { [key: string]: any }) {
    return request(`${API_URL}/admin/roles`, {
      method: 'POST',
      data:{
        method: 'post',
        ...(options || {}),
      }
    });
  }


  export async function removeRole(options?: { [key: string]: any }) {
return request(`${API_URL}/admin/roles`, {
  method: 'DELETE',
  data:{
    method: 'delete',
    ...(options || {}),
  }
});
}



export async function updateRole(roleId: number, options?: { [key: string]: any }) {


  return request(`${API_URL}/admin/roles/${roleId}`, {
    method: 'PUT',
    data: {
        
      method: 'put',
      ...(options || {}),
    },
  });
}

