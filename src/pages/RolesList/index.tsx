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
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Drawer, Image, Input, Tag, message } from 'antd';
import React, { useRef, useState, useEffect } from 'react';


import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addRole, getRoles, removeRole } from './RoleSlice';
import { addPermission, getPermissions } from '../PermissionsList/PermissionSlice';
import { formatErrorMessages, showErrorWithLineBreaks } from '@/utils/function';
import UpdateForm from './componets/UpdateForm';


const RoleList: React.FC = () => {

  const [createModalOpen, handleModalOpen] = useState<boolean>(false);

  const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

  const [showDetail, setShowDetail] = useState<boolean>(false);

  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<API.RoleListItem>();
  const [selectedRowsState, setSelectedRows] = useState<API.RoleListItem[]>([]);
  const [permissions, setPermissions] = useState([]);

  const intl = useIntl();
  const [loading, setLoading] = useState(false);
  const formRef = useRef()



  // console.log('cureentrrrrr',currentRow);


  const handleRemove = async (selectedRows: API.RoleListItem[]) => {


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

    setLoading(true);

    const name = formData.get('name') as string;
    const permissions = formData.getAll('permissions[]').map(id => parseInt(id, 10));

    try {

      const roleData: API.RoleListItem = {
        id: 0,
        name: name,
        permissions: permissions
      };

      const hide = message.loading('Loading...');
      try {
        const response = await addRole(roleData);
        if (response.status) {
          hide();
          setLoading(false);
          message.success(response.message);
          return true;
        } else {
          setLoading(false);
          if (response.data) {
            const errors = response.data.errors;
            showErrorWithLineBreaks(formatErrorMessages(errors));
          } else {
            setLoading(false);
            message.error(response.message);
          }
        }
      } catch (error) {
        hide();
        console.log('errorrrs',error)
        setLoading(false);
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
        const response = await getPermissions();
        const permissions = response.data.permissions;
        setPermissions(permissions);
        actionRef.current?.reloadAndRest(); // Reload and reset the table state
      } catch (error) {
        console.error('Error fetching permissions data:', error);
      }
    }

    fetchData();
  }, []);


  const permissionsByCategory = permissions.reduce((acc, permission) => {
    const { category, name, id } = permission;

    if (!acc[category]) {
      acc[category] = [];
    }

    acc[category].push({
      label: name,
      value: id,
    });

    return acc;
  }, {});

  const groupedOptions = Object.entries(permissionsByCategory).map(([category, permissions]) => (
    <div key={category}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{category}</div>
      <ProFormCheckbox.Group
        name={`permissions_${category}`}
        options={permissions.map(permission => ({
          label: permission.label,
          value: permission.value,
        }))}
      />
    </div>
  ));


  const columns: ProColumns<API.RoleListItem>[] = [
    {
      title: (
        <FormattedMessage
          id="pages.searchTable.updateForm.roleName"
          defaultMessage="Role Name"
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
          id="pages.searchTable.updateForm.permissions"
          defaultMessage="Permissions"
        />
      ),
      dataIndex: 'permissions',
      valueType: 'text',
      tip: 'The Name is the unique key',
      render: (dom, entity) => {
        const permissionList = entity.permissions || [];
        return (
          <span>
            {permissionList.map((permission) => (
              <Tag key={permission?.id}>{permission?.name}</Tag>
            ))}
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
            const response = await getRoles(params);
            const roles = response.data.roles;

          //  console.log('htyyuuy',roles);

            // Filter the data based on the 'name' filter
            const filteredRoles = roles.filter(role =>
              params.name
                ? role.name
                  .toLowerCase()
                  .split(' ')
                  .some(word => word.startsWith(params.name.toLowerCase()))
                : true
            );

            return {
              data: filteredRoles,
              success: true,
            };
          } catch (error) {
            console.error('Error fetching roles data:', error);
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
          defaultMessage: 'Add Role',
        })}
        width="400px"
        open={createModalOpen}
        onOpenChange={handleModalOpen}
        formRef={formRef}
        onFinish={async (value) => {
          const formData = new FormData();
          formData.append('name', value.name);

          Object.entries(permissionsByCategory).forEach(([category, permissions]) => {
            const selectedPermissions = value[`permissions_${category}`] || [];
            selectedPermissions.forEach(permissionId => {
              formData.append('permissions[]', permissionId);
            });
          });

          const success = await handleAdd(formData);

          if (success) {
            handleModalOpen(false);
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }
          formRef.current.resetFields();
        }}

        submitter={{
          submitButtonProps: {
            loading: loading, 
            disabled: loading,
          },
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

          {groupedOptions}

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
          <ProDescriptions<API.RoleListItem>
            column={2}
            title={currentRow?.name}
            request={async () => ({
              data: currentRow || {},
            })}
            params={{
              id: currentRow?.name,
            }}
            columns={columns as ProDescriptionsItemProps<API.RoleListItem>[]}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default RoleList;
