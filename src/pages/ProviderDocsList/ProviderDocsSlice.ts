import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

  export async function getProviderDocs(providerId: number,
    params: {
        current?: number;
        pageSize?: number;
        
      },
    options?: { [key: string]: any }) {

    return request(`${API_URL}/admin/all_documents/${providerId}`, {
        method: 'GET',
        params: {
          ...params,
        },
        ...(options || {}),
      });
  }


  export async function updateDocStatus(docId: number, options?: {status:string }) {
    return request(`${API_URL}/admin/change_doc_status/${docId}`, {
      method: 'PUT',
      data: {
        status: options?.status,
        method: 'put',
        ...(options || {}),
      },
    });
   }