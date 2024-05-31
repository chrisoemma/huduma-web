import React, { useEffect, useState } from 'react';
import { Modal, Upload, Image, Form, Button, message } from 'antd';
import { ProFormText, ProFormRadio,ProFormSelect } from '@ant-design/pro-form';
import { InboxOutlined } from '@ant-design/icons';
import { FormattedMessage, useIntl } from '@umijs/max';
import { updateRegistrationDoc } from '../RegistrationDocSlice';


export type UpdateFormProps = {
  onCancel: (flag?: boolean, formVals?: FormValueType) => void;
  onSubmit: (values: FormValueType) => Promise<void>;
  updateModalOpen: boolean;
  values: Partial<API.CategoryListItem>;
  onTableReload: () => void;
};

const UpdateForm: React.FC<UpdateFormProps> = (props) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);


  useEffect(() => {

    if (props.updateModalOpen) {
      form.setFieldsValue({
        doc_name: props.values.doc_name,
        type: props.values.type,
      });

    }
  }, [props.updateModalOpen, props.values, form]);

  const handleUpdate = async () => {

    try {
      setLoading(true);
      const values = await form.validateFields();
      values.updated_by=1;
      const docId = props.values.id;
      

      const response = await updateRegistrationDoc(docId, { ...values });
  
      if (response.status) {
        message.success(response.message)
        form.resetFields();
        props.onCancel(true);
        setLoading(false);
        props.onTableReload();
      } else {
        setLoading(false);
        message.error(response.message)
      }
    } catch (error) {
      setLoading(false);
      console.log('Update failed:', error);
    }
  };

  return (
    <Modal
      width={640}
      bodyStyle={{ padding: '32px 40px 48px' }}
      destroyOnClose
      title={intl.formatMessage({
        id: 'pages.searchTable.updateForm.editDocument',
        defaultMessage: 'Edit Document',
      })}
      visible={props.updateModalOpen}
      footer={[
        <Button
          key="cancel"
          onClick={() => {
            props.onCancel();
          }}
        >
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleUpdate}
          disabled={loading} 
        >
          Update
        </Button>,
      ]}
      onCancel={() => {
        props.onCancel();
        form.resetFields();
      }}
    >
      <Form
        form={form}
        initialValues={{
          doc_name: props.values.doc_name,
          type: props.values.type,
        }}
      >
        <ProFormText
          name="doc_name"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.docName',
            defaultMessage: 'Document',
          })}
          width="md"
          rules={[

            {
              required: true,
              message: 'Please enter the Document name!',
            },
          ]}
        />

           <ProFormSelect
                        name="type"
                        width="md"
                        label={intl.formatMessage({
                            id: 'pages.searchTable.updateForm.type',
                            defaultMessage: 'Choose document Type',
                        })}
                        valueEnum={{
                            'Registration': 'Registration',
                            'Bussiness': 'Business',
                        }}
                        rules={[
                            {
                                required: true,
                                message: 'Please select doc type!',
                            },
                        ]}
                    />
      </Form>
    </Modal>
  );
};

export default UpdateForm;
