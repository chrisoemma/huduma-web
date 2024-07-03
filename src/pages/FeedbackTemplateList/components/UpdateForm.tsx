import React, { useEffect, useState } from 'react';
import { Modal, Upload, Image, Form, Button, message } from 'antd';
import { ProFormText, ProFormCheckbox, ProFormRadio, ProFormSelect } from '@ant-design/pro-form';
import { InboxOutlined } from '@ant-design/icons';
import { FormattedMessage, useIntl, useModel } from '@umijs/max';
import { getPackages } from '@/pages/SubscriptionPackageList/SubscriptionPackageSlice';
import { updateFeedbackTemplate } from '../FeedbackTemplateSlice';


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



  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const action_by = currentUser?.id
  const [loading, setLoading] = useState(false);




  let templateActions = [
    {
      id: 'Cancelled',
      name: 'Cancel'
    },
    {
      id: 'Rejected',
      name: 'Reject'
    },
    {
      id: 'Completed',
      name: 'Complete'
    }
  ]


  let resources = [
    {
      id: 'Client',
      name: 'Client'
    },
    {
      id: 'Provider',
      name: 'Provider'
    },
    {
      id: 'Client & Provider',
      name: 'Client & Provider'
    },
    {
      id: 'Agent',
      name: 'Agent'
    },
    {
      id: 'Internal',
      name: 'Internal'
    },
    {
      id: 'Other',
      name: 'Other'
    },
  ]



  useEffect(() => {
    if (props.updateModalOpen) {

      form.setFieldsValue({
        status: props.values.status,
        action: props.values.action || '',
        reason: props.values.reason || '',
        resource: props.values.resource || ''
      })
    }
  }, [props.updateModalOpen, props.values, form]);







  const handleUpdate = async () => {

    try {
      setLoading(true);
      const values = await form.validateFields();

      values.updated_by = action_by;
      const feedbackTemplateId = props.values.id;


      const updatedValues = { ...values };

      const response = await updateFeedbackTemplate(feedbackTemplateId, updatedValues);

      if (response.status) {
        message.success(response.message);
        setLoading(false);
        form.resetFields();
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
          status: props.values.status,
          action: props.values.action || '',
          reason: props.values.reason || '',
          resource: props.values.resource || ''
        }}
      >

        <ProFormSelect
          name="action"
          width="md"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.package',
            defaultMessage: 'Subscription Package',
          })}
          valueEnum={templateActions.reduce((enumObj, action) => {
            enumObj[action.id] = action.name;
            return enumObj;
          }, {})}
          rules={[
            {
              required: true,
              message: 'Please select Action!',
            },
          ]}

        />

        <ProFormText
          rules={[
            {
              required: true,
              message: 'Reason is required',
            },
          ]}
          width="md"
          name="reason"
          label="Reason"
        />


        <ProFormSelect
          name="resource"
          width="md"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.userType',
            defaultMessage: 'User type',
          })}
          valueEnum={resources.reduce((enumObj, resource) => {
            enumObj[resource.id] = resource.name;
            return enumObj;
          }, {})}
          rules={[
            {
              required: true,
              message: 'Please select Resource!',
            },
          ]}

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
              value: 'In-Active',
              label: 'In-Active',
            },
          ]}

        />

      </Form>
    </Modal>
  );
};

export default UpdateForm;