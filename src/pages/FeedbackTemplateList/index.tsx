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
import { addFeedbackTemplate, getFeedbackTemplates, removeFeedbackTemplate } from './FeedbackTemplateSlice';



const FeedbackTemplateList: React.FC = () => {

    const [createModalOpen, handleModalOpen] = useState<boolean>(false);

    const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

    const [showDetail, setShowDetail] = useState<boolean>(false);

    const actionRef = useRef<ActionType>();
    const [currentRow, setCurrentRow] = useState<API.FeedbackTemplateListItem>();
    const [selectedRowsState, setSelectedRows] = useState<API.FeedbackTemplateListItem[]>([]);
  

    const intl = useIntl();
    const { initialState } = useModel('@@initialState');
    const currentUser = initialState?.currentUser;
    const action_by = currentUser?.id
    const [loading, setLoading] = useState(false);
    const formRef = useRef();

    let templateActions=[
        {
            id:'Cancelled',
            name:'Cancel'
        },
        {
            id:'Rejected',
            name:'Reject'
        },
        {
            id:'Completed',
            name:'Complete'
        }
    ]

    let resources=[
        {
            id:'Client',
            name:'Client'
        },
        {
            id:'Provider',
            name:'Provider'
        },
        {
            id:'Client & Provider',
            name:'Client & Provider'
        },
        {
            id:'Agent',
            name:'Agent'
        },
        {
            id:'Internal',
            name:'Internal'
        },
        {
            id:'Other',
            name:'Other'
        },
    ]





    const handleAdd = async (formData: FormData) => {

        const reason = formData.get('reason') as string;
        const action = formData.get('action') as string;
        const resource = formData.get('resource') as string;
 

        setLoading(true);

        try {

            const feedbackTemplate: API.FeedbackTemplateListItem = {
                action: action,
                reason: reason,
                created_by: action_by,
                resource:resource

            };
 
       
            const hide = message.loading('Loading...');
            try {
                const response = await addFeedbackTemplate(feedbackTemplate);

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

            const response = await removeFeedbackTemplate({
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



    const columns: ProColumns<API.FeedbackTemplateListItem>[] = [
        {
            title: (
                <FormattedMessage id="pages.searchTable.action" defaultMessage="Action" />
            ),
            dataIndex:  'action', // Access nested property
            valueType: 'text',
            tip: 'Action',
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
                <FormattedMessage id="pages.searchTable.reason" defaultMessage="Reason" />
            ),
            dataIndex:  'reason', // Access nested property
            valueType: 'text',
            tip: 'Reason',
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
            title: (
                <FormattedMessage id="pages.searchTable.reason" defaultMessage="User Type" />
            ),
            dataIndex:  'resource', // Access nested property
            valueType: 'text',
            tip: 'User Type',
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
            title: <FormattedMessage id="pages.searchTable.titleStatus" defaultMessage="Status" />,
            dataIndex: 'status',
            hideInForm: true,
            search: false,
            render: (text, record) => {
                let color = '';
                if (text == 'Active') {
                    color = 'green';
                } else if (text == 'In-Active') {
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
                        const response = await getFeedbackTemplates(params);
                        const templates = response.data.templates;

                        // Filter the data based on the 'name' filter
                        const filteredTemplates = templates.filter(template =>
                            params.action
                                ? template.action
                                    .toLowerCase()
                                    .includes(params.action.toLowerCase())
                                : true
                        );

                        return {
                            data: filteredTemplates,
                            success: true,
                        };
                    } catch (error) {
                        console.error('Error fetching Templates data:', error);
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
                    id: 'pages.searchTable.createForm.feedbackTemplate',
                    defaultMessage: 'Add feedback template',
                })}
                width="400px"
                open={createModalOpen}
                onOpenChange={handleModalOpen}
                formRef={formRef}
                onFinish={async (value) => {
                    const formData = new FormData();
                    formData.append('action', value.action);
                    formData.append('reason', value.reason);
                    formData.append('resource',value.resource);
                 

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
                        name="action"
                        width="md"
                        label={intl.formatMessage({
                            id: 'pages.searchTable.updateForm.selectAction',
                            defaultMessage: 'Select Action',
                        })}
                        valueEnum={templateActions.reduce((enumObj, action) => {
                            enumObj[action.id] = action.name;
                            return enumObj;
                        }, {})}
                        rules={[
                            {
                                required: true,
                                message: 'Please select Action!',
                            },
                        ]}
                   
                    />



                      <ProFormText
                        rules={[
                            {
                                required: true,
                                message: 'Reason is required',
                            },
                        ]}
                        width="md"
                        name="reason"
                        label="Reason"
                    />


                       <ProFormSelect
                        name="resource"
                        width="md"
                        label={intl.formatMessage({
                            id: 'pages.searchTable.updateForm.selectResource',
                            defaultMessage: 'Select User Tpe',
                        })}
                        valueEnum={resources.reduce((enumObj, resource) => {
                            enumObj[resource.id] = resource.name;
                            return enumObj;
                        }, {})}
                        rules={[
                            {
                                required: true,
                                message: 'Please Select User Type!',
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
                {currentRow?.action && (
                    <ProDescriptions<API.FeedbackTemplateListItem>
                        column={2}
                        title={currentRow?.action}
                        request={async () => ({
                            data: currentRow || {},
                        })}
                        params={{
                            id: currentRow?.action,
                        }}
                        columns={columns as ProDescriptionsItemProps<API.FeedbackTemplateListItem>[]}
                    />
                )}
            </Drawer>
        </PageContainer>
    );
};

export default FeedbackTemplateList;
