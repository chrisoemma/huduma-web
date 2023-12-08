// import {
import React, { useEffect, useState, useRef } from 'react';
import { Modal, Upload, Image, Form, Button, message, } from 'antd';
import { ProFormText, StepsForm, ProFormSelect, ProFormRadio } from '@ant-design/pro-form';
import { InboxOutlined } from '@ant-design/icons';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { FormattedMessage, useIntl } from '@umijs/max';
import { storage } from '@/firebase/firebase';
import { updateEmployee } from '../EmployeeSlice';
import { formatErrorMessages, showErrorWithLineBreaks, validateTanzanianPhoneNumber } from '@/utils/function';


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
  const [imageUrl, setImageUrl] = useState<string | undefined>(props.values.user?.profile_img);

  const stepsFormRef = useRef();

  useEffect(() => {

    if (props.updateModalOpen) {
      form.setFieldsValue({
        name: props.values.name,
        status: props.values.user?.status == 'Active' ? 'Active' : 'In Active',
        nida: props.values.nida,
        email: props.values.user?.email,
        phone: props.values.phone
      });

    }
  }, [props.updateModalOpen, props.values, form]);

  const { Dragger } = Upload;

  const beforeUpload = (file: File) => {

    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
    }
    return isImage;
  };

  const handleUpload = async (file: File) => {

    const storageRef = ref(storage, `profile/${file.name}`);
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

  const handleUpdate = async (values) => {

    try {

      const employeeId = props.values.id;
      const profile_img = imageUrl || props.values.user?.profile_img;
      values.phone = validateTanzanianPhoneNumber(values.phone);
      values.profile_img = profile_img;

      const response = await updateEmployee(employeeId, { ...values, profile_img });
      if (response.status) {
        setImageUrl(undefined);
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
    <StepsForm
      onFinish={async (values) => {
        await handleUpdate(values);
        await props.onSubmit(values);
      }}
      stepsProps={{
        size: 'small',
      }}
      stepsFormRender={(dom, submitter) => (
        <Modal
          width={640}
          bodyStyle={{ padding: '32px 40px 48px' }}
          destroyOnClose
          title={intl.formatMessage({

            id: 'pages.searchTable.updateForm.editprovider',
            defaultMessage: 'Edit Provider',
          })}

          open={props.updateModalOpen}
          footer={submitter}
          onCancel={() => {
            props.onCancel();
          }}
        >
          {dom}
        </Modal>
      )}
    >

      <StepsForm.StepForm
        initialValues={{
          name: props.values.name,
          status: props.values.user?.status === 'Active' ? 'Active' : 'In Active',
          nida: props.values.nida,
          email: props.values.user?.email,
          phone: props.values.user?.phone
        }}
        title={intl.formatMessage({
          id: 'pages.searchTable.updateForm.providerInfo',
          defaultMessage: 'Provider Info',
        })}
      >

        <ProFormText
          name="name"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.name',
            defaultMessage: 'Name',
          })}
          width="md"
          rules={[
            {
              required: true,
              message: 'Please enter the name!',
            },
          ]}
        />

        <ProFormText
          rules={[
            {
              required: true,
              message: 'Phone number is required',
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const phoneNumber = value.replace(/\D/g, ''); // Remove non-numeric characters
                const validCountryCodes = ['255', '254', '256', '250', '257']; // Add more as needed

                // Check if the phone number has a valid length and starts with either a leading zero or a valid country code
                const isValid = validCountryCodes.some(code => {
                  const countryCodeLength = code.length;
                  return (
                    (phoneNumber.length === 10 && phoneNumber.startsWith('0')) ||
                    (phoneNumber.length === 12 && phoneNumber.startsWith(code))
                  );
                });

                if (!isValid) {
                  return Promise.reject('Invalid phone number format');
                }

                return Promise.resolve();
              },
            }),
          ]}
          width="md"
          name="phone"
          label="Phone"
        />

        <ProFormText
          name="email"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.email',
            defaultMessage: 'Email',
          })}
          width="md"
          rules={[
            {
              type: 'email',
              message: 'Please enter a valid email address!',
            },
          ]}
        />

      </StepsForm.StepForm>

      {/* Step 2 */}
      <StepsForm.StepForm

        initialValues={{
          status: props.values.user?.status === 'Active' ? 'Active' : 'In Active',
          nida: props.values.nida,
        }}
        title={intl.formatMessage({
          id: 'pages.searchTable.updateForm.step2',
          defaultMessage: 'Other Info',
        })}
      >

        <ProFormText
          rules={[

            ({ getFieldValue }) => ({
              validator(_, value) {
                const nida = value.replace(/\D/g, '');
                const isLengthValid = nida.length === 20;

                if (!isLengthValid) {
                  return Promise.reject('NIDA must be 20 numbers');
                }

                return Promise.resolve();
              },
            }),
          ]}
          width="md"
          name="nida"
          label="NIDA"
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
          label="Image"
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
          {props.values.user?.profile_img && <Image src={props.values.user?.profile_img} width={200} />}
        </Form.Item>

      </StepsForm.StepForm>

    </StepsForm>
  );

};

export default UpdateForm;
