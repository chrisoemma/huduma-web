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
        if(response.temporary_password){
          return response
        }else{
          return {
            status: response.status,
            token: response.token,
            userData: response.user,
          };
        }
  }else{
      return response
  }

  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
  }


  export async function outLogin(options?: { [key: string]: any }) {
    return request(`${API_URL}/auth/logOut`, {
      method: 'POST',
      ...(options || {}),
    });
  }


  export async function verifyAccount(options?: { [key: string]: any }) {
    return request(`${API_URL}/auth/verify_internal_user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data:{
        method: 'post',
        ...(options || {}),
      }
    });
  }


  export async function   requestNewToken(options?: { [key: string]: any }) {
    return request(`${API_URL}/api/auth/logOut`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data:{
        method: 'post',
        ...(options || {}),
      }
    });
  }


  export async function createNewPassword(options?: { [key: string]: any }) {
    return request(`${API_URL}/auth/set_account_password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: options,
    });
  }


  export async function setUserTemporary(options?: { [key: string]: any }) {
    return request(`${API_URL}/auth/set_temporary_password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: options,
    });
  }

  
  
