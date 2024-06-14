import React, { useEffect, useState } from 'react';
import { Modal, Upload, Image, Form, Button, message } from 'antd';
import { ProFormText, ProFormCheckbox, ProFormRadio, ProFormSelect } from '@ant-design/pro-form';
import { InboxOutlined } from '@ant-design/icons';
import { FormattedMessage, useIntl, useModel } from '@umijs/max';
import { getPackages } from '@/pages/SubscriptionPackageList/SubscriptionPackageSlice';
import { updateCommissionAmount } from '../commissionAmountSlice';


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

  const [subPackages, setSubPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packageAmount, setPackageAmount] = useState(null)


  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const action_by = currentUser?.id
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (props.updateModalOpen) {
      const subPackage = subPackages.find((subpackage) => subpackage.id == props.values.package_id)?.name || '';
      const packageObject = subPackages.find((subpackage) => subpackage.id == props.values.package_id)
      setSelectedPackage(packageObject);
      setPackageAmount(packageObject ? packageObject.amount : null)

      form.setFieldsValue({
        payment_for: props.values.payment_for || '',
        user_type:props.values.user_type || '',
        duration: props.values.duration || '',
        amount: parseFloat(props.values.amount) || '',
      })
    }
  }, [props.updateModalOpen, props.values, form]);


  const handleUpdate = async () => {

    setLoading(true);
    try {
      const values = await form.validateFields();
      values.updated_by = action_by;
      const commissionId = props.values.id;
      values.payment_for = props.values.payment_for;
      values.user_type = props.values.user_type

      const updatedValues = { ...values };

      const response = await updateCommissionAmount(commissionId, updatedValues);

      if (response.status) {
        message.success(response.message);
        form.resetFields();
        setLoading(false);
        props.onCancel(true);
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
          payment_for: props.values.payment_for || '',
          user_type:props.values.user_type || '',
          duration: props.values.duration || '',
          amount: parseFloat(props.values.amount) || '',
        }}
      >

        <ProFormText
          rules={[
            {
              required: true,
              pattern: /^[0-9]+$/,
              message: 'Please enter a valid number',
            },

          ]}
          width="md"
          name="amount"
          label="Amount"

        />

        <ProFormSelect
          name="user_type"
          width="md"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.user_type',
            defaultMessage: 'User type',
          })}
          valueEnum={{
            'Client': 'Client',
            'Provider': 'Provider',
          }}
          rules={[
            {
              required: true,
              message: 'Please select User!',
            },
          ]}
        />



        <ProFormSelect
          name="payment_for"
          width="md"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.user_type',
            defaultMessage: 'Payment for',
          })}
          valueEnum={{
            'Registration': 'Registration',
            'Requests': 'Requests',
            'Subscription': 'Subscription',
          }}
          rules={[
            {
              required: true,
              message: 'Please select User!',
            },
          ]}
        />

      </Form>
    </Modal>
  );
};

export default UpdateForm;
