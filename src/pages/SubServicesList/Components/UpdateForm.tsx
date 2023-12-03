// import {
  import React, { useEffect, useState,useRef } from 'react';
  import { Modal, Upload, Image, Form, Button, message } from 'antd';
  import { ProFormText,   StepsForm, ProFormSelect, ProFormTextArea } from '@ant-design/pro-form';
  import { InboxOutlined } from '@ant-design/icons';
  import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
  import { FormattedMessage, useIntl } from '@umijs/max';
  import { storage } from '@/firebase/firebase';

  import { getServices } from '@/pages/ServicesList/ServiceSlice';
import { updateSubService } from '../SubServiceSlice';
//import { updateSubService } from '../SubServiceSlice';
  
  
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
    const [imageUrl, setImageUrl] = useState<string | undefined>(props.values.default_images?.[0]?.img_url);
    const [services, setServices] = useState([]);
  
  
    const stepsFormRef = useRef();
  
    useEffect(() => {
      // Fetch categories when the component mounts
      async function fetchServices() {
        try {
          const response = await getServices({});
          const fetchedServices = response.data.services;
          setServices(fetchedServices);
        } catch (error) {
          console.error('Error fetching Services:', error);
        }
      }
  
      fetchServices();
    }, [props.updateModalOpen]);
    
  
    useEffect(() => {
  
        
      if (props.updateModalOpen && services.length > 0) {
        const servicesName = services.find((service) => service.id === props.values.service_id)?.name || '';
        form.setFieldsValue({
          name: props.values.name,
          description:props.values.description,
          target: servicesName,
        });
        const initialImageUrl = props.values.default_images?.[0]?.img_url;
        setImageUrl(initialImageUrl);
      }
    }, [props.updateModalOpen, services, props.values, form]);
  
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
      
        const subServiceId = props.values.id;
         // return console.log('values',values.service);
       const selectedService =
      services.find((cat) => cat.id == values.service) ||
     services.find((cat) => cat.name === values.service);
  
      if (!selectedService) {
        console.error('Selected category not found');
        return;
      }
  
      const usedValues = await form.validateFields();
  
      const service_id = selectedService.id;
      const description = values.description;
      const img_url = imageUrl || props.values.default_images?.[0]?.img_url;
       
      usedValues.service_id=selectedService.id;
      usedValues.description = values.description;
      usedValues.name = values.name;
      usedValues.img_url = imageUrl || props.values.default_images?.[0]?.img_url;
  
        await updateSubService(subServiceId, { ...usedValues, img_url });
        form.resetFields();
        setImageUrl(undefined);
        props.onCancel(true);
        message.success('Sub Service updated successfully');
        props.onTableReload();
        stepsFormRef.current?.submit();
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
              id: 'pages.searchTable.updateForm.editCategory',
              defaultMessage: 'Edit Service',
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
            name: props.values.name,
            description: props.values.description,
            service: services.find((service) => service.id === props.values.service_id)?.name,
          }}
          title={intl.formatMessage({
            id: 'pages.searchTable.updateForm.step1',
            defaultMessage: 'Sub Service info',
          })}
        >
          <ProFormText
            name="name"
            label={intl.formatMessage({
              id: 'pages.searchTable.updateForm.subserviceName',
              defaultMessage: 'Sub Service Name',
            })}
            width="md"
            rules={[
              {
                required: true,
                message: 'Please enter the service name!',
              },
            ]}
          />
          <ProFormSelect
            name="service"
            width="md"
            label={intl.formatMessage({
              id: 'pages.searchTable.updateForm.services',
              defaultMessage: 'Service',
            })}
            valueEnum={services.reduce((enumObj, service) => {
              enumObj[service.id] = service.name;
              return enumObj;
            }, {})}
            rules={[
              {
                required: true,
                message: 'Please select the service category!',
              },
            ]}
          />
          <ProFormTextArea
            name="description"
            width="md"
            label={intl.formatMessage({
              id: 'pages.searchTable.updateForm.description',
              defaultMessage: 'Description',
            })}
            placeholder={intl.formatMessage({
              id: 'pages.searchTable.updateForm.ruleDesc.descPlaceholder',
              defaultMessage: 'Description',
            })}
            rules={[
              {
                required: true,
                message: 'Please enter the description!',
                min: 5,
              },
            ]}
          />
        </StepsForm.StepForm>
  
        {/* Step 2 */}
        <StepsForm.StepForm
          // initialValues={{
          //   image: [{ uid: '-1', name: 'image', status: 'done', url: imageUrl }],
          // }}
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
            {props.values.default_images && <Image src={props.values.default_images?.[0]?.img_url} width={200} />}
          </Form.Item>
  
        </StepsForm.StepForm>
        
      </StepsForm>
    );
    
  };
  
  export default UpdateForm;
  