import React, { useEffect, useState } from 'react';
import { Modal, Upload, Image, Form, Button, message, } from 'antd';
import { ProFormText, ProFormRadio } from '@ant-design/pro-form';
import { InboxOutlined } from '@ant-design/icons';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { FormattedMessage, useIntl } from '@umijs/max';
import { storage } from '@/firebase/firebase';
import {
  ProFormDateTimePicker,
  ProFormTextArea,

} from '@ant-design/pro-components';
import { updateBanner } from '../BannerSlice';
import moment from 'moment';

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
  const [imageUrl, setImageUrl] = useState<string | undefined>(props.values.url);
  const [file, setFile] = useState<File | null>(null);

  const { Dragger } = Upload;
  const [loading, setLoading] = useState(false);

  useEffect(() => {

    if (props.updateModalOpen) {
      form.setFieldsValue({
        description: props.values.description,
        status: props.values.status,
        start_date: props.values.start_date,
        end_date: props.values.end_date,
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
    const storageRef = ref(storage, `banners/${file.name}`);
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
      setFile(info.file.originFileObj); // Save the file for later use in form submission
    }
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const bannerId = props.values.id;

      const formData = new FormData();
      Object.keys(values).forEach(key => {
        formData.append(key, values[key]);
      });

      if (file) {
        formData.append('url', file);
      }else{
        formData.append('url',imageUrl || props.values.url);
      }

     const results= await updateBanner(bannerId, formData);
  

      form.resetFields();
      setImageUrl(undefined);
      props.onCancel(true);
      setLoading(false);
      message.success('Banner updated successfully');
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
          decription: props.values.decription,
          status: props.values.status,
          start_date: props.values.start_date,
          end_date: props.values.end_date,
        }}
      >
        <ProFormTextArea
          name="description"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.ruleName.Description',
            defaultMessage: 'Description',
          })}
          width="md"

        />

        <ProFormDateTimePicker
          rules={[
            {
              required: true,
              message: 'Start Date is required',
            },
          ]}
          width="md"
          name="start_date"
          label="Start Date"

        />



        <ProFormDateTimePicker
          rules={[
            {
              required: true,
              message: 'End Date is required',
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const startDate = getFieldValue('start_date');
                if (startDate && value && moment(value).isBefore(startDate)) {
                  return Promise.reject('End Date must be equal or after Start Date');
                }
                return Promise.resolve();
              },
            }),
          ]}
          width="md"
          name="end_date"
          label="End Date"

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
              value: 'In Active',
              label: 'In active',
            },
          ]}
        />

        <Form.Item
          name="image"
          label="Banner Image"
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
          {props.values?.url && <Image src={props.values?.url} width={200} />}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateForm;
