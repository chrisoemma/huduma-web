import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';

export async function getFeedbackTemplates(
    params: {
      current?: number;
      pageSize?: number;
      
    },
    options?: { [key: string]: any },
  ) {
    return request(`${API_URL}/feedback_templates`, {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    });
  }

  export async function addFeedbackTemplate(options?: { [key: string]: any }) {

    return request(`${API_URL}/feedback_templates`, {
      method: 'POST',
      data:{
        method: 'post',
        ...(options || {}),
      }
    });
  }


  export async function updateFeedbackTemplate(feedbackTemplateId: number, options?: { [key: string]: any }) {
 return request(`${API_URL}/feedback_templates/${feedbackTemplateId}`, {
   method: 'PUT',
   data: {
     method: 'put',
     ...(options || {}),
   },
 });
}


export async function removeFeedbackTemplate(options?: { [key: string]: any }) {
  
  const {deleted_by, ...otherOptions } = options || {};

return request(`${API_URL}/admin/feedback_templates/destroy_bunch`, {
method: 'DELETE',
data:{
  method: 'delete',
  deleted_by:deleted_by,
  ...(otherOptions || {}),
}
});

}