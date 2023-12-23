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
import { Button, Drawer, Image, Input, message } from 'antd';
import React, { useRef, useState, useEffect } from 'react';

//import UpdateForm from './components/UpdateForm';
import { storage } from './../../firebase/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getProviderSubservices } from './SubServiceStatusChangeSlice';


const SubserviceChangeList: React.FC = () => {

    const [createModalOpen, handleModalOpen] = useState<boolean>(false);

    const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

    const [showDetail, setShowDetail] = useState<boolean>(false);

    const actionRef = useRef<ActionType>();
    const [currentRow, setCurrentRow] = useState<API.SubserviceChangeListItem>();
    const [selectedRowsState, setSelectedRows] = useState<API.SubserviceChangeListItem[]>([]);

    const intl = useIntl();

    const [approvalAction, setApprovalAction] = useState<string>(''); // 'approve' or 'reject'
    const [approveModalOpen, handleApproveModalOpen] = useState<boolean>(false);
    const [approveAllModalOpen, handleApproveAllModalOpen] = useState<boolean>(false);


    const handleApprovalModal = (action: string) => {
        setApprovalAction(action);
        handleApprovalModalOpen(true);
    };

    const handleApprovalModalOpen = (isOpen: boolean) => {
        handleApproveModalOpen(isOpen);
    };

    const handleApproveAllModal = (isOpen: boolean) => {
        handleApproveAllModalOpen(isOpen);
    };

    const handleRemove = async (selectedRows: API.SubserviceChangeListItem[]) => {

        const hide = message.loading('Loading....');
        if (!selectedRows) return true;
        try {
            // console.log('in try and catch');
            await removeCategory({
                key: selectedRows.map((row) => row.id),
            });
            hide();
            message.success('Deleted successfully and will refresh soon');
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


    const approvalSubservice = (status) =>{
            
    }



    const handleAdd = async (formData: FormData) => {

        const name = formData.get('name') as string;
        const imageFile = formData.get('image') as File;




        try {
            const storageRef = ref(storage, `images/${imageFile.name}`);

            if (imageFile) {
                const uploadTask = uploadBytesResumable(storageRef, imageFile);

                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log('Upload is ' + progress + '% done');
                        switch (snapshot.state) {
                            case 'paused':
                                console.log('Upload is paused');
                                break;
                            case 'running':
                                console.log('Upload is running');
                                break;
                        }
                    },
                    (error) => {
                        // Handle unsuccessful uploads
                        console.error('Upload error:', error);
                    },
                    async () => {
                        try {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            const categoryData: API.SubserviceChangeListItem = {
                                id: 0, // Set the appropriate ID
                                name: name,
                                img_url: downloadURL, // Save the download URL to the database
                            };

                            // Save the data to the database
                            const hide = message.loading('Loading...');
                            try {
                                await addCategory(categoryData);
                                hide();
                                message.success('Added successfully');
                                return true
                            } catch (error) {
                                hide();
                                message.error('Adding failed, please try again!');
                                return false
                            } finally {
                                handleModalOpen(false);
                                actionRef.current.reload();
                            }
                        } catch (error) {
                            message.error('Error getting download URL, please try again!');
                            return false
                        } finally {
                            handleModalOpen(false);
                        }
                    }
                );
            } else {
                // If no image is uploaded, create an object without img_url
                const categoryData: API.SubserviceChangeListItem = {
                    id: 0, // Set the appropriate ID
                    name: name,
                    img_url: '', // No image URL in this case
                };

                // Save the data to the database
                const hide = message.loading('Loading...');
                try {
                    await addCategory(categoryData);
                    hide();
                    message.success('Added successfully');
                    return true
                } catch (error) {
                    hide();
                    message.error('Adding failed, please try again!');
                    return false
                }
            }
        } catch (error) {
            message.error('Image upload failed, please try again!');
            return false
        }
    };


    const columns: ProColumns<API.SubserviceChangeListItem>[] = [

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
                    defaultMessage="Sub service name"
                />
            ),
            dataIndex: 'name',
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
                    id="pages.searchTable.updateForm.service"
                    defaultMessage="Service"
                />
            ),
            dataIndex: ['service', 'name'],
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
            title: <FormattedMessage id="pages.searchTable.titleImage" defaultMessage="Image" />,
            dataIndex: 'assets',
            hideInSearch: true,
            render: (_, record) => {
                return record.assets.map((image, index) => (
                    <Image
                        key={index}
                        src={image.img_url}
                        alt={`Image ${index + 1}`}
                        style={{ maxWidth: '100px' }}
                    />
                ));
            }
        },

        {
            title: <FormattedMessage id="pages.searchTable.titleStatus" defaultMessage="Status" />,
            dataIndex: 'status',
            search: false,
            hideInForm: true,
            valueEnum: {
                0: {
                    text: (
                        <FormattedMessage
                            id="pages.searchTable.nameStatus.default"
                            defaultMessage="Shut down"
                        />
                    ),
                    status: 'Default',
                },
                1: {
                    text: 'Active',
                    status: 'Active',
                },

            },
        },
        {
            title: <FormattedMessage id="pages.searchTable.titleOption" defaultMessage="Action" />,
            dataIndex: 'option',
            valueType: 'option',
            render: (_, record) => (
                <>
                    <div>
                        <a
                            onClick={() => {
                                handleApprovalModal('Approve');
                                setCurrentRow(record);
                            }}
                        >
                            <FormattedMessage id="pages.searchTable.approve" defaultMessage="Approve" />
                        </a>
                    </div>
                    <div>
                        <a
                            onClick={() => {
                                handleApprovalModal('Reject');
                                // Handle Reject action
                            }}
                        >
                            <FormattedMessage id="pages.searchTable.reject" defaultMessage="Reject" />
                        </a>
                    </div>
                    <div>
                        <a
                            onClick={() => {
                                // Handle Reject action
                                handleApproveAllModal(true);
                                setCurrentRow(record);
                            }}
                        >
                            <FormattedMessage id="pages.searchTable.reject" defaultMessage="Approve for all" />
                        </a>
                    </div>
                </>
            ),
        }

    ];

    return (
        <PageContainer>
            <ProTable
                //key={categories.length}
                headerTitle={intl.formatMessage({
                    id: 'pages.searchTable.title',
                    defaultMessage: 'Enquiry form',
                })}
                actionRef={actionRef}
                rowKey="id"

                search={{
                    labelWidth: 120,
                    //  filterType: 'light', // Use a light filter form for better layout
                }}
                request={async (params, sorter, filter) => {
                    try {
                        const response = await getProviderSubservices(params);
                        const subservices = response.data.sub_services;
                        // Filter the data based on the 'name' filter
                        console.log('subservices', subservices);

                        const filteredSubservices = subservices.filter(subservice =>
                            params.name
                                ? subservice.name
                                    .toLowerCase()
                                    .split(' ')
                                    .some(word => word.startsWith(params.name.toLowerCase()))
                                : true
                        );

                        return {
                            data: filteredSubservices,
                            success: true,
                        };
                    } catch (error) {
                        console.error('Error fetching filteredSubservices data:', error);
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
                    >
                        <FormattedMessage
                            id="pages.searchTable.batchDeletion"
                            defaultMessage="Batch deletion"
                        />
                    </Button>
                    {/* <Button type="primary">
            <FormattedMessage
              id="pages.searchTable.batchApproval"
              defaultMessage="Batch approval"
            />
          </Button> */}
                </FooterToolbar>
            )}

            <ModalForm
                title={`${approvalAction === 'Approve' ? 'Approve' : 'Reject'} Subservice`}
                width="400px"
                visible={approveModalOpen}
                onVisibleChange={handleApprovalModalOpen}
                onFinish={async () => {
                    console.log(`${approvalAction}ing...`);
                    handleApprovalModalOpen(false); 
                }}
            >
                <p>{`Are you sure you want to ${approvalAction} this?`}</p>
            </ModalForm>

            <ModalForm
                title="Approve All Subservices"
                width="600px"
                visible={approveAllModalOpen}
                onVisibleChange={handleApproveAllModal}
                onFinish={async (values) => {
                    // Handle approve all logic
                    console.log('Approving All:', values);
                    handleApproveAllModal(false); // Close the modal after submission
                }}
            >
                {/* Add form fields for approving all, e.g., an image upload and a text area */}
                <ProFormUploadButton
                    name="newImage"
                    label="Upload New Image"
                    fieldProps={{
                        accept: 'image/*',
                        max: 1,
                        listType: 'picture-card',
                        title: 'Click or Drag to Upload',
                        placeholder: 'Click or Drag to Upload',
                    }}
                />
                <ProFormTextArea
                    name="description"
                    label="Description"
                    placeholder="Enter description..."
                />
                {/* Add other fields or components as needed */}
            </ModalForm>


            <ModalForm
                title={intl.formatMessage({
                    id: 'pages.searchTable.createForm.newCategory',
                    defaultMessage: 'Service',
                })}
                width="400px"
                open={createModalOpen}
                onOpenChange={handleModalOpen}
                onFinish={async (value) => {
                    const formData = new FormData();
                    formData.append('name', value.name);
                    if (value.image) {
                        formData.append('image', value.image[0].originFileObj);
                    }

                    const success = await handleAdd(formData);

                    if (success) {
                        handleModalOpen(false);
                        if (actionRef.current) {
                            actionRef.current.reload();
                        }
                    }
                }}
            >
                <ProForm.Group>
                    <ProFormText
                        rules={[
                            {
                                required: true,
                                message: 'Name is required',
                            },
                        ]}
                        width="md"
                        name="name"
                        label="Name"
                    />
                    <ProFormUploadButton
                        name="image"
                        label="Upload Image"
                        style={{ display: 'none' }}
                        fieldProps={{
                            accept: 'image/*',
                            max: 1,
                            listType: 'picture-card',
                            title: 'Click or Drag to Upload', // Custom title
                            placeholder: 'Click or Drag to Upload', // Custom placeholder
                        }}
                        onChange={(fileList) => {
                            // Handle file list changes if needed
                            // console.log('File List:', fileList);
                        }}
                    />
                </ProForm.Group>
            </ModalForm>
     

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
                    <ProDescriptions<API.SubserviceChangeListItem>
                        column={2}
                        title={currentRow?.name}
                        request={async () => ({
                            data: currentRow || {},
                        })}
                        params={{
                            id: currentRow?.name,
                        }}
                        columns={columns as ProDescriptionsItemProps<API.SubserviceChangeListItem>[]}
                    />
                )}
            </Drawer>
        </PageContainer>
    );
};

export default SubserviceChangeList;
