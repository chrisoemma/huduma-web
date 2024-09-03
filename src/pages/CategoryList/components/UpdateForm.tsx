import React, { useEffect, useState } from 'react';
import { Modal, Upload, Image, Form, Button, message } from 'antd';
import { ProFormText, ProFormRadio } from '@ant-design/pro-form';
import { InboxOutlined } from '@ant-design/icons';
import { updateCategory } from '../CategorySlice';
import { FormattedMessage, useIntl, useModel } from '@umijs/max';

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
  const [imageUrl, setImageUrl] = useState<string | undefined>(props.values.images?.[0]?.img_url);
  const [file, setFile] = useState<File | null>(null); // To store the file object
  const { Dragger } = Upload;
  const [loading, setLoading] = useState(false);
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const action_by = currentUser?.id;
  
  useEffect(() => {
    if (props.updateModalOpen) {
      form.setFieldsValue({
        name_en: props.values.name?.en || '', 
        name_sw: props.values.name?.sw || '', 
        status: props.values.status,
      });
    }
  }, [props.updateModalOpen, props.values, form, imageUrl]);

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
    }
    return isImage;
  };

  const handleChange = async (info: any) => {
    if (info.file.status === 'done') {
      setFile(info.file.originFileObj); // Save the file for later use in form submission
    }
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      const formData = new FormData();
      formData.append('name_en', values.name_en);
      formData.append('name_sw', values.name_sw);
      formData.append('status', values.status);
      formData.append('updated_by', action_by);

      if (file) {
        formData.append('file', file);
      } else {
        const img_url = imageUrl || props.values.images?.[0]?.img_url;
        formData.append('img_url', img_url);
      }

      // formData.forEach((value, key) => {
      //   console.log(`${key}:`, value);
      // });
   

    const categoryId = props.values.id;
    console.log('categoryId',categoryId)
    const responce=  await updateCategory(categoryId,formData);
    //   console.log('responcedatatat',responce);
    //   return 
    // // Update this API call to handle FormData

      setLoading(false);
      setImageUrl(undefined);
      props.onCancel(true);
      message.success('Category updated successfully');
      props.onTableReload();
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
        id: 'pages.searchTable.updateForm.editCategory',
        defaultMessage: 'Edit Category',
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
          name_en: props.values.name?.en || '', 
          name_sw: props.values.name?.sw || '', 
          status: props.values.status,
        }}
      >
        <ProFormText
          name="name_en"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.docName',
            defaultMessage: 'English Name',
          })}
          width="md"
          rules={[
            {
              required: true,
              message: 'Please enter English Name!',
            },
          ]}
        />

        <ProFormText
          name="name_sw"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.name_sw',
            defaultMessage: 'Swahili Name',
          })}
          width="md"
          rules={[
            {
              required: true,
              message: 'Please enter the Kiswahili name!',
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

        <Form.Item
          name="image"
          label="Category Image"
          valuePropName="fileList"
          getValueFromEvent={(e) => {
            if (Array.isArray(e)) {
              return e;
            }
            return e && e.fileList;
          }}
          extra="Click or drag image to this area to upload"
        >
          <Dragger
            accept="image/*"
            beforeUpload={beforeUpload}
            onChange={handleChange}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag image to this area to upload</p>
          </Dragger>
        </Form.Item>

        <Form.Item label="Current Image">
          {props.values.images && <Image src={props.values.images?.[0]?.img_url} width={200} />}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateForm;
