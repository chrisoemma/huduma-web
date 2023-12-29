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
import { getUserLogs } from '../LogsSlice';


const UserLogList: React.FC = () => {


    const [showDetail, setShowDetail] = useState<boolean>(false);

    const actionRef = useRef<ActionType>();
    const [currentRow, setCurrentRow] = useState<API.UserLogListItem>();
    const [selectedRowsState, setSelectedRows] = useState<API.UserLogListItem[]>([]);

    const intl = useIntl();

    const columns: ProColumns<API.UserLogListItem>[] = [

        {
            title: (
              <FormattedMessage
                id="pages.searchTable.updateForm.actionData"
                defaultMessage="Action Data"
              />
            ),
            dataIndex: 'action_data',
            search: false,
            valueType: 'text',
            render: (dom, entity) => {
              const actionData = JSON.parse(entity.action_data);
        
              return (
                <div>
                  <strong> Name:</strong> {actionData.name}
                  <strong> NIDA:</strong> {actionData.nida}
                  <strong> Phone:</strong> {actionData.phone}
                  <strong> Status:</strong> {actionData.status}
                  {/* Add more fields as needed */}
                </div>
              );
            },
          },
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.action"
                    defaultMessage="Action"
                />
            ),
            dataIndex: 'action_type',
            search: false,
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
        },
        {
            title: (
              <FormattedMessage
                id="pages.searchTable.updateForm.resource"
                defaultMessage="Resource"
              />
            ),
            dataIndex: 'loggable_type',
            valueType: 'text',
            search: false,
            render: (dom, entity) => {
              // Split the loggable_type value by backslashes and get the last segment
              const resourceName = entity.loggable_type.split('\\').pop();
        
              return (
                <a
                  onClick={() => {
                    setCurrentRow(entity);
                    setShowDetail(true);
                  }}
                >
                  {resourceName}
                </a>
              );
            },
          },
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.actionDate"
                    defaultMessage="Action date"
                />
            ),
            dataIndex: 'action_date',
            valueType: 'text',
            search: false,
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
        },
  
        {
            title: <FormattedMessage id="pages.searchTable.titleStatus" defaultMessage="Seen Status" />,
            dataIndex: 'seen_status',
            hideInForm: true,
            search: false,
            render: (text, record) => {
                let color = '';
                if (text == '1') {
                    color = 'green';
                    text='Seen';
                } else if (text == '0') {
                    color = 'red';
                    text='Not seen';
                }

                return (
                    <span>
                        <Tag color={color}>{text}</Tag>
                    </span>
                );
            },
        },
    ];

    
    return (

        <PageContainer>
            <ProTable
                //key={categories.length}
                headerTitle={intl.formatMessage({
                    id: 'pages.searchTable.title1',
                    defaultMessage: 'Approval List',
                })}
                actionRef={actionRef}
                rowKey="id"

                search={{
                    labelWidth: 120,
                    //  filterType: 'light', // Use a light filter form for better layout
                }}
                request={async (params, sorter, filter) => {
                    try {
                        const response = await getUserLogs(params);
                        const logs = response.data.logs;
                    
                        const filteredLogs = logs.filter(log =>
                            params.name
                                ? log.name
                                    .toLowerCase()
                                    .split(' ')
                                    .some(word => word.startsWith(params.name.toLowerCase()))
                                : true
                        );

                        return {
                            data: filteredLogs,
                            success: true,
                        };
                    } catch (error) {
                        console.error('Error fetching Logs data:', error);
                        return {
                            data: [],
                            success: false,
                        };
                    }
                }}

                columns={columns}
             
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
                    <ProDescriptions<API.UserLogListItem>
                        column={2}
                        title={currentRow?.name}
                        request={async () => ({
                            data: currentRow || {},
                        })}
                        params={{
                            id: currentRow?.name,
                        }}
                        columns={columns as ProDescriptionsItemProps<API.UserLogListItem>[]}
                    />
                )}
            </Drawer>
        </PageContainer>
    );
};

export default UserLogList;
