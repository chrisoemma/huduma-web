// import {
import React, { useEffect, useState, useRef } from 'react';
import { Modal, Upload, Image, Form, Button, message, } from 'antd';
import {
  ProFormCheckbox,
} from '@ant-design/pro-components';
import { ProFormText, StepsForm, ProFormSelect, ProFormRadio } from '@ant-design/pro-form';
import { InboxOutlined } from '@ant-design/icons';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { FormattedMessage, useIntl } from '@umijs/max';
import { formatErrorMessages, showErrorWithLineBreaks } from '@/utils/function';
import { updateRole } from '../RoleSlice';
import { getPermissions } from '@/pages/PermissionsList/PermissionSlice';


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
  const [permissions, setPermissions] = useState([]);

  const stepsFormRef = useRef();

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getPermissions();
        const permissions = response.data.permissions;
        setPermissions(permissions);
        actionRef.current?.reloadAndRest(); // Reload and reset the table state
      } catch (error) {
        console.error('Error fetching permissions data:', error);
      }
    }

    fetchData();
  }, []);


  useEffect(() => {
    if (props.updateModalOpen) {
      form.setFieldsValue({
        name: props.values.name,
        ...getInitialCheckboxValues(props.values.permissions),
      });

    }
  }, [props.updateModalOpen, props.values, form]);


  const getInitialCheckboxValues = (selectedPermissions) => {
    const initialCheckboxValues = {};

    Object.entries(permissionsByCategory).forEach(([category, categoryPermissions]) => {
      const selectedCategoryPermissions = selectedPermissions.filter(
        (permission) => categoryPermissions.some((p) => p.value === permission.id)
      );

      if (selectedCategoryPermissions.length > 0) {
        initialCheckboxValues[`permissions_${category}`] = selectedCategoryPermissions.map(
          (p) => p.id
        );
      }
    });

    return initialCheckboxValues;
  };



  const permissionsByCategory = permissions.reduce((acc, permission) => {
    const { category, name, id } = permission;

    if (!acc[category]) {
      acc[category] = [];
    }

    acc[category].push({
      label: name,
      value: id,
    });

    return acc;
  }, {});

  const groupedOptions = Object.entries(permissionsByCategory).map(([category, permissions]) => (
    <div key={category}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{category}</div>
      <ProFormCheckbox.Group
        name={`permissions_${category}`}
        options={permissions.map(permission => ({
          label: permission.label,
          value: permission.value,
        }))}
      />
    </div>
  ));



  const handleUpdate = async () => {

    try {

      const roleId = props.values.id;

      const values = await form.validateFields();

      const permissions = Object.entries(permissionsByCategory).reduce((acc, [category, _]) => {
        const categoryPermissions = form.getFieldValue(`permissions_${category}`);
        return [...acc, ...categoryPermissions];
      }, []);
  
      // Update the values with the extracted permissions
      const updatedValues = { ...values, permissions };

      //  console.log('updatedd values',updatedValues)

      //  return 
  
      const response = await updateRole(roleId, updatedValues);
      if (response.status) {
        form.resetFields();
        props.onCancel(true);
        message.success(response.message);
        props.onTableReload();
        stepsFormRef.current?.submit();
      } else {
        if (response.data) {
          const errors = response.data.errors;
          showErrorWithLineBreaks(formatErrorMessages(errors));
        } else {
          message.error(response.message);
        }
      }

    } catch (error) {
      console.log('Update failed:', error);
    }
  };


  return (
    <Modal
      width={640}
      bodyStyle={{ padding: '32px 40px 48px' }}
      destroyOnClose
      title={intl.formatMessage({
        id: 'pages.searchTable.updateForm.editRole',
        defaultMessage: 'Edit Role',
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
          name: props.values.name,
          permissions: props.values.permissions
        }}
      >
        <ProFormText
          name="name"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.roleName',
            defaultMessage: 'Role Name',
          })}
          width="md"
          rules={[
            {
              required: true,
              message: 'Please enter the  name!',
            },
          ]}
        />


        {groupedOptions}
      </Form>
    </Modal>
  );

};

export default UpdateForm;
