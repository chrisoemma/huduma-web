import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';
import axios from 'axios';

export async function getSubCategories(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/admin/services`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }

  // export async function addService(options?: { [key: string]: any }) {
  //   return request(`${API_URL}/services`, {
  //     method: 'POST',
  //     data:{
  //       method: 'post',
  //       ...(options || {}),
  //     }
  //   });
  // }

  export async function addSubCategory(formData) {
    return axios.post(`${API_URL}/services`, formData);
}

  export async function removeSubCategory(options?: { [key: string]: any }) {
    const { deleted_by, ...otherOptions } = options || {};
return request(`${API_URL}/services/destroy_bunch`, {
  method: 'DELETE',
  data:{
    method: 'delete',
    deleted_by: deleted_by,
    ...(otherOptions || {}),
  }
});
}


// export async function updateService(serviceId: number, options?: { [key: string]: any }) {
     
//   return request(`${API_URL}/services/update_service/${serviceId}`, {
//     method: 'PUT',
//     data: {
//       method: 'put',
//       ...(options || {}),
//     },
//   });
// }

export async function updateSubCategory(serviceId, formData) {
  try {
    return  axios.post(`${API_URL}/services/update_service/${serviceId}`,formData);
  } catch (error) {
    console.error('Error updating services', error);
    throw error;
  }
}

