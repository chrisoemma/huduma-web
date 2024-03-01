import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

export async function getDesignations(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/designations`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }

  export async function addDesignations(options?: { [key: string]: any }) {

    return request(`${API_URL}/designations`, {
      method: 'POST',
      data:{
        method: 'post',
        ...(options || {}),
      }
    });
  }


  export async function updateDesignation(DesignationId: number, options?: { [key: string]: any }) {
 return request(`${API_URL}/designations/${DesignationId}`, {
   method: 'PUT',
   data: {
     method: 'put',
     ...(options || {}),
   },
 });
}


// export async function updateRegistrationDocStatus(options?: { [document_ids: string]: any, status: string }) {
//   return request(`${API_URL}/admin/working_documents_status`, {
//       method: 'PUT',
//       data: {
//           method: 'put',
//           status: options?.status,
//           ...(options || {}),
//       },
//   });
// }


export async function getWorkingDocuments(
  params: {
    current?: number;
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request(`${API_URL}/admin/designation_documents`, {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}


export async function removeDesignation(options?: { [key: string]: any }) {
  
  const { action_by, ...otherOptions } = options || {};

return request(`${API_URL}/admin/destroy_bunch_designation`, {
method: 'DELETE',
data:{
  method: 'delete',
  action_by: action_by,
  ...(otherOptions || {}),
}
});

}