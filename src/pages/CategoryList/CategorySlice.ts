import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';
import axios from 'axios';

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

 export async function addCategory(formData) {
    return axios.post(`${API_URL}/categories`, formData);
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

// const headers = {
//   'Content-Type': 'multipart/form-data',
// }

export async function updateCategory(categoryId, formData) {
  try {
    return  axios.post(`${API_URL}/categories/update_category/${categoryId}`,formData);
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
}

