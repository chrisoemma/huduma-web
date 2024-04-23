import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProDescriptionsItemProps } from '@ant-design/pro-components';
import {
  FooterToolbar,
  ModalForm,
  PageContainer,
  ProForm,
  ProDescriptions,
  ProFormText,
  ProFormTextArea,
  ProFormUploadButton,
  ProTable,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Drawer, Image, Input, Tag, message } from 'antd';
import React, { useRef, useState, useEffect } from 'react';
import moment from 'moment';

import {getPastRequests } from '../ReqestSlice';
import { combineSubServices } from '@/utils/function';


const PastRequestList: React.FC = () => {

  const [createModalOpen, handleModalOpen] = useState<boolean>(false);

  const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

  const [showDetail, setShowDetail] = useState<boolean>(false);

  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<API.PastRequestListItem>();
  const [selectedRowsState, setSelectedRows] = useState<API.PastRequestListItem[]>([]);
  const [categories, setCategories] = useState([]);

  const intl = useIntl();


  const handleRemove = async (selectedRows: API.PastRequestListItem[]) => {
  

    const hide = message.loading('Loading....');
    if (!selectedRows) return true;
    try {
      // console.log('in try and catch');
      await removeCategory({
        key: selectedRows.map((row) => row.id),
      });
      hide();
      message.success('Deleted successfully and will refresh soon');
      if (actionRef.current) {
        console.log('invoking this which is null')
      }
      return true;
    } catch (error) {
      hide();
      message.error('Delete failed, please try again');
      return false;
    }
  };



  

  const handleAdd = async (formData: FormData) => {


     

    try {

        // If no image is uploaded, create an object without img_url
        const categoryData: API.PastRequestListItem = {
          id: 0, // Set the appropriate ID
          name: name,
          img_url: '', // No image URL in this case
        };

        // Save the data to the database
        const hide = message.loading('Loading...');
        try {
          await addCategory(categoryData);
          hide();
          message.success('Added successfully');
          return true
        } catch (error) {
          hide();
          message.error('Adding failed, please try again!');
          return false
        }
      
    } catch (error) {
      message.error('Image upload failed, please try again!');
      return false
    }
  };



  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getCategories();
        const categories = response.data.categories;
        console.log('Categories:', categories);
        setCategories(categories);
        actionRef.current?.reloadAndRest(); // Reload and reset the table state
      } catch (error) {
        console.error('Error fetching category data:', error);
      }
    }
  
    fetchData();
  }, []);
  


  const columns: ProColumns<API.PastRequestListItem>[] = [
    {
      title: (
        <FormattedMessage
          id="pages.searchTable.updateForm.providerName"
          defaultMessage="Provider"
        />
      ),
      dataIndex: ['provider','name'],
      valueType: 'text',
      render: (dom, entity) => {
        return (
          <a
            onClick={() => {
              setCurrentRow(entity);
              setShowDetail(true);
            }}
          >
            {dom}
          </a>
        );
      },
      search: true,
    },
    
        {
      title: (
        <FormattedMessage
          id="pages.searchTable.updateForm. clientName"
          defaultMessage="Client"
        />
      ),
      dataIndex: ['client','name'],
      valueType: 'text',
      render: (dom, entity) => {
        return (
          <a
            onClick={() => {
              setCurrentRow(entity);
              setShowDetail(true);
            }}
          >
            {dom}
          </a>
        );
      },
      search: true,
    },

    {
      title: (
        <FormattedMessage
          id="pages.searchTable.updateForm.business"
          defaultMessage="Business"
        />
      ),
      dataIndex: 'service', // Assuming the service data is directly accessible
      valueType: 'text',
      render: (_, entity) => {
        const serviceName = entity.service?.name?.en || entity.service?.name?.sw || '-';
        return (
          <span>
            {serviceName}
          </span>
        );
      },
      search: true,
    },


    {
      title: (
        <FormattedMessage
          id="pages.searchTable.updateForm.SubServices"
          defaultMessage="Services"
        />
      ),
      dataIndex: 'requested_sub_services',
      valueType: 'text',
      render: (dom, entity) => {
        const subServices = combineSubServices(entity);
        const subServicesNames = subServices.map(subService => {
          return subService.provider_sub_list?.name || subService.sub_service?.name?.en || subService.provider_sub_service?.name;
        }).join(', ');
        return (
          <span>
            {subServicesNames}
          </span>
        );
      },
      search: true,
    },

    {
      title: 'Transferred To',
      dataIndex: 'transfer',
      valueType: 'text',
      render: (transfer) => {
        if (transfer && transfer.length > 0) {
          return transfer[0].employee?.name || '-';
        } else {
          return '-';
        }
      },
      search: false,
    },

    {
      title: <FormattedMessage id="pages.searchTable.titleRequestTime" defaultMessage="Request Time" />,
      dataIndex: 'request_time',
      valueType: 'dateTime',
      hideInForm: true,
      render: (text, record) => moment(record.request_time).format('D/M/YYYY H:mm'),
    },
     //Add onother array of time created time
     {
      title: <FormattedMessage id="pages.searchTable.titleStatus" defaultMessage="Status" />,
      dataIndex: 'statuses',
      hideInForm: true,
      render: (_, entity) => {
        const lastStatus = entity.statuses.length > 0 ? entity.statuses[entity.statuses.length - 1].status : null;
        return (
          <span>
            {lastStatus === 'Requested' ? (
              <Tag color="green">{lastStatus}</Tag>
            ) : lastStatus === 'Active' ? (
              <Tag color="green">{lastStatus}</Tag>
            ) : (
              <Tag>{lastStatus}</Tag>
            )}
          </span>
        );
      },
    },
  ];

  return (
    <PageContainer>
      <ProTable
        //key={categories.length}
        pagination={{
          pageSizeOptions: ['15', '30', '60', '100'],
          defaultPageSize: 15, 
          showSizeChanger: true, 
          locale: {items_per_page: ""}
        }}
    
        actionRef={actionRef}
        rowKey="id"
      
        search={{
          labelWidth: 120,
         filterType: 'light', 
        }}
        request={async (params, sorter, filter) => {
          try {      
            const response = await getPastRequests(params);
            const requests = response.data.requests;
            // Filter the data based on the 'name' filter
            const filteredRequests = requests.filter(request =>
              params.name
                ? request.provider.name
                    .toLowerCase()
                    .split(' ')
                    .some(word => word.startsWith(params.name.toLowerCase()))
                : true
            );
      
            return {
              data: filteredRequests,
              success: true,
            };
          } catch (error) {
            console.error('Error fetching category data:', error);
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
          id: 'pages.searchTable.createForm.newCategory',
          defaultMessage: 'Provider Name',
        })}
        width="400px"
        open={createModalOpen}
        onOpenChange={handleModalOpen}
        onFinish={async (value) => {
          const formData = new FormData();
          formData.append('name', value.name);
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
                message: 'Name is required',
              },
            ]}
            width="md"
            name="name"
            label="Name"
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
      {/* <UpdateForm
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
      /> */}

      <Drawer
        width={600}
        open={showDetail}
        onClose={() => {
          setCurrentRow(undefined);
          setShowDetail(false);
        }}
        closable={false}
      >
        {currentRow?.provider.name && (
          <ProDescriptions<API.PastRequestListItem>
            column={2}
            title={currentRow?.name}
            request={async () => ({
              data: currentRow || {},
            })}
            params={{
              id: currentRow?.provider.name,
            }}
            columns={columns as ProDescriptionsItemProps<API.PastRequestListItem>[]}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default PastRequestList;
