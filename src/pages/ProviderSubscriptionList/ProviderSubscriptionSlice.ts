import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

export async function getProvidersSubscriptions(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/subscriptions/active_provider_subscriptions`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }

  
export async function getExpiredSubscriptions(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/subscriptions/expired_provider_subscriptions`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }

  export async function upgradePackage(options?: { [key: string]: any }) {

    return request(`${API_URL}/discounts`, {
      method: 'POST',
      data:{
        method: 'post',
        ...(options || {}),
      }
    });
  }



  export async function getAllPackages(
    params: {
      current?: number;
      pageSize?: number;
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/packages/all`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }


  export async function updateDiscount(DiscountId: number, options?: { [key: string]: any }) {
 return request(`${API_URL}/discounts/${DiscountId}`, {
   method: 'PUT',
   data: {
     method: 'put',
     ...(options || {}),
   },
 });
}


export async function removeDiscount(options?: { [key: string]: any }) {
  
  const { action_by, ...otherOptions } = options || {};

return request(`${API_URL}/admin/discounts/destroy_bunch`, {
method: 'DELETE',
data:{
  method: 'delete',
  action_by: action_by,
  ...(otherOptions || {}),
}
});

}