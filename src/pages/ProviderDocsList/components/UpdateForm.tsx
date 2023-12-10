import React, { useEffect, useState, useRef } from 'react';
import { Modal, Upload, Image, Form, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ProFormText, ProFormSelect, ProFormTextArea, StepsForm } from '@ant-design/pro-form';
import { useIntl, useParams } from '@umijs/max';
import { storage } from '@/firebase/firebase';
import { getProviderBusiness } from '../ProviderDocsSlice';
import { getRegistrationDoc } from '@/pages/RegistrationDocList/RegistrationDocSlice';
//import { updateProvider } from '../ProviderSlice';

export type ProviderUpdateFormProps = {
  onCancel: (flag?: boolean, formVals?: FormValueType) => void;
  onSubmit: (values: FormValueType) => Promise<void>;
  updateModalOpen: boolean;
  values: Partial<API.ProviderListItem>;
  onTableReload: () => void;
};

const ProviderUpdateForm: React.FC<ProviderUpdateFormProps> = (props) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string | undefined>(props.values.images?.[0]?.img_url);
  const [regDocs, setRegDocs] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const { id } = useParams();


  const [formData, setFormData] = useState({
    name: '',
    doc_type: 'registration', // Default document type
    doc_name: '', // Registration Doc field
    business: '', // Business field
    // ... (other form fields)
  });


  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getRegistrationDoc();
        const regDocs = response.data.docs;
        setRegDocs(regDocs);
        actionRef.current?.reloadAndRest();
      } catch (error) {
        console.error('Error fetching Reg docs data:', error);
      }
    }
    fetchData();
  }, []);


  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getProviderBusiness(id);
        const businesses = response.data.businesses;
        setBusinesses(businesses);
        actionRef.current?.reloadAndRest();
      } catch (error) {
        console.error('Error fetching Businesses data:', error);
      }
    }
    fetchData();
  }, []);



  useEffect(() => {
    if (props.updateModalOpen) {
      // Set initial form values when the modal opens

      console.log('props value1234', props.values);

      form.setFieldsValue({
        name: props.values.doc_format,
        doc_type: props.values.doc_type,
        working_document_id: regDocs.find((doc) => doc.id === props.values.working_document_id)?.doc_name,
        business: businesses.find((bus) => bus.service.id === props.values.business_id)?.name,
      });

      const initialImageUrl = props.values.images?.[0]?.doc_url;
      setImageUrl(initialImageUrl);
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

  const handleUpdate = async (values) => {
    try {
      const providerId = props.values.id;
      const usedValues = await form.validateFields();

      const img_url = imageUrl || props.values.images?.[0]?.doc_url;

      // await updateProvider(providerId, { ...usedValues, img_url });
      form.resetFields();
      setImageUrl(undefined);
      props.onCancel(true);
      message.success('Provider updated successfully');
      props.onTableReload();
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
            id: 'pages.searchTable.updateForm.editProvider',
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
      {/* Step 1 */}
      <StepsForm.StepForm
        initialValues={{
          name: props.values.doc_format,
          doc_type: props.values.doc_type,
          working_document_id: regDocs.find((doc) => doc.id === props.values.working_document_id)?.doc_name,
          business: businesses.find((bus) => bus.service.id === props.values.business_id)?.name,
        }}
        title={intl.formatMessage({
          id: 'pages.searchTable.updateForm.step1',
          defaultMessage: 'Provider info',
        })}
      >
        <ProFormText
          name="name"
          label="Name"
          width="md"
          rules={[
            {
              required: true,
              message: 'Please enter the provider name!',
            },
          ]}
        />

        <ProFormSelect
          name="doc_type"
          width="md"
          label="Select Document Type"
          valueEnum={{
            registration: 'Registration Doc',
            business: 'Business Doc',
          }}
          onChange={(value) => {
            setFormData((prevData) => {
              const updatedData = { ...prevData, doc_type: value };
              // If "registration" is selected, reset the value of the "business" field
              if (value === 'registration') {
                updatedData.business = '';
              }

              // If "business" is selected, reset the value of the "doc_name" field (if needed)
              if (value === 'business') {
                updatedData.doc_name = '';
              }

              return updatedData;
            });
          }}
        />

        <ProFormSelect
          name="working_document_id"
          width="md"
          label="Select Registration Doc"
          valueEnum={regDocs.reduce((enumObj, doc) => {
            enumObj[doc.id] = doc.doc_name;
            return enumObj;
          }, {})}
          disabled={formData.doc_type !== 'registration'}
        />
        
        <ProFormSelect
          name="business"
          width="md"
          label="Select Business"
          valueEnum={businesses?.reduce((enumObj, business) => {
            enumObj[business.service.id] = business.service.name;
            return enumObj;
          }, {})}
          disabled={formData.doc_type !== 'business'}
        />
      </StepsForm.StepForm>
      {/* Step 2 */}
      <StepsForm.StepForm
        title={intl.formatMessage({
          id: 'pages.searchTable.updateForm.step2',
          defaultMessage: 'Images upload',
        })}
      >
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
          {props.values.images && <Image src={props.values.images?.[0]?.doc_url} width={200} />}
        </Form.Item>
      </StepsForm.StepForm>
    </StepsForm>
  );
};

export default ProviderUpdateForm;
