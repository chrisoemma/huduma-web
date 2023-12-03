// import {
import React, { useEffect, useState,useRef } from 'react';
import { Modal, Upload, Image, Form, Button, message } from 'antd';
import { ProFormText,   StepsForm, ProFormSelect, ProFormTextArea } from '@ant-design/pro-form';
import { InboxOutlined } from '@ant-design/icons';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { FormattedMessage, useIntl } from '@umijs/max';
import { storage } from '@/firebase/firebase';
import { updateService } from '../ServiceSlice';
import { getCategories } from '@/pages/CategoryList/CategorySlice';


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
  const [categories, setCategories] = useState([]);


  const stepsFormRef = useRef();

  useEffect(() => {
    // Fetch categories when the component mounts
    async function fetchCategories() {
      try {
        const response = await getCategories({});
        const fetchedCategories = response.data.categories;
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }

    fetchCategories();
  }, [props.updateModalOpen]);
  

  useEffect(() => {

    if (props.updateModalOpen && categories.length > 0) {
      const categoryName = categories.find((cat) => cat.id === props.values.category_id)?.name || '';
      form.setFieldsValue({
        name: props.values.name,
        description:props.values.description,
        target: categoryName,
      });
      const initialImageUrl = props.values.images?.[0]?.img_url;
      setImageUrl(initialImageUrl);
    }
  }, [props.updateModalOpen, categories, props.values, form]);

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
    
      const serviceId = props.values.id;
        //return console.log('values',values);
      const selectedCategory = 
      categories.find((cat) => cat.name === values.category) ||
      categories.find((cat) => cat.id == values.category);
    if (!selectedCategory) {
      console.error('Selected category not found');
      return;
    }

    const usedValues = await form.validateFields();

    const category_id = selectedCategory.id;
    const description = values.description;
    const img_url = imageUrl || props.values.images?.[0]?.img_url;
     
    usedValues.category_id=selectedCategory.id;
    usedValues.description = values.description;
    usedValues.name = values.name;
    usedValues.img_url = imageUrl || props.values.images?.[0]?.img_url;

      await updateService(serviceId, { ...usedValues, img_url });
      form.resetFields();
      setImageUrl(undefined);
      props.onCancel(true);
      message.success('Service updated successfully');
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
          category: categories.find((cat) => cat.id === props.values.category_id)?.name,
        }}
        title={intl.formatMessage({
          id: 'pages.searchTable.updateForm.step1',
          defaultMessage: 'Service info',
        })}
      >
        <ProFormText
          name="name"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.serviceName',
            defaultMessage: 'Service Name',
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
          name="category"
          width="md"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.category',
            defaultMessage: 'Service category',
          })}
          valueEnum={categories.reduce((enumObj, category) => {
            enumObj[category.id] = category.name;
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
          {props.values.images && <Image src={props.values.images?.[0]?.img_url} width={200} />}
        </Form.Item>

      </StepsForm.StepForm>
      
    </StepsForm>
  );
  
};

export default UpdateForm;
