import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

export async function getPackages(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/packages`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }

  export async function addPackage(options?: { [key: string]: any }) {

    return request(`${API_URL}/packages`, {
      method: 'POST',
      data:{
        method: 'post',
        ...(options || {}),
      }
    });
  }


  export async function updatePackage(packageId: number, options?: { [key: string]: any }) {
 return request(`${API_URL}/packages/${packageId}`, {
   method: 'PUT',
   data: {
     method: 'put',
     ...(options || {}),
   },
 });
}


export async function removePackage(options?: { [key: string]: any }) {
  
  const { action_by, deleted_by, ...otherOptions } = options || {};

return request(`${API_URL}/admin/packages/destroy_bunch`, {
method: 'DELETE',
data:{
  method: 'delete',
  action_by: action_by,
  deleted_by:deleted_by,
  ...(otherOptions || {}),
}
});

}