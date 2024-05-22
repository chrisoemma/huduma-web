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

  export async function getAllEmployees(
    params: {
        current?: number;
        pageSize?: number;
      },
    options?: { [key: string]: any }) {

    return request(`${API_URL}/employees`, {
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


  export async function removeEmployee(options?: { [key: string]: any }) {
  
    return request(`${API_URL}/employees/destroy_bunch`, {
      method: 'DELETE',
      data:{
        method: 'delete',
        ...(options || {}),
      }
    });
    }
    
  
    export async function updateEmployee(employeeId: number, options?: { [key: string]: any }) {
    
      return request(`${API_URL}/employees/update_employee_web/${employeeId}`, {
        method: 'PUT',
        data: {
          method: 'put',
          ...(options || {}),
        },
      });
    }

