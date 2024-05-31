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
    ProFormCheckbox,
    ProFormSelect,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl, useModel } from '@umijs/max';
import { Button, Drawer, Tag, message } from 'antd';
import React, { useRef, useState, useEffect } from 'react';

import UpdateForm from './components/UpdateForm';
import { addCommissionAmount, getCommissionAmount, removeCommissionAmount } from './commissionAmountSlice.ts';



const DiscountList: React.FC = () => {

    const [createModalOpen, handleModalOpen] = useState<boolean>(false);

    const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

    const [showDetail, setShowDetail] = useState<boolean>(false);

    const actionRef = useRef<ActionType>();
    const [currentRow, setCurrentRow] = useState<API.DiscountListItem>();
    const [selectedRowsState, setSelectedRows] = useState<API.DiscountListItem[]>([]);
    const [subPackages, setSubPackages] = useState([]);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [packageAmount, setPackageAmount] = useState(null)

    const intl = useIntl();
    const { initialState } = useModel('@@initialState');
    const [loading, setLoading] = useState(false);
    const formRef = useRef();



    const handleAdd = async (formData: FormData) => {

        const payment_for = formData.get('payment_for') as string;
        const amount = formData.get('amount') as string;
        const user_type = formData.get('user_type') as string;

        setLoading(true);
        try {

            const commissionAmount: API.DiscountListItem = {
                payment_for: payment_for,
                amount: parseFloat(amount),
                user_type: user_type,
                created_by: 1

            };

            const hide = message.loading('Loading...');
            try {
                const response = await addCommissionAmount(commissionAmount);

                if (response.status) {
                    hide();
                    setLoading(false);
                    message.success(response.message)
                    formRef.current.resetFields();
                    return true
                } else {
                    message.error(response.message)
                    setLoading(false);
                    return false
                }
            } catch (error) {
                hide();
                setLoading(false);
                message.error('Adding failed, please try again!');
                return false
            }
        } catch (error) {
            message.error('Failed to create data!');
            setLoading(false);
            return false
        }
    };



    const handleRemove = async (selectedRows: API.ProviderListItem[]) => {


        const hide = message.loading('Loading....');
        if (!selectedRows) return true;
        try {
            // console.log('in try and catch');
            const currentUser = initialState?.currentUser;
            const action_by = currentUser?.id;

            const response = await removeCommissionAmount({
                key: selectedRows.map((row) => row.id),
                action_by: action_by,
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
            setLoading(false);
            message.error('Delete failed, please try again');
            return false;
        }
    };



    const columns: ProColumns<API.DiscountListItem>[] = [
        {
            title: (
                <FormattedMessage id="pages.searchTable.titleDesignation" defaultMessage="Amount" />
            ),
            dataIndex: 'amount', // Access nested property
            valueType: 'text',
            render: (dom) => parseFloat(dom).toFixed(2),
            tip: 'Amount',
            search: false,
        },
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.user_type"
                    defaultMessage="To"
                />
            ),
            dataIndex: 'user_type', // Access nested property
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
            search: false,
        },
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.payment_for"
                    defaultMessage="Payment for"
                />
            ),
            dataIndex: 'payment_for',
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
                } else if (text == 'In-active') {
                    color = 'red'
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
                    id="pages.searchTable.updateForm.amountTobePaid"
                    defaultMessage="Active at"
                />
            ),
            dataIndex: 'active_at', // Set correct dataIndex
            valueType: 'text',
            search: false,
        },

        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.activeAt"
                    defaultMessage="Inactive at"
                />
            ),
            dataIndex: 'in-active_at', // Set correct dataIndex
            valueType: 'text',
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
                        const response = await getCommissionAmount(params);
                        const commissions = response.data.commissions;

                        // Filter the data based on the 'name' filter
                        const filteredCommissions = commissions.filter(commission =>
                            params.user_type
                                ? commission.user_type
                                    .toLowerCase()
                                    .includes(params.user_type.toLowerCase())
                                : true
                        );

                        return {
                            data: filteredCommissions,
                            success: true,
                        };
                    } catch (error) {
                        console.error('Error fetching Discounts data:', error);
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
                        type="primary"
                        danger
                    >
                        <FormattedMessage
                            id="pages.searchTable.batchDeletion"
                            defaultMessage="Batch Deletion"
                        />
                    </Button>
                </FooterToolbar>
            )}
            <ModalForm
                title={intl.formatMessage({
                    id: 'pages.searchTable.createForm.subscriptionPackage',
                    defaultMessage: 'Setup Commission Amount',
                })}
                width="400px"
                open={createModalOpen}
                formRef={formRef}
                onOpenChange={handleModalOpen}
                onFinish={async (value) => {
                    const formData = new FormData();
                    formData.append('user_type', value.user_type);
                    formData.append('amount', value.amount);
                    formData.append('payment_for', value.payment_for);

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
                                pattern: /^[0-9]+$/,
                                message: 'Please enter a valid number',
                            },

                        ]}
                        width="md"
                        name="amount"
                        label="Amount"

                    />
                    <ProFormSelect
                        name="user_type"
                        width="md"
                        label={intl.formatMessage({
                            id: 'pages.searchTable.updateForm.user_type',
                            defaultMessage: 'User type',
                        })}
                        valueEnum={{
                            'Client': 'Client',
                            'Provider': 'Provider',
                        }}
                        rules={[
                            {
                                required: true,
                                message: 'Please select User!',
                            },
                        ]}
                    />



                    <ProFormSelect
                        name="payment_for"
                        width="md"
                        label={intl.formatMessage({
                            id: 'pages.searchTable.updateForm.user_type',
                            defaultMessage: 'Payment for',
                        })}
                        valueEnum={{
                            'Registration': 'Registration',
                            'Requests': 'Requests',
                            'Subscription': 'Subscription',
                        }}
                        rules={[
                            {
                                required: true,
                                message: 'Please select User!',
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
                {currentRow?.doc_name && (
                    <ProDescriptions<API.DiscountListItem>
                        column={2}
                        title={currentRow?.doc_name}
                        request={async () => ({
                            data: currentRow || {},
                        })}
                        params={{
                            id: currentRow?.doc_name,
                        }}
                        columns={columns as ProDescriptionsItemProps<API.DiscountListItem>[]}
                    />
                )}
            </Drawer>
        </PageContainer>
    );
};

export default DiscountList;
