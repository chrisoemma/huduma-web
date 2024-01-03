import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

export async function getAgents(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/agents`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }

  export async function addAgent(options?: { [key: string]: any }) {
    return request(`${API_URL}/agents`, {
      method: 'POST',
      data:{
        method: 'post',
        ...(options || {}),
      }
    });
  }


  export async function removeAgent(options?: { [key: string]: any }) {
    //console.log('keyyyyeyye',options)
    const { action_by, ...otherOptions } = options || {};

return request(`${API_URL}/agents/destroy_bunch`, {
  method: 'DELETE',
  data:{
    method: 'delete',
    action_by: action_by,
    ...(otherOptions || {}),
  }
});
}



export async function updateAgent(agentId: number, options?: { [key: string]: any }) {
   

  return request(`${API_URL}/agents/update_agent_web/${agentId}`, {
    method: 'PUT',
    data: {
      method: 'put',
      ...(options || {}),
    },
  });
}



export async function getAgentCommisions( agentId:number, params: {current?: number;pageSize?: number;
    
  },
  options?: { [key: string]: any },
) {
  return request(`${API_URL}/admin/commisions/agent_commisions/${agentId}`, {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}