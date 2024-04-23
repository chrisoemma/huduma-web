import React, { useEffect, useState } from 'react';
import { Modal, Upload, Image, Form, Button, message } from 'antd';
import { ProFormText, ProFormRadio } from '@ant-design/pro-form';
import { InboxOutlined } from '@ant-design/icons';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { updateCategory } from '../CategorySlice';
import { FormattedMessage, useIntl } from '@umijs/max';
import { storage } from '@/firebase/firebase';

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

  const { Dragger } = Upload;

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

  const handleUpload = async (file: File) => {
    const storageRef = ref(storage, `images/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise<string | undefined>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Handle upload progress if needed
        },
        (error) => {
          // Handle unsuccessful upload
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            console.error('Error getting download URL:', error);
            reject(error);
          }
        }
      );
    });
  };

  const handleChange = async (info: any) => {
    if (info.file.status === 'done') {
      const downloadURL = await handleUpload(info.file.originFileObj);
      setImageUrl(downloadURL);
    }
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();

     
      const categoryId = props.values.id;


      const img_url = imageUrl || props.values.images?.[0]?.img_url;
  
      await updateCategory(categoryId, { ...values, img_url });

      form.resetFields();
      setImageUrl(undefined);
      props.onCancel(true);
      message.success('Category updated successfully');
      props.onTableReload();
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
              value: '1',
              label: 'Active',
            },
            {
              value: '2',
              label: 'Inactive',
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
