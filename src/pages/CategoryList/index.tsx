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
import { Button, Drawer, Image, Input, message } from 'antd';
import React, { useRef, useState, useEffect } from 'react';
import type { FormValueType } from './components/UpdateForm';
import UpdateForm from './components/UpdateForm';
import { storage } from './../../firebase/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addCategory, getCategories, removeCategory } from './CategorySlice';


const CategoryList: React.FC = () => {

  const [createModalOpen, handleModalOpen] = useState<boolean>(false);

  const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  const [showDetail, setShowDetail] = useState<boolean>(false);

  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<API.CategoryListItem>();
  const [selectedRowsState, setSelectedRows] = useState<API.CategoryListItem[]>([]);
  const [categories, setCategories] = useState([]);

  const intl = useIntl();


  const handleRemove = async (selectedRows: API.CategoryListItem[]) => {

  
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
    const imageFile = formData.get('image') as File;

    try {
   
     
      if (imageFile) {
        setLoading(false); 
        const hide = message.loading('Loading...');
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
              const categoryData: API.CategoryListItem = {
                id: 0,
                name_en: name_en,
                name_sw: name_sw,
                img_url: downloadURL, 
              };
            
              try {
               
                await addCategory(categoryData);
                hide();
                setLoading(false)
                message.success('Added successfully');
                return true
              } catch (error) {
                hide();
                setLoading(false)
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
        message.error('Please, Upload an image!');
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



  const columns: ProColumns<API.CategoryListItem>[] = [
    {
      title: (
        <FormattedMessage
          id="pages.searchTable.updateForm.ruleName.nameLabel"
          defaultMessage="Category Name"
        />
      ),
      dataIndex: 'name',
      valueType: 'text',
      tip: 'The Category Name is the unique key',
      render: (text, record) => {
        const category = record.name; 
        if (category) {
            return (
                <>
                    <div style={{ marginBottom: 10 }}>
                        <b>English:</b> {category.en}
                    </div>
                    <div>
                        <b>Swahili:</b> {category.sw}
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
      title: <FormattedMessage id="pages.searchTable.titleStatus" defaultMessage="Status" />,
      dataIndex: 'status',
      hideInForm: true,
      valueEnum: {
        0: {
          text: (
            <FormattedMessage
              id="pages.searchTable.nameStatus.default"
              defaultMessage="Shut down"
            />
          ),
          status: 'Default',
        },
        1: {
          text: 'Active',
          status: 'Active',
        },

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
          //  filterType: 'light', // Use a light filter form for better layout
        }}
        request={async (params, sorter, filter) => {
          try {
            const response = await getCategories(params);
            const categories = response.data.categories;
            // Filter the data based on the 'name' filter
            const filteredCategories = categories.filter(category =>
              params.name
                ? category.name
                  .toLowerCase()
                  .split(' ')
                  .some(word => word.startsWith(params.name.toLowerCase()))
                : true
            );

            return {
              data: filteredCategories,
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
          defaultMessage: 'Category Name',
        })}
        width="400px"
        open={createModalOpen}
        onOpenChange={handleModalOpen}
        onFinish={async (value) => {
          const formData = new FormData();
          formData.append('name_en', value.name_en);
          formData.append('name_sw', value.name_sw);
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
        loading={loading}
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
          <ProDescriptions<API.CategoryListItem>
            column={2}
            title={currentRow?.name}
            request={async () => ({
              data: currentRow || {},
            })}
            params={{
              id: currentRow?.name,
            }}
            columns={columns as ProDescriptionsItemProps<API.CategoryListItem>[]}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default CategoryList;
