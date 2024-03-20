import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

export async function getCommissionAmount(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/set_agents_commissions`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }

  export async function addCommissionAmount(options?: { [key: string]: any }) {

    return request(`${API_URL}/set_agents_commissions`, {
      method: 'POST',
      data:{
        method: 'post',
        ...(options || {}),
      }
    });
  }


  export async function updateCommissionAmount(CommissionAmountId: number, options?: { [key: string]: any }) {
 return request(`${API_URL}/set_agents_commissions/${CommissionAmountId}`, {
   method: 'PUT',
   data: {
     method: 'put',
     ...(options || {}),
   },
 });
}


export async function removeCommissionAmount(options?: { [key: string]: any }) {
  
  const { action_by, ...otherOptions } = options || {};

return request(`${API_URL}/admin/set_agents_commissions/destroy_bunch`, {
method: 'DELETE',
data:{
  method: 'delete',
  action_by: action_by,
  ...(otherOptions || {}),
}
});

}