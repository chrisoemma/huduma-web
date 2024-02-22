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
        
            // Check if it's an "Edit" action
            if (entity.action_type === 'Edit') {
              // Check if any changes occurred
              const changesDetected = Object.keys(actionData.from).some(
                key => actionData.from[key] !== actionData.current[key]
              );
        
              // If changes are detected, display both 'from' and 'current' with a red tag
              if (changesDetected) {
                return (
                    <div>
                    {Object.keys(actionData.from).map((key) => (
                      <p key={key}>
                        <strong>{key}:</strong>
                        {actionData.from[key] !== actionData.current[key] ? (
                          <span>
                            {actionData.from[key]} (From) -&gt; {actionData.current[key]} (To)
                          </span>
                        ) : (
                          actionData.from[key]
                        )}
                      </p>
                    ))}
                  </div>
                );
              }
              // If no changes, display only 'current'
              return (
                <div>
                  {Object.keys(actionData.current).map((key) => (
                    <p key={key}>
                      <strong>{key}:</strong> {actionData.current[key]}
                    </p>
                  ))}
                </div>
              );
            }

            if (entity.action_type === 'Delete') {
              return (
                <div>
                  <p>
                    <strong>Name:</strong> {actionData.name}
                  </p>
                  <p>
                    <strong>NIDA:</strong> {actionData.nida}
                  </p>
                  <p>
                    <strong>Phone:</strong> {actionData.phone}
                  </p>
                 
                </div>
              );
            }
        
            // Check if it's a "Create" action
            if (entity.action_type === 'Create') {
              return (
                <div>
                  <p>
                    <strong>Name:</strong> {actionData.name}
                  </p>
                  <p>
                    <strong>NIDA:</strong> {actionData.nida}
                  </p>
                  <p>
                    <strong>Phone:</strong> {actionData.phone}
                  </p>
                  <p>
                    <strong>Status:</strong> {actionData.status}
                  </p>
                </div>
              );
            }
        
            // Default rendering if the action type is neither "Edit" nor "Create"
            return (
              <div>
                <p><strong>Action Data:</strong> {dom}</p>
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
        render: (text, record) => {
                let color = '';
                if (text == 'Create') {
                    color = 'green';
                
                } else if (text == 'Edit') {
                    color = 'yellow';
                }else{
                    color='red'
                }

                return (
                    <span>
                        <Tag color={color}>{text}</Tag>
                    </span>
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
                    id="pages.searchTable.updateForm.actionBy"
                    defaultMessage="Action by"
                />
            ),
            dataIndex: 'action_by',
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
                    id: 'pages.searchTable.title1',
                    defaultMessage: 'Logs',
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

                        logs.reverse();
                    
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
