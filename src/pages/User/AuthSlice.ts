import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

export async function login(options?: { [key: string]: any }) {
    try{
    const response=  await request(`${API_URL}/auth/web_login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data:{
        method: 'post',
        ...(options || {}),
      }
    });

      if(response.status){
    return {
      status: response.status,
      token: response.token,
      userData: response.user,
    };

  }else{
      return response
  }

  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
  }


  export async function outLogin(options?: { [key: string]: any }) {
    return request(`${API_URL}/api/auth/logOut`, {
      method: 'POST',
      ...(options || {}),
    });
  }