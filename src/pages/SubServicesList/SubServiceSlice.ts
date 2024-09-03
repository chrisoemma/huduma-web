import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';
import axios from 'axios';

export async function getSubServices(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/admin/sub_services`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }

  // export async function addSubService(options?: { [key: string]: any }) {
  //   return request(`${API_URL}/sub_services`, {
  //     method: 'POST',
  //     data:{
  //       method: 'post',
  //       ...(options || {}),
  //     }
  //   });
  // }

  export async function addSubService(formData) {
    return axios.post(`${API_URL}/sub_services`, formData);
}

  export async function removeSubService(options?: { [key: string]: any }) {
    const { deleted_by, ...otherOptions } = options || {};
return request(`${API_URL}/sub_services/destroy_bunch`, {
  method: 'DELETE',
  data:{
    method: 'delete',
    deleted_by: deleted_by,
    ...(otherOptions || {}),
  }
});
}


// export async function updateSubService(serviceId: number, options?: { [key: string]: any }) {
     
//   return request(`${API_URL}/sub_services/${serviceId}`, {
//     method: 'PUT',
//     data: {
//       method: 'put',
//       ...(options || {}),
//     },
//   });
// }


export async function updateSubService(serviceId, formData) {
  try {
    return  axios.post(`${API_URL}/sub_services/update_subservice/${serviceId}`,formData);
  } catch (error) {
    console.error('Error updating sub_services', error);
    throw error;
  }
}

