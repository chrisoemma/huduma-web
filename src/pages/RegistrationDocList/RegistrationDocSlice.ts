import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

export async function getRegistrationDoc(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/admin/working_documents`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }

  export async function addRegistrationDoc(options?: { [key: string]: any }) {

    return request(`${API_URL}/admin/working_documents`, {
      method: 'POST',
      data:{
        method: 'post',
        ...(options || {}),
      }
    });
  }


  export async function updateRegistrationDoc(docId: number, options?: { [key: string]: any }) {
 return request(`${API_URL}/admin/working_documents/${docId}`, {
   method: 'PUT',
   data: {
     method: 'put',
     ...(options || {}),
   },
 });
}


export async function updateRegistrationDocStatus(options?: { [document_ids: string]: any, status: string,updated_by:number }) {
  return request(`${API_URL}/admin/working_documents_status`, {
      method: 'PUT',
      data: {
          method: 'put',
          status: options?.status,
          updated_by:options?.updated_by,
          ...(options || {}),
      },
  });
}