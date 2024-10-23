import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';
import axios from 'axios';

export async function getTermsOfService(
  params: {
    current?: number;
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request(`${API_URL}/terms-links`, {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}



export async function addTermOfService(formData) {
  return axios.post(`${API_URL}/terms-links`, formData);
}

export async function removeTermsOfService(options?: { [key: string]: any }) {
  const { deleted_by, ...otherOptions } = options || {};
  return request(`${API_URL}/terms/destroy_bunch`, {
    method: 'DELETE',
    data: {
      method: 'delete',
      deleted_by: deleted_by,
      ...(otherOptions || {}),
    },
  });
}



export async function updateTermOfService(termId, formData) {
  try {
    return  axios.post(`${API_URL}/terms-links/update/${termId}`,formData);
  } catch (error) {
    console.error('Error updating bannerId', error);
    throw error;
  }
}


