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
//import type { FormValueType } from './components/UpdateForm';
import UpdateForm from './components/UpdateForm';
import { storage } from './../../firebase/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addClient, getClients } from './ClientsSlice';


const ClientList: React.FC = () => {

    const [createModalOpen, handleModalOpen] = useState<boolean>(false);

    const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

    const [showDetail, setShowDetail] = useState<boolean>(false);

    const actionRef = useRef<ActionType>();
    const [currentRow, setCurrentRow] = useState<API.ClientListItem>();
    const [selectedRowsState, setSelectedRows] = useState<API.ClientListItem[]>([]);
    const [clients, setClients] = useState([]);

    const intl = useIntl();
    const [form] = ProForm.useForm();


    //   const handleRemove = async (selectedRows: API.ClientListItem[]) => {


    //     const hide = message.loading('Loading....');
    //     if (!selectedRows) return true;
    //     try {
    //       // console.log('in try and catch');
    //       await removeCategory({
    //         key: selectedRows.map((row) => row.id),
    //       });
    //       hide();
    //       message.success('Deleted successfully and will refresh soon');
    //       if (actionRef.current) {
    //         console.log('invoking this which is null')
    //         actionRef.current.reloadAndRest();
    //       }
    //       return true;
    //     } catch (error) {
    //       hide();
    //       message.error('Delete failed, please try again');
    //       return false;
    //     }
    //   };

    const handleAdd = async (formData: FormData) => {
        const first_name = formData.get('first_name') as string;
        const last_name = formData.get('last_name') as string;
        const phone = formData.get('phone') as string;
        const email = formData.get('email') as string;
        const imageFile = formData.get('image') as File;
        const nida = formData.get('nida') as string;
      
        let clientData: API.ClientListItem = {
          id: 0, // Set the appropriate ID
          first_name: first_name,
          last_name: last_name,
          nida: nida,
          email: email,
          phone: phone,
          profile_img: '',
        };
      
        const uploadImage = async () => {
          if (imageFile) {
            const storageRef = ref(storage, `profile/${imageFile.name}`);
            const uploadTask = uploadBytesResumable(storageRef, imageFile);
      
            return new Promise<string>((resolve, reject) => {
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
                  reject(error);
                },
                async () => {
                  try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                  } catch (error) {
                    reject(error);
                  }
                }
              );
            });
          } else {
            return Promise.resolve('');
          }
        };
      
        try {
          const downloadURL = await uploadImage();
          clientData = {
            ...clientData,
            profile_img: downloadURL,
          };
      
          // Add client data to the database
          const hide = message.loading('Loading...');
          try {
            await addClient(clientData);
            hide();
            message.success('Added successfully');
            return true;
          } catch (error) {
            hide();
            message.error('Adding failed, please try again!');
            return false;
          } finally {
            handleModalOpen(false);
            actionRef.current.reload();
          }
        } catch (error) {
          message.error('Image upload failed, please try again!');
          return false;
        }
      };
      


    useEffect(() => {
        async function fetchData() {
            try {
                const response = await getClients();
                const clients = response.data.clients;
             
                setClients(clients);
                actionRef.current?.reloadAndRest(); 
            } catch (error) {
                console.error('Error fetching Clients data:', error);
            }
        }

        fetchData();
    }, []);



    const columns: ProColumns<API.ClientListItem>[] = [
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.ruleName.clientName"
                    defaultMessage="Client Name"
                />
            ),
            dataIndex: 'name',
            valueType: 'text',
            tip: 'The Client Name',
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
                    id="pages.searchTable.updateForm.phone"
                    defaultMessage="Phone"
                />
            ),
            dataIndex: ['user','phone'],
            valueType: 'text',
            tip: 'The phone number is unique',
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
                    id="pages.searchTable.updateForm.nida"
                    defaultMessage="NIDA"
                />
            ),
            dataIndex: 'nida',
            valueType: 'text',
            tip: 'The NIDA number is unique',
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
                    id="pages.searchTable.updateForm.email"
                    defaultMessage="Email"
                />
            ),
            dataIndex: ['user', 'email'],
            valueType: 'text',
            tip: 'The Email is unique',
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
                    id="pages.searchTable.updateForm.ruleName.location"
                    defaultMessage="Location"
                />
            ),
            dataIndex: 'location',
            valueType: 'text',
            tip: 'Location',
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
            title: <FormattedMessage id="pages.searchTable.profilePhoto" defaultMessage="Profile photo" />,
            dataIndex: ['user', 'profile_img'],
            hideInSearch: true,
            render: (_, record) => {
                const profileImage = record.user.profile_img;
                return (
                    <Image
                        src={profileImage ? profileImage : ''}
                        alt="Profile Image"
                        style={{ maxWidth: '100px' }}
                    />
                );
            },
        },

        {
            title: <FormattedMessage id="pages.searchTable.titleStatus" defaultMessage="Status" />,
            dataIndex: 'status',
            hideInForm: true,
            render: (text, record) => {
                        let color='';
                        if(text=='Active' || text=='Approved'){
                           color='green';
                        }else if(text=='In Active'){
                             text='Pending';
                             color='yellow'
                        }else if(text=='Deactivated'|| text=='Suspended'){
                            color='red';
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
                </a>
             

            ],
        },
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
                    filterType: 'light', // Use a light filter form for better layout
                }}
                request={async (params, sorter, filter) => {
                    try {
                        const response = await getClients();
                        const clients = response.data.clients;

                        // Filter the data based on the search parameters
                        const filteredClients = clients.filter(client => {
                            return (
                                (params.name ? client.name.toLowerCase().includes(params.name.toLowerCase()) : true) &&
                                (params.phone ? client.phone.toLowerCase().includes(params.phone.toLowerCase()) : true) &&
                                (params.nida ? client.nida.toLowerCase().includes(params.nida.toLowerCase()) : true) &&
                                (params.email ? client.user.email.toLowerCase().includes(params.email.toLowerCase()) : true) &&
                                (params.location ? client.location.toLowerCase().includes(params.location.toLowerCase()) : true) &&
                                (params.status ? client.status.toLowerCase().includes(params.status.toLowerCase()) : true)
                            );
                        });

                        return {
                            data: filteredClients,
                            success: true,
                        };
                    } catch (error) {
                        console.error('Error fetching clients data:', error);
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
                            // await handleRemove(selectedRowsState);
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
              form={form}
                title={intl.formatMessage({
                    id: 'pages.searchTable.createForm.newClient',
                    defaultMessage: 'New Client',
                })}
                width="400px"
                open={createModalOpen}
                onOpenChange={handleModalOpen}
                onFinish={async (value) => {
                    const formData = new FormData();
                    formData.append('name', value.name);
                    formData.append('first_name', value.first_name)
                    formData.append('last_name', value.last_name)
                    formData.append('phone', value.phone);
                    formData.append('email', value.email);
                    formData.append('nida', value.nida);
                    if (value.image) {
                        formData.append('image', value.image[0].originFileObj);
                    }

                    const success = await handleAdd(formData);

                    if (success) {
                        form.resetFields();
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
                                message: 'First Name is required',
                            },
                        ]}
                        width="md"
                        name="first_name"
                        label="First Name"
                    />
                    <ProFormText
                        rules={[
                            {
                                required: true,
                                message: 'Last Name is required',
                            },
                        ]}
                        width="md"
                        name="last_name"
                        label="Last Name"
                    />

                    <ProFormText
                        rules={[
                            {
                                required: true,
                                message: 'Phone number is required',
                            },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    const phoneNumber = value.replace(/\D/g, ''); // Remove non-numeric characters
                                    const isLengthValid = phoneNumber.length === 10 || phoneNumber.length === 12;

                                    if (!isLengthValid) {
                                        return Promise.reject('Phone number must be 10 or 12 digits long');
                                    }

                                    return Promise.resolve();
                                },
                            }),
                        ]}
                        width="md"
                        name="phone"
                        label="Phone"
                    />

                    <ProFormText
                        rules={[
                            {
                                message: 'Email is required',
                            },
                        ]}
                        width="md"
                        name="email"
                        label="Email"
                    />

                    <ProFormText
                        rules={[

                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    const nida = value.replace(/\D/g, '');
                                    const isLengthValid = nida.length === 20;

                                    if (!isLengthValid) {
                                        return Promise.reject('NIDA must be 20 numbers');
                                    }

                                    return Promise.resolve();
                                },
                            }),
                        ]}
                        width="md"
                        name="nida"
                        label="NIDA"
                    />
                    <ProFormUploadButton
                        name="image"
                        label="Profile photo"
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
                {currentRow?.name && (
                    <ProDescriptions<API.ClientListItem>
                        column={2}
                        title={currentRow?.name}
                        request={async () => ({
                            data: currentRow || {},
                        })}
                        params={{
                            id: currentRow?.name,
                        }}
                        columns={columns as ProDescriptionsItemProps<API.ClientListItem>[]}
                    />
                )}
            </Drawer>
        </PageContainer>
    );
};

export default ClientList;
