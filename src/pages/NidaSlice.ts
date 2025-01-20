import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';


export async function getNida(nidaNumber: number) {
   
  return request(`https://esms.espeservice.com/api2/${nidaNumber}`, {
    method: 'POST',
    data: {
      method: 'post',
    },
  });
}


export async function validateNida(id: number, options?: { [key: string]: any }) {
   
  return request(`${API_URL}/admin/validate_nida/${id}`, {
    method: 'PUT',
    data: {
      method: 'put',
      ...(options || {}),
    },
  });
}


export async function request_nida_from_api(options?: { [key: string]: any }) {
   
  return request(`${API_URL}/admin/request_nida_from_api`, {
    method: 'POST',
    data: {
      method: 'POST',
      ...(options || {}),
    },
  });
}



