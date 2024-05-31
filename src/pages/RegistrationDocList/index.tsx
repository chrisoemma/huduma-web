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
    ProFormSelect,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Drawer, Tag, message } from 'antd';
import React, { useRef, useState, useEffect } from 'react';
import UpdateForm from './components/UpdateForm';
import { addRegistrationDoc, getRegistrationDoc, updateRegistrationDoc, updateRegistrationDocStatus } from './RegistrationDocSlice';
import { providerDesignationDoc } from '../ProviderDocsList/ProviderDocsSlice';


const RegistrationDocList: React.FC = () => {

    const [createModalOpen, handleModalOpen] = useState<boolean>(false);

    const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

    const [showDetail, setShowDetail] = useState<boolean>(false);

    const actionRef = useRef<ActionType>();
    const [currentRow, setCurrentRow] = useState<API.RegistrationDocListItem>();
    const [selectedRowsState, setSelectedRows] = useState<API.RegistrationDocListItem[]>([]);

    const intl = useIntl();
    const [loading, setLoading] = useState(false);
    const formRef = useRef();


    const handleStatus = async (selectedRows: API.RegistrationDocListItem[],status) => {

        const hide = message.loading('Loading....');
        if (!selectedRows) return true;
        try {
            // console.log('in try and catch');
          const response=  await updateRegistrationDocStatus({
               document_ids: selectedRows.map((row) => row.id),
                status:status
            });
            hide();
            message.success(response.message);
            // if (actionRef.current) {
            //     console.log('invoking this which is null')
            //     actionRef.current.reloadAndRest();
            // }
         //   return true;
        } catch (error) {
            hide();
            message.error('Delete failed, please try again');
            return false;
        }
    };





    const handleAdd = async (formData: FormData) => {

        const doc_name = formData.get('doc_name') as string;
       const type = formData.get('type');
       setLoading(true);
        try {

            const RegistrationDoc: API.RegistrationDocListItem = {
                doc_name: doc_name,
                type:type,
                created_by: 1

            };

            // Save the data to the database
            const hide = message.loading('Loading...');
            try {
                const response = await addRegistrationDoc(RegistrationDoc);

                if (response.status) {
                    hide();
                    message.success(response.message)
                    setLoading(false);
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
            setLoading(false);
            message.error('Failed to create data!');
            return false
        }
    };



    const columns: ProColumns<API.RegistrationDocListItem>[] = [
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.docName"
                    defaultMessage="Document Name"
                />
            ),
            dataIndex: 'doc_name',
            valueType: 'text',
            tip: 'The Doc Name is the unique key',
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
                    id="pages.searchTable.updateForm.docType"
                    defaultMessage="Document Type"
                />
            ),
            dataIndex: 'type',
            valueType: 'text',
            tip: 'The Doc Type',
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
                } else if (text == 'In Active') {
                    color = 'orange'
                } else if (text == 'Deleted') {
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
                        const response = await getRegistrationDoc(params);
                        const docs = response.data.docs;

                        console.log('docsss1234', docs)
                        // Filter the data based on the 'name' filter
                        const filteredDocs = docs.filter(doc =>
                            params.name
                                ? doc.doc_name
                                    .toLowerCase()
                                    .split(' ')
                                    .some(word => word.startsWith(params.doc_name.toLowerCase()))
                                : true
                        );

                        return {
                            data: filteredDocs,
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
                        await handleStatus(selectedRowsState,'Deleted');
                        setSelectedRows([]);
                        actionRef.current?.reload();
                    }}
                    type="primary"
                    danger
                >
                    <FormattedMessage
                        id="pages.searchTable.batchDeletion"
                        defaultMessage="Batch deletion"
                    />
                </Button>
                <Button type="primary"
                style={{ background: "orange", borderColor: "yellow" }}
                      onClick={async () => {
                        await handleStatus(selectedRowsState,'In Active');
                        setSelectedRows([]);
                        actionRef.current?.reload();
                    }}
                >
                    <FormattedMessage
                        id="pages.searchTable.batchDeactivate"
                        defaultMessage="Batch Deactivate"
                    />
                </Button>
                <Button type="primary"
                style={{ background: "green", borderColor: "green" }}
                    onClick={async () => {
                        await handleStatus(selectedRowsState,'Active');
                        setSelectedRows([]);
                        actionRef.current?.reload();
                    }}
                >
                    <FormattedMessage
                        id="pages.searchTable.batchActivate"
                        defaultMessage="Batch Activate"
                    />
                </Button>
            </FooterToolbar>
            )}
            <ModalForm
                title={intl.formatMessage({
                    id: 'pages.searchTable.createForm.docName',
                    defaultMessage: 'Add Document',
                })}
                width="400px"
                open={createModalOpen}
                onOpenChange={handleModalOpen}
                formRef={formRef}
                onFinish={async (value) => {
                    const formData = new FormData();
                    formData.append('doc_name', value.doc_name);
                    formData.append('type', value.type);

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
                                message: 'Doc Name is required',
                            },
                        ]}
                        width="md"
                        name="doc_name"
                        label="Doc name"
                    />

                    <ProFormSelect
                        name="type"
                        width="md"
                        label={intl.formatMessage({
                            id: 'pages.searchTable.updateForm.type',
                            defaultMessage: 'Choose document Type',
                        })}
                        valueEnum={{
                            'Registration': 'Registration',
                            'Bussiness': 'Business',
                        }}
                        rules={[
                            {
                                required: true,
                                message: 'Please select doc type!',
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
                    <ProDescriptions<API.RegistrationDocListItem>
                        column={2}
                        title={currentRow?.doc_name}
                        request={async () => ({
                            data: currentRow || {},
                        })}
                        params={{
                            id: currentRow?.doc_name,
                        }}
                        columns={columns as ProDescriptionsItemProps<API.RegistrationDocListItem>[]}
                    />
                )}
            </Drawer>
        </PageContainer>
    );
};

export default RegistrationDocList;
