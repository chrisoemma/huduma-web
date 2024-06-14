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
import { addDiscount, getDiscounts, removeDiscount } from './DiscountSlice';
import { getPackages } from '../SubscriptionPackageList/SubscriptionPackageSlice';


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
    const currentUser = initialState?.currentUser;
    const action_by = currentUser?.id
    const [loading, setLoading] = useState(false);
    const formRef = useRef();



    useEffect(() => {
        async function fetchData() {
            try {
                const response = await getPackages();
                const packages = response.data.packages;
                console.log('packages', response)
                setSubPackages(packages);
            } catch (error) {
                console.error('Error fetching permissions data:', error);
            }
        }

        fetchData();
    }, []);



    const handlePackageChange = (value) => {


        const selectedPackage = subPackages.find(subpackage => subpackage.id == value);

        setSelectedPackage(selectedPackage);
        setPackageAmount(selectedPackage ? selectedPackage.amount : null);
    };


    const handleAdd = async (formData: FormData) => {

        const subpackage = formData.get('package') as string;
        const amount = formData.get('amount') as string;
        const duration = formData.get('duration') as string;
        const name = formData.get('name') as string;

        setLoading(true);

        try {

            const PackageData: API.DiscountListItem = {
                package: subpackage,
                amount: parseFloat(amount),
                duration: duration,
                name:name,
                created_by: action_by

            };

       
            const hide = message.loading('Loading...');
            try {
                const response = await addDiscount(PackageData);

                if (response.status) {
                    hide();
                    setLoading(false);
                    message.success(response.message)
                    formRef.current.resetFields();
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
            setLoading(false);
            message.error('Failed to create data!');
            return false
        }
    };



    const handleRemove = async (selectedRows: API.ProviderListItem[]) => {


        const hide = message.loading('Loading....');
        if (!selectedRows) return true;
        try {
            // console.log('in try and catch');

            const response = await removeDiscount({
                key: selectedRows.map((row) => row.id),
                action_by: action_by,
                deleted_by:action_by
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



    const columns: ProColumns<API.DiscountListItem>[] = [
        {
            title: (
                <FormattedMessage id="pages.searchTable.titleDesignation" defaultMessage="Package name" />
            ),
            dataIndex:  'name', // Access nested property
            valueType: 'text',
            tip: 'Package Name',
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
                    defaultMessage="Package Amount"
                />
            ),
            dataIndex: ['package', 'amount'], // Access nested property
            valueType: 'text',
            render: (dom) => parseFloat(dom).toFixed(2),
            search: false,
        },
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.discount"
                    defaultMessage="Discount"
                />
            ),
            dataIndex: 'amount',
            valueType: 'text',
            render: (dom) => parseFloat(dom).toFixed(2),
            search: false,
        },
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.amountTobePaid"
                    defaultMessage="Amount to be paid"
                />
            ),
            dataIndex: 'amountToBePaid', // Set correct dataIndex
            valueType: 'text',
            render: (_, record) => {
                const amountToBePaid = parseFloat(record?.package?.amount) - parseFloat(record?.amount);
                const formattedAmount = amountToBePaid?.toFixed(2);
                return <strong>{formattedAmount}</strong>;
            },
            search: false,
        },
        
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.duration"
                    defaultMessage="Duration (Months)"
                />
            ),
            dataIndex: 'duration',
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
                        const response = await getDiscounts(params);
                        const discounts = response.data.discounts;

                        // Filter the data based on the 'name' filter
                        const filteredDiscounts = discounts.filter(discount =>
                            params.name
                                ? discount.package.name
                                    .toLowerCase()
                                    .includes(params.name.toLowerCase())
                                : true
                        );

                        return {
                            data: filteredDiscounts,
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
                    defaultMessage: 'Add Subscription Package',
                })}
                width="400px"
                open={createModalOpen}
                onOpenChange={handleModalOpen}
                formRef={formRef}
                onFinish={async (value) => {
                    const formData = new FormData();
                    formData.append('package', value.package);
                    formData.append('amount', value.amount);
                    formData.append('duration', value.duration);
                    formData.append('name', value.name);

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
                    <ProFormSelect
                        name="package"
                        width="md"
                        label={intl.formatMessage({
                            id: 'pages.searchTable.updateForm.package',
                            defaultMessage: 'Subscription Package',
                        })}
                        valueEnum={subPackages.reduce((enumObj, subPackage) => {
                            enumObj[subPackage.id] = subPackage.name;
                            return enumObj;
                        }, {})}
                        rules={[
                            {
                                required: true,
                                message: 'Please select Package!',
                            },
                        ]}
                        onChange={handlePackageChange} // Add onChange handler
                    />

                    {selectedPackage && ( // Render package amount if package is selected
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ color: 'green' }}>Package Amount: </label>
                            <span style={{ fontWeight: 'bold' }}>{selectedPackage?.amount}</span>
                        </div>
                    )}


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
                                required: true,
                                pattern: /^[0-9]+$/,
                                message: 'Please enter a valid number',
                            },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || !getFieldValue('package')) {
                                        return Promise.resolve();
                                    }
                                    if (Number(value) > Number(selectedPackage.amount)) {
                                        return Promise.reject(new Error('Discount cannot be greater than package amount'));
                                    }
                                    return Promise.resolve();
                                },
                            }),
                        ]}
                        width="md"
                        name="amount"
                        label="Discount"


                    />
                    <ProFormText
                        rules={[
                            {
                                required: true,
                                pattern: /^[0-9]+$/,
                                message: 'Please enter a valid number',
                            },
                        ]}
                        width="md"
                        name="duration"
                        label="Duration (Months)"
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
