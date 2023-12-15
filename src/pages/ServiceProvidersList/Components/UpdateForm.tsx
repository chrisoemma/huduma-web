// import {
import React, { useEffect, useState, useRef } from 'react';
import { Modal, Upload, Image, Form, Button, message, } from 'antd';
import { ProFormText, StepsForm, ProFormSelect, ProFormRadio } from '@ant-design/pro-form';
import { InboxOutlined } from '@ant-design/icons';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { FormattedMessage, useIntl } from '@umijs/max';
import { storage } from '@/firebase/firebase';
import { updateProvider } from '../ServiceProviderSlice';
import { formatErrorMessages, showErrorWithLineBreaks, validateTanzanianPhoneNumber } from '@/utils/function';
import { history } from 'umi';

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
  const [workingDocumentPercentage, setWorkingDocumentPercentage] = useState<number>(0);


  
  useEffect(() => {
    if (props.updateModalOpen) {
      // console.log('props.value', props.values);
      form.setFieldsValue({
        first_name: props.values.first_name,
        last_name: props.values.last_name,
        status: props.values.user?.status == 'Active' ? 'Active' : 'In Active',
        nida: props.values.nida,
        email: props.values.user?.email,
        phone: props.values.phone
      });

    }
  }, [props.updateModalOpen, props.values, form]);

  useEffect(() => {
    if (props.values.documents && props.values.documents.length > 0) {
      const percentage = calculateWorkingDocumentPercentage(props.values.documents);
      setWorkingDocumentPercentage(percentage);
    }
  }, [props.values.documents]);


  const calculateWorkingDocumentPercentage = (documents) => {
    if (!documents || documents.length === 0) {
        return 0; // Return 0 when there are no working documents
    }

    const workingDocumentMap = new Map();

    documents.forEach((document) => {
        if (document.working_document_id && document.percentage) {
            const workingDocumentId = document.working_document_id;

            if (!workingDocumentMap.has(workingDocumentId)) {
                // If working document ID is not in the map, add it with an array of percentages
                workingDocumentMap.set(workingDocumentId, [parseFloat(document.percentage)]);
            } else {
                // If working document ID is in the map, append the percentage to the array
                const currentPercentages = workingDocumentMap.get(workingDocumentId);
                currentPercentages.push(parseFloat(document.percentage));
                workingDocumentMap.set(workingDocumentId, currentPercentages);
            }
        }
    });

    // Calculate the total percentage by averaging all unique working documents
    let totalPercentage = 0;

    workingDocumentMap.forEach((percentages) => {
        const averagePercentage = calculateAverage(percentages);
        totalPercentage += averagePercentage;
    });

    return totalPercentage;
};

// Helper function to calculate the average of an array of numbers
const calculateAverage = (arr) => {
    if (arr.length === 0) {
        return 0;
    }
    const sum = arr.reduce((acc, val) => acc + val, 0);
    return sum / arr.length;
};

  
  
  

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

  const handleViewDocs = () => {
    // Assuming you have a route named '/documents/:providerId'
    const route = `/documents/provider/${props.values.id}`;
    // Redirect to the documents route
    history.push(route);
  };

  const handleUpdate = async (values) => {

    try {

      const providerId = props.values.id;
      const profile_img = imageUrl || props.values.user?.profile_img;
      values.profile_img = profile_img;

      values.phone = validateTanzanianPhoneNumber(values.phone);

      const response = await updateProvider(providerId, { ...values, profile_img });
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
          first_name: props.values.first_name,
          last_name: props.values.last_name,
          status: props.values.user?.status === 'Active' ? 'Active' : 'In Active',
          nida: props.values.nida,
          email: props.values.user?.email,
          phone: props.values.phone
        }}
        title={intl.formatMessage({
          id: 'pages.searchTable.updateForm.providerInfo',
          defaultMessage: 'Provider Info',
        })}
      >

        <ProFormText
          name="first_name"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.firstName',
            defaultMessage: 'First Name',
          })}
          width="md"
          rules={[
            {
              required: true,
              message: 'Please enter the first name!',
            },
          ]}
        />
        <ProFormText
          name="last_name"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.lastName',
            defaultMessage: 'Last Name',
          })}
          width="md"
          rules={[
            {
              required: true,
              message: 'Please enter the last name!',
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
              required: true,
              message: 'Please enter the Email!',
            },
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
      
      {workingDocumentPercentage !== null && (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <label>Working Document Percentage: {workingDocumentPercentage.toFixed(2)}%</label>
      {workingDocumentPercentage === 0 ? (
        <p style={{ color: 'red' }}>No Approved documents</p>
      ) : workingDocumentPercentage < 70 ? (
        <p style={{ color: 'red' }}>Total percentage is below 70%</p>
      ) : (
        <p style={{ color: 'green' }}>Total percentage is above 70%</p>
      )}
    </div>
    <Button type="primary" onClick={handleViewDocs}>
      View Docs
    </Button>
  </div>
)}
   
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
          disabled={workingDocumentPercentage !== null && workingDocumentPercentage < 70}
          
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
