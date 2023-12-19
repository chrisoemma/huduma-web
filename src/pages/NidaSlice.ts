import { request } from '@umijs/max';


export async function getNida(nidaNumber: number) {
   
  return request(`https://esms.espeservice.com/api2/${nidaNumber}`, {
    method: 'POST',
    data: {
      method: 'post',
    },
  });
}



