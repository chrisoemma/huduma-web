import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

export async function getPermissions(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/admin/permissions`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }



  export async function getPermissionCategories(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/admin/permissions/categories`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }
  //
  

  export async function addPermission(options?: { [key: string]: any }) {
    return request(`${API_URL}/admin/permissions`, {
      method: 'POST',
      data:{
        method: 'post',
        ...(options || {}),
      }
    });
  }


  export async function removePermission(options?: { [key: string]: any }) {
return request(`${API_URL}/admin/permissions`, {
  method: 'DELETE',
  data:{
    method: 'delete',
    ...(options || {}),
  }
});
}



export async function updatePermission(roleId: number, options?: { [key: string]: any }) {


  return request(`${API_URL}/admin/permissions/${roleId}`, {
    method: 'PUT',
    data: {
        
      method: 'put',
      ...(options || {}),
    },
  });
}

