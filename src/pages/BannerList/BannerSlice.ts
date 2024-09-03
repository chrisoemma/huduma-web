import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';
import axios from 'axios';

// Get all banners
export async function getBanners(
  params: {
    current?: number;
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request(`${API_URL}/banners`, {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

// // Create a new banner
// export async function addBanner(options?: { [key: string]: any }) {
//   return request(`${API_URL}/banners/create`, {
//     method: 'POST',
//     data: {
//       method: 'post',
//       ...(options || {}),
//     },
//   });
// }

export async function addBanner(formData) {
  return axios.post(`${API_URL}/banners/create`, formData);
}

// Remove multiple banners
export async function removeBanners(options?: { [key: string]: any }) {
  return request(`${API_URL}/banners/destroy_bunch`, {
    method: 'DELETE',
    data: {
      method: 'delete',
      ...(options || {}),
    },
  });
}

// Update a banner by ID
// export async function updateBanner(bannerId: number, options?: { [key: string]: any }) {
//   return request(`${API_URL}/banners/update/${bannerId}`, {
//     method: 'PUT',
//     data: {
//       method: 'put',
//       ...(options || {}),
//     },
//   });
// }

export async function updateBanner(bannerId, formData) {
  try {
    return  axios.post(`${API_URL}/banners/update/${bannerId}`,formData);
  } catch (error) {
    console.error('Error updating bannerId', error);
    throw error;
  }
}

// Get displayed banners
export async function getDisplayedBanners(options?: { [key: string]: any }) {
  return request(`${API_URL}/banners/displayed`, {
    method: 'GET',
    ...(options || {}),
  });
}
