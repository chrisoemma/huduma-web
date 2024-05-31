import React, { useEffect, useState } from 'react';
import { Modal, Upload, Image, Form, Button, message } from 'antd';
import { ProFormText, ProFormCheckbox ,ProFormRadio} from '@ant-design/pro-form';
import { InboxOutlined } from '@ant-design/icons';
import { FormattedMessage, useIntl } from '@umijs/max';
import { updatePackage } from '../SubscriptionPackageSlice';

export type UpdateFormProps = {
  onCancel: (flag?: boolean, formVals?: FormValueType) => void;
  onSubmit: (values: FormValueType) => Promise<void>;
  updateModalOpen: boolean;
  values: Partial<APIDesignationListItem>;
  onTableReload: () => void;

};

const UpdateForm: React.FC<UpdateFormProps> = (props) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);



  useEffect(() => {
    if (props.updateModalOpen) {

      form.setFieldsValue({
        status:props.values.status,
        name: props.values.name || '',
        amount: parseFloat(props.values.amount) || '',
      })
    }
  }, [props.updateModalOpen, props.values, form]);





  const handleUpdate = async () => {
    
    try {
      const values = await form.validateFields();
      values.updated_by = 1;
      const packageId = props.values.id;
     
      setLoading(true);


      // Update the designation values with the selected documents
      const updatedValues = { ...values };

      const response = await updatePackage(packageId, updatedValues);

      if (response.status) {
        setLoading(false);
    
        form.resetFields();
        props.onCancel(true);
        setLoading(false);
        props.onTableReload();
      } else {
        setLoading(false);
        message.error(response.message);
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
        id: 'pages.searchTable.updateForm.editPackage',
        defaultMessage: 'Edit Subscription Package',
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
        <Button key="submit" type="primary" 
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
          status:props.values.status,
          name: props.values.name || '',
          amount: parseFloat(props.values.amount) || '',
        }}
      >

        <ProFormText
          rules={[
            {
              required: true,
              message: 'Package Name is required',
            },
          ]}
          width="md"
          name="name"
          label="Package name"
        />

        <ProFormText
          rules={[
            {
              pattern: /^[0-9]+$/,
              message: 'Please enter a valid number',
            },
          ]}
          width="md"
          name="amount"
          label="Amount"
        />


        <ProFormRadio.Group
          name="status"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.ruleProps.typeLabelStatus',
            defaultMessage: 'Status',
          })}
          options={[
            {
              value: 'Active',
              label: 'Active',
            },
         
        
            {
              value: 'In-active',
              label: 'In-Active',
            },
          ]}

        />


      </Form>
    </Modal>
  );
};

export default UpdateForm;
