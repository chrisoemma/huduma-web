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
import UpdateForm from './components/UpdateForm';
import { addDesignations, getDesignations, getWorkingDocuments, removeDesignation, } from './DesignationSlice';


const DesignationList: React.FC = () => {

    const [createModalOpen, handleModalOpen] = useState<boolean>(false);

    const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

    const [showDetail, setShowDetail] = useState<boolean>(false);

    const actionRef = useRef<ActionType>();
    const [currentRow, setCurrentRow] = useState<API.DesignationListItem>();
    const [selectedRowsState, setSelectedRows] = useState<API.DesignationListItem[]>([]);
    const [Docs,setDocs]=useState([]);

    const intl = useIntl();
    const { initialState } = useModel('@@initialState');

    const [loading, setLoading] = useState(false);
    const formRef = useRef();

    useEffect(() => {
        async function fetchData() {
          try {
            const response = await getWorkingDocuments();
            const docs = response.data.docs;
              console.log('docsss',response)
            setDocs(docs);
            actionRef.current?.reloadAndRest(); // Reload and reset the table state
          } catch (error) {
            console.error('Error fetching permissions data:', error);
          }
        }
    
        fetchData();
      }, []);


     
        const documentOptions = Docs?.map(doc => ({
          label: doc.doc_name,
          value: doc.id,
        }));



    const handleAdd = async (formData: FormData) => {

        const name_en = formData.get('name_en') as string;
        const name_sw = formData.get('name_sw') as string;
       
        const working_documents = formData.getAll('working_documents[]').map(id => parseInt(id, 10));
        try {

            const DesignationData: API.DesignationListItem = {
                name_en: name_en,
                name_sw: name_sw,
                working_documents:working_documents,
                created_by: 1

            };

            // Save the data to the database
            const hide = message.loading('Loading...');
            setLoading(true);
            try {
                const response = await addDesignations(DesignationData);

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
            const currentUser = initialState?.currentUser;
            const action_by = currentUser?.id;
            const response = await removeDesignation({
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



    const columns: ProColumns<API.DesignationListItem>[] = [
        {
            title: (
                <FormattedMessage id="pages.searchTable.titleDesignation" defaultMessage="Professionals" />
            ),
            dataIndex: 'name',
            render: (text, record) => {
                const designation = record.name; 
                if (designation) {
                    return (
                        <>
                            <div style={{ marginBottom: 10 }}>
                                <b>English:</b> {designation.en}
                            </div>
                            <div>
                                <b>Swahili:</b> {designation.sw}
                            </div>
                        </>
                    );
                }
                return '-------';
            },
        },

        {
            title: (
              <FormattedMessage
                id="pages.searchTable.updateForm.Documents"
                defaultMessage="Documents"
              />
            ),
            dataIndex: 'Documents',
            valueType: 'text',
            search:false,
            tip: 'The Name is the unique key',
            render: (dom, entity) => {
              const documentList = entity.documents || [];
              return (
                <span>
                  {documentList.map((document) => (
                    <Tag key={document?.id}>{document?.doc_name}</Tag>
                  ))}
                </span>
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
                        const response = await getDesignations(params);
                        const designations = response.data.designations;

                        console.log('designationsss1234', designations)
                        // Filter the data based on the 'name' filter
                        const filteredDesignations = designations.filter(designation =>
                            params.name
                                ? designation.name.en.toLowerCase().includes(params.name.toLowerCase()) || // Search English name
                                designation.name.sw.toLowerCase().includes(params.name.toLowerCase())
                                : true
                        );

                        return {
                            data: filteredDesignations,
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
                    id: 'pages.searchTable.createForm.designation',
                    defaultMessage: 'Add Designation',
                })}
                width="400px"
                open={createModalOpen}
                formRef={formRef}
                onOpenChange={handleModalOpen}
                onFinish={async (value) => {

                    const formData = new FormData();
                    formData.append('name_en', value.name_en);
                    formData.append('name_sw', value.name_sw);

                    value.working_documents.forEach(docId => {
                        formData.append('working_documents[]', docId);
                      });

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
                                message: 'English Name is required',
                            },
                        ]}
                        width="md"
                        name="name_en"
                        label="English name"
                    />

                    <ProFormText
                        rules={[
                            {
                                required: true,
                                message: 'Kiswahili Name is required',
                            },
                        ]}
                        width="md"
                        name="name_sw"
                        label="Kiswahili name"
                    />

            <ProFormCheckbox.Group
              name="working_documents"
              options={documentOptions}
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
                    <ProDescriptions<API.DesignationListItem>
                        column={2}
                        title={currentRow?.doc_name}
                        request={async () => ({
                            data: currentRow || {},
                        })}
                        params={{
                            id: currentRow?.doc_name,
                        }}
                        columns={columns as ProDescriptionsItemProps<API.DesignationListItem>[]}
                    />
                )}
            </Drawer>
        </PageContainer>
    );
};

export default DesignationList;
