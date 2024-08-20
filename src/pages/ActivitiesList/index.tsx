import type { ActionType, ProColumns, ProDescriptionsItemProps } from '@ant-design/pro-components';
import {
  FooterToolbar,
  PageContainer,
  ProDescriptions,
  ProTable,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl, useModel } from '@umijs/max';
import { Button, Drawer, Tag, message } from 'antd';
import React, { useRef, useState } from 'react';

import { getActivities, updateActivityStatus } from './ActivitySlice';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

const ActivitiesList: React.FC = () => {
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<API.ActivitiesListItem>();
  const [selectedRowsState, setSelectedRows] = useState<API.ActivitiesListItem[]>([]);
  const { initialState } = useModel('@@initialState');
  const navigate = useNavigate();
  const intl = useIntl();
  const [loading, setLoading] = useState(false);

  const currentUser = initialState?.currentUser;
  const action_by = currentUser?.id;

  const getLinkForUserType = (type: string, id: string) => {
    switch (type) {
      case 'Provider':
        let link = `/user-management/service-providers`;
        return navigate(link, { state: { navigateToId: id } });
      default:
        return '#';
    }
  };

  const handleUpdateStatus = async (selectedRows: API.ActivitiesListItem[], status: string) => {
    const hide = message.loading('Updating status...');
    try {
      const ids = selectedRows.map((row) => row.id);
      const response = await updateActivityStatus({
        key: ids,
        action_by: action_by,
        status: status,
      });

     
      hide();
      if (response.status) {
        message.success(`Activities marked as ${status} successfully`);
      } else {
        message.error('Status change failed, please try again');
      }

      if (actionRef.current) {
        actionRef.current.reloadAndRest();
      }
    } catch (error) {
      hide();
      message.error('Failed to update status, please try again');
    }
  };

  const columns: ProColumns<API.ActivitiesListItem>[] = [
    {
      title: (
        <FormattedMessage
          id="pages.searchTable.updateForm.ruleName.nameActivity"
          defaultMessage="Name"
        />
      ),
      dataIndex: 'activitable_name',
      valueType: 'text',
      render: (text, record) => (
        <a onClick={() => getLinkForUserType(record.activitable_type, record.activitable_id)}>
          {text}
        </a>
      )
    },
    {
      title: (
        <FormattedMessage
          id="pages.searchTable.updateForm.ruleName.nameUserType"
          defaultMessage="User type"
        />
      ),
      dataIndex: 'activitable_type',
      valueType: 'text',
    },
    {
      title: (
        <FormattedMessage
          id="pages.searchTable.updateForm.ruleName.nameActivityFor"
          defaultMessage="Activity For"
        />
      ),
      dataIndex: 'type',
      valueType: 'text',
    },

    {
        title: (
          <FormattedMessage
            id="pages.searchTable.updateForm.ruleName.nameDeatails"
            defaultMessage="Details"
          />
        ),
        dataIndex: 'details',
        valueType: 'text',
      },

      {
        title: (
          <FormattedMessage
            id="pages.searchTable.updateForm.ruleName.nameDeatails"
            defaultMessage="Created At"
          />
        ),
        dataIndex: 'created_at',
        valueType: 'text',
        render: (text) => moment(text).format('DD/MM/YYYY h:mm A'),
      },
    {
      title: <FormattedMessage id="pages.searchTable.titleStatus" defaultMessage="Status" />,
      dataIndex: 'status',
      hideInForm: true,
      search: false,
      render: (text) => {
        let color = text === 'Completed' ? 'green' : 'orange';
        return <Tag color={color}>{text}</Tag>;
      },
    },
  ];

  return (
    <PageContainer>
      <ProTable
        pagination={{
          pageSizeOptions: ['15', '30', '60', '100'],
          defaultPageSize: 15,
          showSizeChanger: true,
          locale: { items_per_page: "" }
        }}
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        request={async (params) => {
          try {
            const response = await getActivities(params);
            const activities = response.data;
            return {
              data: activities,
              success: true,
            };
          } catch (error) {
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
            type="primary"
            onClick={async () => {
              const pendingRows = selectedRowsState.filter(row => row.status === 'Pending');
              await handleUpdateStatus(pendingRows, 'Completed');
            }}
            disabled={selectedRowsState.every(row => row.status !== 'Pending')}
            loading={loading}
          >
            <FormattedMessage
              id="pages.searchTable.markCompleted"
              defaultMessage="Mark Completed"
            />
          </Button>
          <Button
            onClick={async () => {
              const completedRows = selectedRowsState.filter(row => row.status === 'Completed');
              await handleUpdateStatus(completedRows, 'Pending');
            }}
            disabled={selectedRowsState.every(row => row.status !== 'Completed')}
            loading={loading}
          >
            <FormattedMessage
              id="pages.searchTable.markPending"
              defaultMessage="Mark Pending"
            />
          </Button>
        </FooterToolbar>
      )}

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
          <ProDescriptions<API.ActivitiesListItem>
            column={2}
            title={currentRow?.name}
            request={async () => ({
              data: currentRow || {},
            })}
            params={{
              id: currentRow?.name,
            }}
            columns={columns as ProDescriptionsItemProps<API.ActivitiesListItem>[]}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default ActivitiesList;
