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



