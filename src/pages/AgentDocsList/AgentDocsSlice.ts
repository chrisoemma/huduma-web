import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

  export async function getAgentDocs(agentId: number,
    params: {
        current?: number;
        pageSize?: number;
        
      },
    options?: { [key: string]: any }) {

    return request(`${API_URL}/admin/agents/all_documents/${agentId}`, {
        method: 'GET',
        params: {
          ...params,
        },
        ...(options || {}),
      });
  }






  export async function agentDesignationDoc(agentId: number,
    params: {
        current?: number;
        pageSize?: number;
        
      },
    options?: { [key: string]: any }) {

    return request(`${API_URL}/agents/agent_working_documents/${agentId}`, {
        method: 'GET',
        params: {
          ...params,
        },
        ...(options || {}),
      });
  }

  export async function updateDocStatus(docId: number, options?: {status:string }) {
    return request(`${API_URL}/admin/agents/change_doc_status/${docId}`, {
      method: 'PUT',
      data: {
        status: options?.status,
        method: 'put',
        ...(options || {}),
      },
    });
   }


   export async function addAgentDoc(agentId:number, options?: { [key: string]: any }) {

    return request(`${API_URL}/agents/documents/${agentId}`, {
      method: 'POST',
      data:{
        method: 'post',
        ...(options || {}),
      }
    });
  }




  export async function removeDocs(options?: { [key: string]: any }) {
    //console.log('keyyyyeyye',options)
    const { action_by, ...otherOptions } = options || {};

return request(`${API_URL}/admin/delete_bunch_docs`, {
  method: 'DELETE',
  data:{
    method: 'delete',
    action_by: action_by,
    ...(otherOptions || {}),
  }
});
}

