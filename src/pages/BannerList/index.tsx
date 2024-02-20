import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProDescriptionsItemProps } from '@ant-design/pro-components';
import {
  FooterToolbar,
  ModalForm,
  PageContainer,
  ProForm,
  ProDescriptions,
  ProFormText,
  ProFormUploadButton,
  ProTable,
  ProFormTextArea,
  ProFormDateTimePicker,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Drawer, Image, Input, Tag, message } from 'antd';
import React, { useRef, useState, useEffect } from 'react';
import type { FormValueType } from './components/UpdateForm';
import UpdateForm from './components/UpdateForm';
import { storage } from './../../firebase/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getCategories } from '../CategoryList/CategorySlice';
import { addBanner, getBanners, removeBanners } from './BannerSlice';
import moment from 'moment';



const BannerList: React.FC = () => {

  const [createModalOpen, handleModalOpen] = useState<boolean>(false);

  const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

  const [showDetail, setShowDetail] = useState<boolean>(false);

  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<API.BannerListItem>();
  const [selectedRowsState, setSelectedRows] = useState<API.BannerListItem[]>([]);
  const [categories, setCategories] = useState([]);

  const intl = useIntl();


  const handleRemove = async (selectedRows: API.BannerListItem[]) => {
  

    const hide = message.loading('Loading....');
    if (!selectedRows) return true;
    try {
      // console.log('in try and catch');
      await removeBanners({
        key: selectedRows.map((row) => row.id),
      });
      hide();
      message.success('Deleted successfully and will refresh soon');
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

    const description = formData.get('description') as string;
    const start_date = formData.get('start_date') as string;
    const end_date = formData.get('end_date') as string;
    const imageFile = formData.get('image') as File;


    try {
      const storageRef = ref(storage, `banners/${imageFile.name}`);

      if (imageFile) {
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
            // Handle unsuccessful uploads
            console.error('Upload error:', error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              const BannerData: API.BannerListItem = {
                id: 0, 
                description: description,
                start_date:start_date,
                end_date:end_date,
                url: downloadURL, 
              };

              // Save the data to the database
              const hide = message.loading('Loading...');
              try {
                await addBanner(BannerData);
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
      }
    } catch (error) {
      message.error('Image upload failed, please try again!');
      return false
    }
  };


  const columns: ProColumns<API.BannerListItem>[] = [
 
    {
        title: <FormattedMessage id="pages.searchTable.titleImage" defaultMessage="Image" />,
        dataIndex: 'url',
        hideInSearch: true,
        render: (_, record) => (
          <Image
            src={record.url}
            alt="Image"
            style={{ maxWidth: '100px' }}
          />
        ),
      },

    {
        title: (
          <FormattedMessage
            id="pages.searchTable.updateForm.ruleName.description"
            defaultMessage="Description"
          />
        ),
        dataIndex: 'description',
        valueType: 'text',
        tip: 'The Description is the unique key',
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
        title: 'Start Date',
        dataIndex: 'start_date', 
        hideInSearch: true,
        render: (text, record) => (
          <span>{moment(record.start_date).format('DD/MM/YYYY HH:mm:ss')}</span>
        ),
      },
      {
        title: 'End Date',
        dataIndex: 'end_date',
        hideInSearch: true,
        render: (text, record) => (
          <span>{moment(record.end_date).format('DD/MM/YYYY HH:mm:ss')}</span>
        ),
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
            } else if (text == 'In Active') {
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
        //key={categories.length}
        pagination={{
          pageSizeOptions: ['15', '30', '60', '100'],
          defaultPageSize: 15, 
          showSizeChanger: true, 
          locale: {items_per_page: ""}
        }}
        headerTitle={intl.formatMessage({
          id: 'pages.searchTable.title',
          defaultMessage: 'Enquiry form',
        })}
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
        //  filterType: 'light', // Use a light filter form for better layout
        }}
        request={async (params, sorter, filter) => {
          try {      
            const response = await getBanners(params);

            console.log('resposnseee',response);
            const banners = response.data.banners;
            
            const filteredBanners = banners.filter(banner =>
              params.description
                ? banner.description
                    .toLowerCase()
                    .split(' ')
                    .some(word => word.startsWith(params.description.toLowerCase()))
                : true
            );
      
            return {
              data: filteredBanners,
              success: true,
            };
          } catch (error) {
            console.error('Error fetching Banners data:', error);
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
        </FooterToolbar>
      )}
      <ModalForm
        title={intl.formatMessage({
          id: 'pages.searchTable.createForm.description',
          defaultMessage: 'Add Banner',
        })}
        width="400px"
        open={createModalOpen}
        onOpenChange={handleModalOpen}
        onFinish={async (value) => {
          const formData = new FormData();
          formData.append('description', value.description);
          formData.append('start_date', value.start_date);
          formData.append('end_date', value.end_date);
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
        <ProFormTextArea
         width="md"
         name="description"
         label="Description"
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
</ProForm.Group>

<ProForm.Group>
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
          <ProFormUploadButton
            name="image"
            label="Upload Banner"
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
          <ProDescriptions<API.BannerListItem>
            column={2}
            title={currentRow?.name}
            request={async () => ({
              data: currentRow || {},
            })}
            params={{
              id: currentRow?.name,
            }}
            columns={columns as ProDescriptionsItemProps<API.BannerListItem>[]}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default BannerList;
