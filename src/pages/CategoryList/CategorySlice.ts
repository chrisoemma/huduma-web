import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

export async function getCategories(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/admin/categories`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }

  export async function addCategory(options?: { [key: string]: any }) {
    return request(`${API_URL}/categories`, {
      method: 'POST',
      data:{
        method: 'post',
        ...(options || {}),
      }
    });
  }


  export async function removeCategory(options?: { [key: string]: any }) {
    const { deleted_by, ...otherOptions } = options || {};
return request(`${API_URL}/categories/destroy_bunch`, {
  method: 'DELETE',
  data:{
    method: 'delete',
    deleted_by: deleted_by,
    ...(otherOptions || {}),
  }
});
}


export async function updateCategory(categoryId: number, options?: { [key: string]: any }) {

  
   
  return request(`${API_URL}/categories/${categoryId}`, {
    method: 'PUT',
    data: {
      method: 'put',
      ...(options || {}),
    },
  });
}

