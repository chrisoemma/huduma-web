import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

  export async function getProviderEmployees(providerId: number,
    params: {
        current?: number;
        pageSize?: number;
      },
    options?: { [key: string]: any }) {

    return request(`${API_URL}/employees/provider_employees/${providerId}`, {
        method: 'GET',
        params: {
          ...params,
        },
        ...(options || {}),
      });
  }

  export async function addEmployee(providerId:number,options?: { [key: string]: any }) {
    return request(`${API_URL}/employees/store_employee/${providerId}`, {
      method: 'POST',
      data:{
        method: 'post',
        ...(options || {}),
      }
    });
  }