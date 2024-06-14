import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

export async function getDiscounts(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/discounts`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }

  export async function addDiscount(options?: { [key: string]: any }) {

    return request(`${API_URL}/discounts`, {
      method: 'POST',
      data:{
        method: 'post',
        ...(options || {}),
      }
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
  
  const { action_by,deleted_by, ...otherOptions } = options || {};

return request(`${API_URL}/admin/discounts/destroy_bunch`, {
method: 'DELETE',
data:{
  method: 'delete',
  action_by: action_by,
  deleted_by:deleted_by,
  ...(otherOptions || {}),
}
});

}