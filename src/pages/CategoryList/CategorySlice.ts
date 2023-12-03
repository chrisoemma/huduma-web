import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

export async function getCategories(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/categories`, {
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
    //console.log('keyyyyeyye',options)
return request(`${API_URL}/categories/destroy_bunch`, {
  method: 'DELETE',
  data:{
    method: 'delete',
    ...(options || {}),
  }
});
}


export async function updateCategory(categoryId: number, options?: { [key: string]: any }) {

     console.log('categoryId',categoryId)
     console.log('options',options);
   
  return request(`${API_URL}/categories/${categoryId}`, {
    method: 'PUT',
    data: {
      method: 'put',
      ...(options || {}),
    },
  });
}

