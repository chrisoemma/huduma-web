import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

export async function getActiveCommisions(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/admin/commisions/outstanding_payments`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }

  export async function getPreviousCommisions(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/admin/commisions/completed_payments`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }

  export async function AddPayment(commisionId: number, paymentData: { amount: string; action_by: number; agent_id: number }) {
    return request(`${API_URL}/admin/commisions/payment/${commisionId}`, {
      method: 'POST',
      data: paymentData,
    });
  }

  export async function PayByExcel(options?: { [key: string]: any }) {
    return request(`${API_URL}/admin/commisions/payment_by_excel`, {
      method: 'POST',
      data: {
        excelData: options?.excelData,
      },
    });
  }





