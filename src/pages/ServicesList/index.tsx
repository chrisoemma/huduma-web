import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProDescriptionsItemProps } from '@ant-design/pro-components';
import {
  FooterToolbar,
  ModalForm,
  PageContainer,
  ProForm,
  ProDescriptions,
  ProFormText,
  ProFormSelect,
  ProFormTextArea,
  ProFormUploadButton,
  ProTable,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Drawer, Image, Input, message } from 'antd';
import React, { useRef, useState, useEffect } from 'react';
// import type { FormValueType } from './components/UpdateForm';
import UpdateForm from './components/UpdateForm';
import { storage } from './../../firebase/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addService, getServices, removeService } from './ServiceSlice';
import { getCategories } from '../CategoryList/CategorySlice';


const ServiceList: React.FC = () => {

  const [createModalOpen, handleModalOpen] = useState<boolean>(false);

  const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

  const [showDetail, setShowDetail] = useState<boolean>(false);

  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<API.ServiceListItem>();
  const [selectedRowsState, setSelectedRows] = useState<API.ServiceListItem[]>([]);
  const [categories, setCategories] = useState([]);
  const [services,setServices]=useState([]);

  const intl = useIntl();

  const handleRemove = async (selectedRows: API.ServiceListItem[]) => {
  

    const hide = message.loading('Loading....');
    if (!selectedRows) return true;
    try {
      // console.log('in try and catch');
      await removeService({
        key: selectedRows.map((row) => row.id),
      });
      hide();
      message.success('Deleted successfully');
      if (actionRef.current) {
        console.log('invoking this which is null')
        actionRef.current.reloadAndRest();
      }
      return true;
    } catch (error) {
      hide();
      message.error('Delete failed, please try again');
      return false;
    }
  };

  const handleAdd = async (formData: FormData) => {

   
    const name_en = formData.get('name_en') as string;
    const name_sw = formData.get('name_sw') as string;
    const description_en = formData.get('description_en') as string;
    const description_sw = formData.get('description_sw') as string;
    const imageFile = formData.get('image') as File;
    const categoryId = formData.get('category');
    const description = formData.get('description') as string;

    try {
      
      if (imageFile) {
        const storageRef = ref(storage, `images/${imageFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, imageFile);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
            switch (snapshot.state) {
              case 'paused':
                console.log('Upload is paused');
                break;
              case 'running':
                console.log('Upload is running');
                break;
            }
          },
          (error) => {
            console.error('Upload error:', error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              const serviceData: API.ServiceListItem = {
                id: 0, 
                name_en: name_en,
                name_sw: name_sw,
                description_en: description_en,
                description_sw: description_sw,
                category_id:categoryId,
                img_url: downloadURL,
                description:description
                
              };
             
              
              try {

                await addService(serviceData);
                hide();
                message.success('Added successfully');
                return true
              } catch (error) {
                hide();
                message.error('Adding failed, please try again!');
                return false
              } finally {
                handleModalOpen(false);
                actionRef.current.reload();
              }
            } catch (error) {
              message.error('Error getting download URL, please try again!');
              return false
            } finally {
              handleModalOpen(false);
            }
          }
        );
      } else {
        message.error('Please upload image, please try again!');
       
      }
    } catch (error) {
      message.error('Image upload failed, please try again!');
      return false
    }
  };


  useEffect(() => {

    async function fetchData() {
      try {
        const response = await getServices();
        const services = response.data.services;
        console.log('services1112:', services);
        setServices(services);
        actionRef.current?.reloadAndRest(); 
      } catch (error) {
        console.error('Error fetching service data:', error);
      }
    }
  
    fetchData();
  }, []);
  

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getCategories();
        const categories = response.data.categories;
        console.log('Categories:', categories);
        setCategories(categories);
        actionRef.current?.reloadAndRest();
      } catch (error) {
        console.error('Error fetching category data:', error);
      }
    }
    fetchData();
  }, []);

  const columns: ProColumns<API.ServiceListItem>[] = [
    {
      title: (
        <FormattedMessage
          id="pages.searchTable.updateForm.serviceName"
          defaultMessage="Service Name"
        />
      ),
      dataIndex: 'name',
      valueType: 'text',
      tip: 'The service Name is the unique key',
      render: (text, record) => {
        const service = record.name; 
        if (service) {
            return (
                <>
                    <div style={{ marginBottom: 10 }}>
                        <b>English:</b> {service?.en}
                    </div>
                    <div>
                        <b>Swahili:</b> {service?.sw}
                    </div>
                </>
            );
        }
        return '-------';
    },
      search: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.titleImage" defaultMessage="Image" />,
      dataIndex: 'images',
      hideInSearch: true,
      render: (_, record) => {
        return record.images.map((image, index) => (
          <Image
            key={index}
            src={image.img_url}
            alt={`Image ${index + 1}`}
            style={{ maxWidth: '100px' }} 
          />
        ));
      }
    },
    {
        title: (
          <FormattedMessage
            id="pages.searchTable.updateForm.category"
            defaultMessage="Category"
          />
        ),
        dataIndex: 'category',
        valueType: 'text',
        tip: 'Service Category ',
        render: (dom, entity) => {
          return (
            <a
              onClick={() => {
                setCurrentRow(entity);
                setShowDetail(true);
              }}
            >
              {dom ? dom?.name?.en : 'N/A'}
            </a>
          );
        },
        search: true,
      },

    {
        title: (
          <FormattedMessage
            id="pages.searchTable.updateForm.description"
            defaultMessage="Description"
          />
        ),
        dataIndex: 'description',
        valueType: 'text',
        tip: 'General description ',
        render: (text, record) => {
          const description = record?.description; 
          if (description) {
              return (
                  <>
                      <div style={{ marginBottom: 10 }}>
                          <b>English:</b> {description?.en}
                      </div>
                      <div>
                          <b>Swahili:</b> {description?.sw}
                      </div>
                  </>
              );
          }
          return '-------';
      },
        search: true,
      },
    {
      title: <FormattedMessage id="pages.searchTable.titleOption" defaultMessage="Action" />,
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="config"
          onClick={() => {
            handleUpdateModalOpen(true);
            setCurrentRow(record);
          }}
        >
          <FormattedMessage id="pages.searchTable.edit" defaultMessage="Edit" />
        </a>,
       
      ],
    },
  ];


  return (
    <PageContainer>
      <ProTable
        //key={services.length}
        pagination={{
          pageSizeOptions: ['15', '30', '60', '100'],
          defaultPageSize: 15, 
          showSizeChanger: true, 
          locale: {items_per_page: ""}
        }}
     
        actionRef={actionRef}
        rowKey="id"
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              handleModalOpen(true);
            }}
          >
            <PlusOutlined /> <FormattedMessage id="pages.searchTable.new" defaultMessage="New" />
          </Button>,
        ]}
        search={{
          labelWidth: 120,
          filterType: 'light', // Use a light filter form for better layout
        }}
        request={async (params, sorter, filter) => {
          try {      
            const response = await getServices(params);
            const services = response.data.services;
            // Filter the data based on the 'name' filter
            const filteredservices = services.filter(service =>
              params.name
                ? service.name
                    .toLowerCase()
                    .split(' ')
                    .some(word => word.startsWith(params.name.toLowerCase()))
                : true
            );
      
            return {
              data: filteredservices,
              success: true,
            };
          } catch (error) {
            console.error('Error fetching service data:', error);
            return {
              data: [],
              success: false,
            };
          }
        }}
      
        columns={columns}
        rowSelection={{
          onChange: (_, selectedRows) => {
            setSelectedRows(selectedRows);
          },
        }}
      />
      {selectedRowsState?.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              <FormattedMessage id="pages.searchTable.chosen" defaultMessage="Chosen" />{' '}
              <a style={{ fontWeight: 600 }}>{selectedRowsState.length}</a>{' '}
              <FormattedMessage id="pages.searchTable.item" defaultMessage="项" />
              &nbsp;&nbsp;
             
            </div>
          }
        >
          <Button
            onClick={async () => {
              await handleRemove(selectedRowsState);
             setSelectedRows([]);
             actionRef.current?.reload();
            }}
          >
            <FormattedMessage
              id="pages.searchTable.batchDeletion"
              defaultMessage="Batch deletion"
            />
          </Button>
          {/* <Button type="primary">
            <FormattedMessage
              id="pages.searchTable.batchApproval"
              defaultMessage="Batch approval"
            />
          </Button> */}
        </FooterToolbar>
      )}

      <ModalForm
        title={intl.formatMessage({
          id: 'pages.searchTable.createForm.newservice',
          defaultMessage: 'Create service',
        })}
        width="400px"
        open={createModalOpen}
        onOpenChange={handleModalOpen}
        onFinish={async (value) => {
          const formData = new FormData();
          formData.append('name_en', value.name_en);
          formData.append('name_sw', value.name_sw);
          formData.append('description_en', value.description_en);
          formData.append('description_sw', value.description_sw);
          formData.append('category',value.category);
          if (value.image) {
            formData.append('image', value.image[0].originFileObj);
          }

          const success = await handleAdd(formData);

          if (success) {
            handleModalOpen(false);
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }
        }}
      >
        
        <ProForm.Group>
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
  fieldProps={{
    showSearch: true, 
    optionFilterProp: "children",
    filterOption: (input, option) => 
      option?.children?.toLowerCase().indexOf(input?.toLowerCase()) >= 0,
  }}
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
          <ProFormUploadButton
            name="image"
            label="Upload Image"
            style={{ display: 'none' }}
            fieldProps={{
              accept: 'image/*',
              max: 1,
              listType: 'picture-card',
              title: 'Click or Drag to Upload', // Custom title
              placeholder: 'Click or Drag to Upload', // Custom placeholder
            }}
            onChange={(fileList) => {
              // Handle file list changes if needed
              // console.log('File List:', fileList);
            }}
          />
        </ProForm.Group>
      </ModalForm>
      <UpdateForm
        onSubmit={async (value) => {
          // const success = await handleUpdate(value);
          // if (success) {
          //   handleUpdateModalOpen(false);
          //   setCurrentRow(undefined);
          //   if (actionRef.current) {
          //     actionRef.current.reload();
          //   }
          // }
        }}
        onCancel={() => {
          handleUpdateModalOpen(false);
          if (!showDetail) {
            setCurrentRow(undefined);
          }

        }}
        updateModalOpen={updateModalOpen}
        values={currentRow || {}}

        onTableReload={() => {
          if (actionRef.current) {
            actionRef.current.reload();
          }
        }}
      />

      <Drawer
        width={600}
        open={showDetail}
        onClose={() => {
          setCurrentRow(undefined);
          setShowDetail(false);
        }}
        closable={false}
      >
        {currentRow?.name && (
          <ProDescriptions<API.ServiceListItem>
            column={2}
            title={currentRow?.name}
            request={async () => ({
              data: currentRow || {},
            })}
            params={{
              id: currentRow?.name,
            }}
            columns={columns as ProDescriptionsItemProps<API.ServiceListItem>[]}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default ServiceList;
