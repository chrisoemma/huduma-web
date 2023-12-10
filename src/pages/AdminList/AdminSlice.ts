import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

export async function getRoles(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any }
  ) {
    return request(`${API_URL}/admin/roles`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }


  export async function getSystemAdmins(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any }
  ) {
    return request(`${API_URL}/admin/get_system_users`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }


  export async function addUserAdmin(options?: { [key: string]: any }) {
    return request(`${API_URL}/admin/create_system_user`, {
      method: 'POST',
      data:{
        method: 'post',
        ...(options || {}),
      }
    });
  }


  export async function updateUserAdmin(agentId: number, options?: { [key: string]: any }) {
   

    console.log('agentin server',agentId);
    console.log('optionssss',options);

  return request(`${API_URL}/admin/update_system_user/${agentId}`, {
    method: 'PUT',
    data: {
      method: 'put',
      ...(options || {}),
    },
  });
}