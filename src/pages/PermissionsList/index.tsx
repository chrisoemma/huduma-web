import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProDescriptionsItemProps } from '@ant-design/pro-components';
import {
  FooterToolbar,
  ModalForm,
  PageContainer,
  ProForm,
  ProDescriptions,
  ProFormText,
  ProTable,
  ProFormCheckbox,
  ProFormSelect,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Drawer, Image, Input, Tag, message } from 'antd';
import React, { useRef, useState, useEffect } from 'react';


import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addPermission, getPermissionCategories, getPermissions } from '../PermissionsList/PermissionSlice';
import { formatErrorMessages, showErrorWithLineBreaks } from '@/utils/function';
import { addRole, getRoles, removeRole } from '../RolesList/RoleSlice';
import UpdateForm from './componets/UpdateForm';



const PermissionList: React.FC = () => {

  const [createModalOpen, handleModalOpen] = useState<boolean>(false);

  const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

  const [showDetail, setShowDetail] = useState<boolean>(false);

  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<API.PermissionListItem>();
  const [selectedRowsState, setSelectedRows] = useState<API.PermissionListItem[]>([]);
  const [categories, setCategories] = useState([]);

  const intl = useIntl();



  // console.log('cureentrrrrr',currentRow);


  const handleRemove = async (selectedRows: API.PermissionListItem[]) => {


    const hide = message.loading('Loading....');
    if (!selectedRows) return true;
    try {
      // console.log('in try and catch');
      await removeRole({
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

    const name = formData.get('name') as string;
    const category = formData.get('category') as string;

      console.log('categoryyyr',category);

        

    try {

      const permissionData: API.PermissionListItem = {
        id: 0,
        name: name,
        category: category
      };

      const hide = message.loading('Loading...');
      try {
        const response = await addPermission(permissionData);
        if (response.status) {
          hide();
          message.success(response.message);
          return true;
        } else {
          if (response.data) {
            const errors = response.data.errors;
            showErrorWithLineBreaks(formatErrorMessages(errors));
          } else {
            message.error(response.message);
          }
        }
      } catch (error) {
        hide();
        console.log('errorrrs', error)
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
        const response = await getPermissionCategories();
        const categories = response.data.categories;

      

        setCategories(categories);
        actionRef.current?.reloadAndRest(); // Reload and reset the table state
      } catch (error) {
        console.error('Error fetching categories data:', error);
      }
    }

    fetchData();
  }, []);





  const columns: ProColumns<API.PermissionListItem>[] = [
    {
      title: (
        <FormattedMessage
          id="pages.searchTable.updateForm.roleName"
          defaultMessage="Permission Name"
        />
      ),
      dataIndex: 'name',
      valueType: 'text',
      tip: 'The Name is the unique key',
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
          id="pages.searchTable.updateForm.roleName"
          defaultMessage="Category"
        />
      ),
      dataIndex: 'category',
      valueType: 'text',
      tip: 'The Permission Category',
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
      search: false,
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
        headerTitle={intl.formatMessage({
          id: 'pages.searchTable.roles',
          defaultMessage: 'Roles',
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
            const response = await getPermissions(params);
            const permissions = response.data.permissions;

            const filteredPermissions = permissions.filter(role =>
              params.name
                ? role.name
                  .toLowerCase()
                  .split(' ')
                  .some(word => word.startsWith(params.name.toLowerCase()))
                : true
            );

            return {
              data: filteredPermissions,
              success: true,
            };
          } catch (error) {
            console.error('Error fetching permissions data:', error);
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
          id: 'pages.searchTable.createForm.editRole',
          defaultMessage: 'Add Permission',
        })}
        width="400px"
        open={createModalOpen}
        onOpenChange={handleModalOpen}
        onFinish={async (value) => {
          const formData = new FormData();
          formData.append('name', value.name);
          formData.append('category', value.category);


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

          <ProFormSelect
       name="category"
       width="md"
       label={intl.formatMessage({
         id: 'pages.searchTable.updateForm.category',
         defaultMessage: 'Group',
       })}
       valueEnum={categories.reduce((enumObj, category) => {
         enumObj[category] = category;
         return enumObj;
       }, {})}
       mode="tags"
       maxTagCount={1}
       showSearch
       showArrow
       rules={[
         {
           required: true,
           message: 'Please select the group!',
         },
       ]}
     />
     

        </ProForm.Group>
      </ModalForm>
      <UpdateForm
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
          <ProDescriptions<API.PermissionListItem>
            column={2}
            title={currentRow?.name}
            request={async () => ({
              data: currentRow || {},
            })}
            params={{
              id: currentRow?.name,
            }}
            columns={columns as ProDescriptionsItemProps<API.PermissionListItem>[]}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default PermissionList;
