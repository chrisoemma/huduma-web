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
import { FormattedMessage, useIntl, useModel } from '@umijs/max';
import { Button, Drawer, Image, Input, Tag, message } from 'antd';
import React, { useRef, useState, useEffect } from 'react';

import { addService, getServices, removeService } from './ServiceSlice';
import { getSubCategories } from '../SubCategory/SubCategorySlice';
import ServiceUpdate from './Components/ServiceUpdate';


//change name from sub service to service

const ServicesList: React.FC = () => {

  const [createModalOpen, handleModalOpen] = useState<boolean>(false);

  const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

  const [showDetail, setShowDetail] = useState<boolean>(false);

  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<API.ServiceListItem>();
  const [selectedRowsState, setSelectedRows] = useState<API.ServiceListItem[]>([]);
  const [subServices, setSubServices] = useState([]);
  const [services, setServices] = useState([]);
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const  action_by=currentUser?.id;

  const intl = useIntl();
  const [loading, setLoading] = useState(false);
  const formRef = useRef();

  const handleRemove = async (selectedRows: API.ServiceListItem[]) => {


    const hide = message.loading('Loading....');
    if (!selectedRows) return true;
    try {
      // console.log('in try and catch');
      await removeService({
        key: selectedRows.map((row) => row.id),
        deleted_by:action_by
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

   
    const imageFile = formData.get('image') as File;
    const serviceId = formData.get('service');
    const name_en = formData.get('name_en') as string;
    const name_sw = formData.get('name_sw') as string;
    const description_en = formData.get('description_en') as string;
    const description_sw = formData.get('description_sw') as string;

    const newFormData = new FormData();
    newFormData.append('name_en', name_en);
    newFormData.append('name_sw', name_sw);
    newFormData.append('description_en', description_en);
    newFormData.append('description_sw', description_sw);
    newFormData.append('service_id', serviceId);
    newFormData.append('file', imageFile);
    newFormData.append('created_by',action_by)
    setLoading(true);
    try {

    
      if (imageFile) {
        const hide = message.loading('Loading....');
   
            try {
  
              try {
                await addService(newFormData);
                setLoading(false);
                hide();
                message.success('Added successfully');
                return true
              } catch (error) {
                hide();
                setLoading(false);
                message.error('Adding failed, please try again!');
                return false
              } finally {
                handleModalOpen(false);
                actionRef.current?.reload();
                formRef.current.resetFields();

              }
            } catch (error) {
              message.error('Error getting download URL, please try again!');
              setLoading(false); 
              return false
            } finally {
              handleModalOpen(false);
              setLoading(false); 
            }
       
   
      } else {
        // If no image is uploaded, create an object without img_url
        const SubServiceData: API.ServiceListItem = {
          id: 0, // Set the appropriate ID
          name_en: name_en,
          name_sw: name_sw,
          description_en: description_en,
          description_sw: description_sw,
          service_id: serviceId,
          created_by:action_by
        
        };

        // Save the data to the database
        const hide = message.loading('Loading...');
        try {
          await addService(SubServiceData);
          hide();
          setLoading(false); 
          message.success('Added successfully');
          return true
        } catch (error) {
          
          hide();
          setLoading(false); 
          message.error('Adding failed, please try again!');
          return false
        }
      }
    } catch (error) {
      message.error('Image upload failed, please try again!');
      setLoading(false); 
      return false
      
    }
  };


  useEffect(() => {

    async function fetchData() {
      try {
        const response = await getServices();
        const subServices = response.data.sub_services;
        console.log('SubServices1112:', subServices);
        setSubServices(subServices);
        actionRef.current?.reloadAndRest(); // Reload and reset the table state
      } catch (error) {
        console.error('Error fetching SubService data:', error);
      }
    }

    fetchData();
  }, []);


  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getSubCategories();
        const services = response.data.services;
        console.log('services:', services);
        setServices(services);
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
          defaultMessage="Service"
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
        return record.default_images.map((image, index) => (
          <Image
            key={index}
            src={image?.img_url}
            alt={`Image ${index + 1}`}
            style={{ maxWidth: '100px' }}
          />
        ));
      }
    },
    {
      title: (
        <FormattedMessage
          id="pages.searchTable.updateForm.subCategory"
          defaultMessage="Sub Category"
        />
      ),
      dataIndex: 'service',
      valueType: 'text',
      tip: 'Belongs to this sub category',
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
                <b>English:</b> {description.en}
              </div>
              <div>
                <b>Swahili:</b> {description.sw}
              </div>
            </>
          );
        }
        return '-------';
      },
      search: false,
    },
    {
      title: <FormattedMessage id="pages.searchTable.titleStatus" defaultMessage="Status" />,
      dataIndex: 'status',
      hideInForm: true,
      search: false,
      render: (text, record) => {
          let color = '';
          if (text == 'Active') {
              color = 'green';
          } else if (text == 'In-Active') {
              color = 'red';
          }
          return (
              <span>
                  <Tag color={color}>{text}</Tag>
              </span>
          );
      },
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
        //key={SubServices.length}
        pagination={{
          pageSizeOptions: ['15', '30', '60', '100'],
          defaultPageSize: 15,
          showSizeChanger: true,
          locale: { items_per_page: "" }
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
          filterType: 'query',
      }}
        request={async (params, sorter, filter) => {
          try {
            const response = await getServices(params);
            const services = response.data.sub_services;
            // Filter the data based on the 'name' filter

            const filteredServices = services.filter(subService =>
              params.name
                ? subService.name
                  .toLowerCase()
                  .split(' ')
                  .some(word => word.startsWith(params.name.toLowerCase()))
                : true
            );

            return {
              data: filteredServices,
              success: true,
            };
          } catch (error) {
            console.error('Error fetching SubService data:', error);
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
          id: 'pages.searchTable.createForm.newSubService',
          defaultMessage: 'Create SubService',
        })}
        width="400px"
        open={createModalOpen}
        formRef={formRef}
        onOpenChange={handleModalOpen}
        onFinish={async (value) => {
          const formData = new FormData();
          formData.append('name_en', value.name_en);
          formData.append('name_sw', value.name_sw);
          formData.append('description_en', value.description_en);
          formData.append('description_sw', value.description_sw);
          formData.append('service', value.service);
          if (value.image) {
            formData.append('image', value.image[0].originFileObj);
          }

          const success = await handleAdd(formData);

          if (success) {
            handleModalOpen(false);
            if (actionRef.current) {
              actionRef.current.reload();
            }
            formRef.current.resetFields();
          }
        }}
        
        submitter={{
          submitButtonProps: {
            loading: loading, // Set loading state on the button
            disabled: loading, // Disable button while loading
          },
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
            name="service"
            width="md"
            label={intl.formatMessage({
              id: 'pages.searchTable.updateForm.services',
              defaultMessage: 'SubService category',
            })}
            valueEnum={services.reduce((enumObj, service) => {
              enumObj[service.id] = service?.name?.en;
              return enumObj;
            }, {})}

            rules={[
              {
                required: true,
                message: 'Please select the Service!',
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
      <ServiceUpdate
        onSubmit={async (value) => {
          const success = await handleUpdate(value);
          if (success) {
            handleUpdateModalOpen(false);
            setCurrentRow(undefined);
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }
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

export default ServicesList;
