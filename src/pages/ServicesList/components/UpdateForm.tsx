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
  const [loading, setLoading] = useState(false);

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
      const categoryName = categories.find((cat) => cat.id === props.values.category_id)?.name?.en || '';
      form.setFieldsValue({
        name_en: props.values.name?.en || '', 
        name_sw: props.values.name?.sw || '', 
        description_en: props.values.description?.en || '', 
        description_sw: props.values.description?.sw || '', 
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
    
      setLoading(true);
     
      const serviceId = props.values.id;
       
      const selectedCategory = 
      categories.find((cat) => cat?.name?.en === values.category) ||
      categories.find((cat) => cat.id == values.category);
      
     
    if (!selectedCategory) {
      console.error('Selected category not found');
      return;
    }

   
    const usedValues = await form.validateFields();

   
   let  img_url = imageUrl || props.values.images?.[0]?.img_url;

    // Upload new image if available
    if (values.image && values.image.length > 0) {

     
      const downloadURL = await handleUpload(values.image[0].originFileObj);
      img_url = downloadURL;
    }
     
    usedValues.category_id=selectedCategory.id;
    usedValues.description_en = values.description_en;
    usedValues.name_en = values.name_en;
    usedValues.description_sw = values.description_sw;
    usedValues.name_sw = values.name_sw;
    usedValues.img_url = imageUrl || props.values.images?.[0]?.img_url;

    

      await updateService(serviceId, { ...usedValues, img_url });
      setLoading(false);
      setImageUrl(undefined);
      props.onCancel(true);
      message.success('Service updated successfully');
      props.onTableReload();
      stepsFormRef.current?.submit();
    } catch (error) {
      setLoading(false);
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
          name_en: props.values.name?.en || '', 
          name_sw: props.values.name?.sw || '', 
          description_en: props.values.description?.en || '', 
          description_sw: props.values.description?.sw || '', 
          category: categories.find((cat) => cat.id === props.values.category_id)?.name?.en,
        }}
        title={intl.formatMessage({
          id: 'pages.searchTable.updateForm.step1',
          defaultMessage: 'Service info',
        })}
      >
      <ProFormText
            rules={[
              {
                required: true,
                message: 'English Name is required',
              },
            ]}
            width="md"
            name="name_en"
            label="English name"
          />

          <ProFormText
            rules={[
              {
                required: true,
                message: 'Kiswahili Name is required',
              },
            ]}
            width="md"
            name="name_sw"
            label="Kiswahili name"
          />
        <ProFormSelect
          name="category"
          width="md"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.category',
            defaultMessage: 'Service category',
          })}
          valueEnum={categories.reduce((enumObj, category) => {
            enumObj[category.id] = category?.name?.en;
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
          name="description_en"
          width="md"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.description_eng',
            defaultMessage: 'English Description',
          })}
          placeholder={intl.formatMessage({
            id: 'pages.searchTable.updateForm.ruleDesc.descPlaceholder',
            defaultMessage: 'Description in English',
          })}
          rules={[
            {
              required: true,
              message: 'Please enter the description!',
              min: 5,
            },
          ]}
        />

        <ProFormTextArea
          name="description_sw"
          width="md"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.description_sw',
            defaultMessage: 'Kiswahili Description',
          })}
          placeholder={intl.formatMessage({
            id: 'pages.searchTable.updateForm.ruleDesc.descPlaceholder',
            defaultMessage: 'Description in Kiswahili',
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
