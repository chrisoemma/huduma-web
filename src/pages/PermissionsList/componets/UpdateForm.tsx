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

    import { getPermissionCategories, getPermissions, updatePermission } from '@/pages/PermissionsList/PermissionSlice';
    
    
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
      const [categories, setCategories] = useState([]);
    
      const stepsFormRef = useRef();
    
      useEffect(() => {
        async function fetchData() {
          try {
            const response = await getPermissionCategories();
            const categories = response.data.categories;
            setCategories(categories);
            actionRef.current?.reloadAndRest(); // Reload and reset the table state
          } catch (error) {
            console.error('Error fetching categories data:', error);
          }
        }
    
        fetchData();
      }, []);
    
    
      useEffect(() => {
        if (props.updateModalOpen) {
          form.setFieldsValue({
            name: props.values.name,
            category: props.values.category,
          });
    
        }
      }, [props.updateModalOpen, props.values, form]);
    
    
    
    
      const handleUpdate = async () => {
        try {
          const roleId = props.values.id;
      
          // Validate the form fields
          const values = await form.validateFields();
      
          // Check if the category is an array
          if (Array.isArray(values.category)) {
            // Convert the array to a string without brackets and quotes
            values.category = values.category.join(', ');
          }
      
          // Update the category value in the form
          form.setFieldsValue({
            ...values,
            category: values.category,
          });
      
          // Call the updatePermission function with the updated values
          const response = await updatePermission(roleId, { ...values });
      
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
            id: 'pages.searchTable.updateForm.editCategory',
            defaultMessage: 'Edit Permission',
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
              category: props.values.category
            }}
          >
            <ProFormText
              name="name"
              label={intl.formatMessage({
                id: 'pages.searchTable.updateForm.permissionName',
                defaultMessage: 'Permission Name',
              })}
              width="md"
              rules={[
                {
                  required: true,
                  message: 'Please enter the  name!',
                },
              ]}
            />

    <ProFormSelect
       name="category"
       width="md"
       label={intl.formatMessage({
         id: 'pages.searchTable.updateForm.category',
         defaultMessage: 'Group',
       })}
       valueEnum={categories.reduce((enumObj, category) => {
         enumObj[category] = category;
         return enumObj;
       }, {})}
       mode="tags"
       maxTagCount={1}
       showSearch
       showArrow
       rules={[
         {
           required: true,
           message: 'Please select the group!',
         },
       ]}
     />
    
          </Form>
        </Modal>
      );
    
    };
    
    export default UpdateForm;
    