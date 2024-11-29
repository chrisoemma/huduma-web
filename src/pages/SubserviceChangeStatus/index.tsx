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
import { Button, Drawer, Form, Image, Input, Tag, message } from 'antd';
import React, { useRef, useState, useEffect } from 'react';

//import UpdateForm from './components/UpdateForm';
import { storage } from './../../firebase/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { changeStatus, getProviderSubservices } from './SubServiceStatusChangeSlice';


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


    const [fileList, setFileList] = useState<any[]>([]);

// Make sure that fileList is always an array before using it
const handleFileChange = ({ fileList: newFileList }: any) => {
    setFileList(newFileList || []);  // Ensure fileList is an array
};


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


    const [form] = Form.useForm();

useEffect(() => {
  if (currentRow) {
    form.setFieldsValue({
      name_en: currentRow.name?.en || "",
      name_sw: currentRow.name?.sw || "",
      description_en: currentRow.description?.en || "",
      description_sw: currentRow.description?.sw || "",
      
    });
  }
}, [currentRow]);

     const handleApproval  = async (status)=>{

        const hide = message.loading('Loading...');
        try {
            const statusChangeData= {
                status:status
            }

            console.log('row selected',currentRow?.id)
            console.log('status change',statusChangeData);
            const response= await changeStatus(currentRow.id,statusChangeData);

            console.log('responceeee',response)
            hide();
            message.success('Status successfully changed');
            return true
        } catch (error) {
            hide();
            message.error('Status change failed, please try again!');
            return false
        } finally {
            handleModalOpen(false);
            actionRef.current.reload();
        }
          
     }


    const handleApprovalAll = async (formData: FormData) => {

        const description = formData.get('description') as string;
        const name = formData.get('name') as string;
        const imageFile = formData.get('img_url') as File;
    
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
                            const statusChangeData: API.SubserviceChangeListItem = {
                                id: 0,
                                description: description,
                                name:name,
                                img_url: downloadURL, 
                                status:'Approve all'
                            };
                                     
                            const hide = message.loading('Loading...');
                            try {
                                await changeStatus(currentRow.id,statusChangeData);
                                hide();
                                message.success('Status successfully changed');
                                return true
                            } catch (error) {
                                hide();
                                message.error('Status change failed, please try again!');
                                return false
                            } finally {
                                handleApproveAllModalOpen(false);
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
              
                        <div>
                            {dom}
                        </div>
                    
                );
            },
        },

        {
            title: (
              <FormattedMessage
                id="pages.searchTable.updateForm.business"
                defaultMessage="Business"
              />
            ),
            dataIndex: 'service',
            valueType: 'text',
            render: (_, entity) => {
              const serviceName = entity.service?.name?.en || entity.service?.name?.sw || '-';
              return (
                <span>
                  {serviceName}
                </span>
              );
            },
            search: true,
          },

          {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.subService"
                    defaultMessage="Service"
                />
            ),
            dataIndex: 'name',
            search: false,
            valueType: 'text',
            render: (dom, entity) => {
                const serviceName = entity.name;
                if (serviceName) {
                    return (
                        <a
                            onClick={() => {
                                setCurrentRow(entity);
                                setShowDetail(true);
                            }}
                        >
                            <div style={{ marginBottom: 10 }}>
                                <b>English:</b> {serviceName.en || 'N/A'}
                            </div>
                            <div>
                                <b>Swahili:</b> {serviceName.sw || 'N/A'}
                            </div>
                        </a>
                    );
                }
                return '-------';
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
            render: (text, record) => {
                let color = '';
                if (text == 'Pending') {
                    color = 'orange';
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
                                setCurrentRow(record);
                            }}
                        >
                            <FormattedMessage id="pages.searchTable.reject" defaultMessage="Reject" />
                        </a>
                    </div>
                    {/* <div>
                        <a
                            onClick={() => {
                               
                                handleApproveAllModal(true);
                                setCurrentRow(record);
                            }}
                        >
                            <FormattedMessage id="pages.searchTable.reject" defaultMessage="Approve for all" />
                        </a>
                    </div> */}
                </>
            ),
        }

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
                        const response = await getProviderSubservices(params);
                        const subservices = response.data.sub_services;
                        // Filter the data based on the 'name' filter
                        //console.log('subservices', subservices);
                        console.log('subservices123',subservices);
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

            <ModalForm
                title={`${approvalAction === 'Approve' ? 'Approve' : 'Reject'} Service`}
                width="400px"
                visible={approveModalOpen}
                onVisibleChange={handleApprovalModalOpen}
                onFinish={async () => {
                    console.log(`${approvalAction}ing...`);
                    handleApprovalModalOpen(false);
                   const status= approvalAction=='Approve'?'Accepted':'Rejected';
                    handleApproval(status)
                }}
            >
                <p>{`Are you sure you want to ${approvalAction} this?`}</p>
            </ModalForm>

            <ModalForm
                title="Approve All Services"
                width="600px"
                visible={approveAllModalOpen}
                onVisibleChange={handleApproveAllModal}
                initialValues={{
                    name_en: currentRow?.name?.en || '',
                    name_sw: currentRow?.name?.sw || '',
                    description_en: currentRow?.description?.en || '',
                    description_sw: currentRow?.description?.sw || '',
                    img_url: currentRow?.assets?.[0]?.img_url,
                }}
                onFinish={async (value) => {
                    const formData = new FormData();
                    formData.append('description', value.description);
                    formData.append('name', value.name);
                    if (value.img_url) {
                        formData.append('img_url', value.img_url[0].originFileObj);
                    }

                    const success = await handleApprovalAll(formData);

                    if (success) {
                        handleApproveAllModalOpen(false);
                        if (actionRef.current) {
                            actionRef.current.reload();
                        }
                    }
                }}
            >

        <ProFormText
            rules={[
              {
                required: true,
                message: 'English Name is required',
              },
            ]}
            width="md"
            name="name_en"
            label="Please enter name, if you wish  to change name of this sub service"
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
            label="Tafadhali ingiza jina,kama unatakata kubadilisha jina huduma"
          />
                
        {/* <ProFormTextArea
                    name="description"
                    label="Description"
                    placeholder="Enter description..."
                /> */}

           <ProFormTextArea
            name="description_en"
            width="md"
            label={intl.formatMessage({
              id: 'pages.searchTable.updateForm.description_eng',
              defaultMessage: 'English Description',
            })}
            placeholder={intl.formatMessage({
              id: 'pages.searchTable.updateForm.ruleDesc.descPlaceholder',
              defaultMessage: 'Description in English',
            })}
            rules={[
              {
                required: true,
                message: 'Please enter the description!',
                min: 5,
              },
            ]}
          />

          <ProFormTextArea
            name="description_sw"
            width="md"
            label={intl.formatMessage({
              id: 'pages.searchTable.updateForm.description_sw',
              defaultMessage: 'Kiswahili Description',
            })}
            placeholder={intl.formatMessage({
              id: 'pages.searchTable.updateForm.ruleDesc.descPlaceholder',
              defaultMessage: 'Description in Kiswahili',
            })}
            rules={[
              {
                required: true,
                message: 'Please enter the description!',
                min: 5,
              },
            ]}
          />
{/* <ProFormUploadButton
  name="img_url"
  label="Upload New Image"
  fieldProps={{
    accept: 'image/*',
    max: 1,
    listType: 'picture-card',
    title: 'Click or Drag to Upload',
    placeholder: 'Click or Drag to Upload',
    onChange: handleFileChange, 
  }}
/> */}
                {/* Add other fields or components as needed */}
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
