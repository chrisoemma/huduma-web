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
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl, useModel } from '@umijs/max';
import { Button, Drawer, Tag, message } from 'antd';
import React, { useRef, useState, useEffect } from 'react';
import { addPackage, getPackages, removePackage } from './SubscriptionPackageSlice';
import UpdateForm from './components/UpdateForm';


const SubscriptionPackageList: React.FC = () => {

    const [createModalOpen, handleModalOpen] = useState<boolean>(false);

    const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

    const [showDetail, setShowDetail] = useState<boolean>(false);

    const actionRef = useRef<ActionType>();
    const [currentRow, setCurrentRow] = useState<API.SubscriptionPackageListItem>();
    const [selectedRowsState, setSelectedRows] = useState<API.SubscriptionPackageListItem[]>([]);
    const [Docs, setDocs] = useState([]);

    const intl = useIntl();
    const { initialState } = useModel('@@initialState');
    
  const [loading, setLoading] = useState(false);
  const formRef = useRef();



    const handleAdd = async (formData: FormData) => {

        const name = formData.get('name') as string;
        const amount = formData.get('amount') as string;

        setLoading(true);
        try {

            const PackageData: API.SubscriptionPackageListItem = {
                name: name,
                amount: parseFloat(amount),
                created_by: 1

            };

           
            const hide = message.loading('Loading...');
            try {
                const response = await addPackage(PackageData);

                if (response.status) {
                    setLoading(false);
                    formRef.current.resetFields();
                    hide();
                    message.success(response.message)
                    return true
                } else {
                    setLoading(false);
                    message.error(response.message)
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
             
            const response = await removePackage({
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
            message.error('Delete failed, please try again');
            return false;
        }
    };



    const columns: ProColumns<API.SubscriptionPackageListItem>[] = [
        {
            title: (
                <FormattedMessage id="pages.searchTable.titleDesignation" defaultMessage="Package name" />
            ),
            dataIndex: 'name',
            valueType: 'text',
            tip: 'The Subscription Name',
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
                    id="pages.searchTable.updateForm.amountTobePaid"
                    defaultMessage="Amount"
                />
            ),
            dataIndex: 'amount',
            valueType: 'text',
            render: (_, entity) => {
                const amount = parseFloat(entity.amount).toFixed(2);
                return (
                    <a
                        onClick={() => {
                            setCurrentRow(entity);
                            setShowDetail(true);
                        }}
                    >
                        {amount}
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
                        const response = await getPackages(params);
                        const packages = response.data.packages;

                        console.log('packages', packages)
                        // Filter the data based on the 'name' filter
                        const filteredPackages = packages.filter(subpackage =>
                            params.name
                                ? subpackage.name
                                    .toLowerCase()
                                    .split(' ')
                                    .some(word => word.startsWith(params.name.toLowerCase()))
                                : true
                        );

                        return {
                            data: filteredPackages,
                            success: true,
                        };
                    } catch (error) {
                        console.error('Error fetching Designation data:', error);
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
                    {/* <Button type="primary"
                        onClick={async () => {
                            //  await handleStatus(selectedRowsState,'In Active');
                            setSelectedRows([]);
                            actionRef.current?.reload();
                        }}
                    >
                        <FormattedMessage
                            id="pages.searchTable.batchDeactivate"
                            defaultMessage="Batch deactivate"
                        />
                    </Button>
                    <Button type="primary"
                        onClick={async () => {
                            //  await handleStatus(selectedRowsState,'Active');
                            setSelectedRows([]);
                            actionRef.current?.reload();
                        }}
                    >
                        <FormattedMessage
                            id="pages.searchTable.batchActivate"
                            defaultMessage="Batch activate"
                        />
                    </Button> */}
                </FooterToolbar>
            )}
            <ModalForm
                title={intl.formatMessage({
                    id: 'pages.searchTable.createForm.subscriptionPackage',
                    defaultMessage: 'Add Subscription Package',
                })}
                width="400px"
                open={createModalOpen}
                formRef={formRef}
                onOpenChange={handleModalOpen}
                onFinish={async (value) => {

                    const formData = new FormData();
                    formData.append('name', value.name);
                    formData.append('amount', value.amount);

                    //   console.log('form dataaa',formData);

                    //   return 
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
                                message: 'Package Name is required',
                            },
                        ]}
                        width="md"
                        name="name"
                        label="Package name"
                    />

                    <ProFormText
                        rules={[
                            {
                                pattern: /^[0-9]+$/,
                                message: 'Please enter a valid number',
                            },
                        ]}
                        width="md"
                        name="amount"
                        label="Amount"
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
                    <ProDescriptions<API.SubscriptionPackageListItem>
                        column={2}
                        title={currentRow?.doc_name}
                        request={async () => ({
                            data: currentRow || {},
                        })}
                        params={{
                            id: currentRow?.doc_name,
                        }}
                        columns={columns as ProDescriptionsItemProps<API.SubscriptionPackageListItem>[]}
                    />
                )}
            </Drawer>
        </PageContainer>
    );
};

export default SubscriptionPackageList;
