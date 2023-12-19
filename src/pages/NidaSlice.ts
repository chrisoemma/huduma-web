import { request } from '@umijs/max';


export async function getNida(nidaNumber: number) {
  try {
    const response = await request(`https://esms.espeservice.com/api2/${nidaNumber}`, {
      method: 'POST',
      data: {
        method: 'post',
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return { error: 'Failed to fetch data' };
  }

}



