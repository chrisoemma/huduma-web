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

//import UpdateForm from './components/UpdateForm';

import { getExpiredSubscriptions} from './ProviderSubscriptionSlice';
import moment from 'moment';


const ActiveSubscriptionsList: React.FC = () => {

    const [createModalOpen, handleModalOpen] = useState<boolean>(false);

    const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

    const [showDetail, setShowDetail] = useState<boolean>(false);

    const actionRef = useRef<ActionType>();
    const [currentRow, setCurrentRow] = useState<API.ActiveSubscriptionsListItem>();
    const [selectedRowsState, setSelectedRows] = useState<API.ActiveSubscriptionsListItem[]>([]);

    const intl = useIntl();

    const columns: ProColumns<API.ActiveSubscriptionsListItem>[] = [
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.provider"
                    defaultMessage="Provider"
                />
            ),
            dataIndex: ['provider', 'name'],
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
                    id="pages.searchTable.updateForm.subService"
                    defaultMessage="Package Name"
                />
            ),
            dataIndex: 'name',
            valueType: 'text',
            render: (dom, entity) => {
                const packageName = entity.is_trial ? entity.package.name : `"${entity.discount.name}"`;
                return (
                    <a
                        onClick={() => {
                            setCurrentRow(entity);
                            setShowDetail(true);
                        }}
                    >
                        {packageName}
                    </a>
                );
            },
        },
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.AmountPaid"
                    defaultMessage="Amount Paid"
                />
            ),
            dataIndex: 'amountPaid',
            valueType: 'text',
            render: (dom, entity) => {
                let amountPaid;
                if (entity.is_trial) {
                    amountPaid = 'Trial/Free';
                } else {
                    const discountAmount = parseFloat(entity.discount.amount);
                    const discountDuration = parseFloat(entity.discount.duration);
                    amountPaid = (discountAmount * discountDuration) - (discountAmount * discountDuration);
                }
                return (
                    <a
                        onClick={() => {
                            setCurrentRow(entity);
                            setShowDetail(true);
                        }}
                    >
                        {amountPaid}
                    </a>
                );
            },
        },
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.Duration"
                    defaultMessage="Duration"
                />
            ),
            dataIndex: 'duration',
            valueType: 'text',
            render: (dom, entity) => {
                let duration;
                if (entity.is_trial) {
                    duration = '1 month';
                } else {
                    duration = `${entity.discount.duration} month(s)`;
                }
                return (
                    <a
                        onClick={() => {
                            setCurrentRow(entity);
                            setShowDetail(true);
                        }}
                    >
                        {duration}
                    </a>
                );
            },
        },
        
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.StartDate"
                    defaultMessage="Start Date"
                />
            ),
            dataIndex: 'start_date',
            valueType: 'dateTime',
        },
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.EndDate"
                    defaultMessage="End Date"
                />
            ),
            dataIndex: 'end_date',
            valueType: 'dateTime',
        },

        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.WillExpireIn"
                    defaultMessage="Will Expire In"
                />
            ),
            dataIndex: 'expireIn',
            valueType: 'text',
            render: (dom, entity) => {
                // Calculate days until expiration
                const endDate = moment(entity.end_date);
                const now = moment();
                const daysUntilExpiration = endDate.diff(now, 'days');
            
                // Render the value
                let color = '';
                if (daysUntilExpiration > 0) {
                    color = 'green'; 
                } else if (daysUntilExpiration === 0) {
                    color = 'orange'; 
                } else {
                    color = 'red'; 
                }
            
                return (
                    <span>
                        <Tag color={color}>
                            {daysUntilExpiration > 0
                                ? `${daysUntilExpiration} day(s)`
                                : daysUntilExpiration === 0
                                ? 'Expires today'
                                : 'Expired'}
                        </Tag>
                    </span>
                );
            },
        },
        {
            title: <FormattedMessage id="pages.searchTable.titleStatus" defaultMessage="Status" />,
            dataIndex: 'status',
            valueType: 'text',
            render: (text, record) => {
                let color = '';
                if (text === 'Active') {
                    color = 'green';
                } else {
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
                <FormattedMessage id="pages.searchTable.upgrade" defaultMessage="Upgrade" />
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
                    id: 'pages.searchTable.title1',
                    defaultMessage: 'Subscriptions',
                })}
                actionRef={actionRef}
                rowKey="id"

                search={{
                    labelWidth: 120,
                    //  filterType: 'light', // Use a light filter form for better layout
                }}
                request={async (params, sorter, filter) => {
                    try {
                        const response = await getExpiredSubscriptions(params);
                        const subscriptions = response.data.subscriptions;
            
                        // Filter by provider name
                        const filteredByProvider = params.provider
                            ? subscriptions.filter(subscription =>
                                subscription.provider.name.toLowerCase().includes(params.provider.toLowerCase())
                            )
                            : subscriptions;
            
                        // Filter by package name
                        const filteredByPackage = params.package_name
                            ? filteredByProvider.filter(subscription =>
                                subscription.name.toLowerCase().includes(params.package_name.toLowerCase())
                            )
                            : filteredByProvider;
            
                        return {
                            data: filteredByPackage,
                            success: true,
                        };
                    } catch (error) {
                        console.error('Error fetching filteredSubscriptions data:', error);
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
                    <ProDescriptions<API.ActiveSubscriptionsListItem>
                        column={2}
                        title={currentRow?.name}
                        request={async () => ({
                            data: currentRow || {},
                        })}
                        params={{
                            id: currentRow?.name,
                        }}
                        columns={columns as ProDescriptionsItemProps<API.ActiveSubscriptionsListItem>[]}
                    />
                )}
            </Drawer>
        </PageContainer>
    );
};

export default ActiveSubscriptionsList;
