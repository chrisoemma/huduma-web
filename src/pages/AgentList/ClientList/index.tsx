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
    PageLoading,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl, useModel, useParams } from '@umijs/max';
import { Button, Drawer, Image, Input, Tag, message, Form } from 'antd';
import React, { useRef, useState, useEffect } from 'react';
//import type { FormValueType } from './components/UpdateForm';
// import UpdateForm from './components/UpdateForm';
// import { storage } from './../../firebase/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
//import { addClient, getClients, removeClient } from './ClientsSlice';
import { formatErrorMessages, showErrorWithLineBreaks, validateTanzanianPhoneNumber } from '@/utils/function';
//import { getNida, validateNida } from '../NidaSlice';
import { getAgentClients } from '../AgentSlice';
import { addClient, removeClient } from '@/pages/ClientsList/ClientsSlice';
import { getNida, validateNida } from '@/pages/NidaSlice';
import { storage } from '@/firebase/firebase';
import UpdateForm from '@/pages/ClientsList/components/UpdateForm';



const ClientList: React.FC = () => {

    const [createModalOpen, handleModalOpen] = useState<boolean>(false);

    const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

    const [showDetail, setShowDetail] = useState<boolean>(false);

    const { id } = useParams();

    const actionRef = useRef<ActionType>();
    const [currentRow, setCurrentRow] = useState<API.ClientListItem>();
    const [selectedRowsState, setSelectedRows] = useState<API.ClientListItem[]>([]);
    const [clients, setClients] = useState([]);
    const [showNidaValidationDrawer, setShowNidaValidationDrawer] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);

    const intl = useIntl();
    const [form] = ProForm.useForm();
    const [validationResult, setValidationResult] = useState(null);
    const { Item } = Form;
    const { initialState } = useModel('@@initialState');


      const handleRemove = async (selectedRows: API.ClientListItem[]) => {


        const hide = message.loading('Loading....');
        if (!selectedRows) return true;
        try {
          // console.log('in try and catch');
          const currentUser = initialState?.currentUser;
                const  action_by=currentUser?.id;
            const response=  await removeClient({
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

    const handleNidaValidationDrawerOpen = () => {
        setShowNidaValidationDrawer(true);
    };

    const handleNidaValidationDrawerClose = () => {
        setValidationResult(null);
        setShowNidaValidationDrawer(false);

    };

    const handleNidaChecking = async (nida) => {
        try {
          setLoading(true); // Set loading to true when starting the operation
    
          const nidaValidationData = {
            status: '',
            user_type: 'Client',
          };
    
          const response = await getNida(nida);
    
          if (response.error) {
            // Case 1: Validation error
            setValidationResult({ error: response.obj.error });
          } else if (response.obj.error) {
            // Case 2: NIDA number does not exist
            nidaValidationData.status = 'A.Invalid';
    
            const nidaResponse = await validateNida(currentRow?.id, nidaValidationData);
            actionRef.current?.reloadAndRest();
          
            setValidationResult({ error: 'NIDA Number does not exist' });
          } else if (response.obj.result) {
            // Case 3: Successful NIDA number validation
            const { FIRSTNAME, MIDDLENAME, SURNAME, SEX, DateofBirth } = response.obj.result;
    
            // Update state with successful result
            nidaValidationData.status = 'A.Valid';
            const nidaResponse = await validateNida(currentRow?.id, nidaValidationData);
            actionRef.current?.reloadAndRest();
            setValidationResult({ result: response.obj.result });
          }
    
          return response;
        } catch (error) {
          console.error(error);
          setValidationResult({ error: 'Failed to perform NIDA checking' });
          return { error: 'Failed to perform NIDA checking' };
        } finally {
          setLoading(false); // Set loading to false when the operation is done (whether success or error)
        }
      };


    const getStatusColor = (status) => {
        switch (status) {
            case 'S.Valid':
            case 'A.Valid':
                return 'green';
            case 'S.Invalid':
            case 'A.Invalid':
                return 'red';
            case 'A.Pending':
            case 'S.Pending':
                return 'orange';
            default:
                return 'gray';
        }
    };


    const handleAdd = async (formData: FormData) => {
        const name = formData.get('name') as string;
        const phone = formData.get('phone') as string;
        const newphone = validateTanzanianPhoneNumber(phone);
        const email = formData.get('email') as string;
        const imageFile = formData.get('image') as File;
        const nida = formData.get('nida') as string;
        const currentUser = initialState?.currentUser;

        let userData: API.ClientListItem = {
            id: 0, // Set the appropriate ID
            name: name,
            nida: nida,
            email: email,
            phone: newphone,
            profile_img: '',
            action_by:currentUser?.id
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
            userData = {
                ...userData,
                profile_img: downloadURL,
            };

            // Add user data to the database
            const hide = message.loading('Loading...');
            try {
                const response = await addClient(userData);
                if (response.status) {
                    hide();
                    message.success(response.message);
                    return true;
                } else {
                    if (response.data) {
                        const errors = response.data.errors;
                        showErrorWithLineBreaks(formatErrorMessages(errors));
                    } else {
                        message.error(response.message);
                    }
                }
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
                const response = await getAgentClients(id);
                const clients = response.data.clients.clients;

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
            dataIndex: ['user', 'phone'],
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
                // Get the last status from the nida_statuses array
                const lastStatus = entity.nida_statuses?.[entity.nida_statuses.length - 1]?.status;

                let tagColor;
                switch (lastStatus) {
                    case 'S.Valid':
                    case 'A.Valid':
                        tagColor = 'green';
                        break;
                    case 'S.Invalid':
                    case 'A.Invalid':
                        tagColor = 'red';
                        break;
                    case 'A.Pending':
                    case 'S.Pending':
                        tagColor = 'orange';
                        break;
                    default:
                        tagColor = 'gray';
                        break;
                }

                return (
                    <div>
                        <a
                            onClick={() => {
                                setCurrentRow(entity);
                                setShowDetail(true);
                            }}
                        >
                            {dom}
                        </a>
                        {lastStatus && <Tag style={{ marginLeft: '5px', backgroundColor: tagColor }}>{lastStatus}</Tag>}
                    </div>
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
                let color = '';
                if (text == 'Active' || text == 'Approved') {
                    color = 'green';
                } else if (text == 'In Active') {
                    text = 'Pending';
                    color = 'yellow'
                } else if (text == 'Deactivated' || text == 'Suspended') {
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
                        const response = await getAgentClients(id);
                        const clients = response.data.clients.clients;

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
                    // formData.append('first_name', value.first_name)
                    // formData.append('last_name', value.last_name)
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
                                message: 'Name is required',
                            },
                        ]}
                        width="md"
                        name="name"
                        label="Name"
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
                                    const validCountryCodes = ['255', '254', '256', '250', '257']; // Add more as needed

                                    // Check if the phone number has a valid length and starts with either a leading zero or a valid country code
                                    const isValid = validCountryCodes.some(code => {
                                        const countryCodeLength = code.length;
                                        return (
                                            (phoneNumber.length === 10 && phoneNumber.startsWith('0')) ||
                                            (phoneNumber.length === 12 && phoneNumber.startsWith(code))
                                        );
                                    });

                                    if (!isValid) {
                                        return Promise.reject('Invalid phone number format');
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
                        name="email"
                        label={intl.formatMessage({
                            id: 'pages.searchTable.updateForm.email',
                            defaultMessage: 'Email',
                        })}
                        width="md"
                        rules={[

                            {
                                type: 'email',
                                message: 'Please enter a valid email address!',
                            },
                        ]}
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

                <Button style={{ marginLeft: 20 }} type="primary" onClick={handleNidaValidationDrawerOpen}>
                    Validate NIDA
                </Button>
                <Button style={{ marginLeft: 20 }} type="primary" onClick={handleNidaValidationDrawerOpen}>
                    Requests
                </Button>
            </Drawer>

            <Drawer
                width={400}
                title="Validate NIDA Number"
                placement="right"
                onClose={handleNidaValidationDrawerClose}
                visible={showNidaValidationDrawer}
                destroyOnClose
            >
                <Form>
                    {validationResult && (
                        <div style={{ marginTop: 20 }}>
                            {validationResult.error ? (
                                <Tag color="red">Error: {validationResult.error}</Tag>
                            ) : (
                                <div>
                                    <Tag color="green" style={{ fontWeight: 'bold' }}>
                                        NIDA Validation Successful!
                                    </Tag>
                                    <p>First Name: {validationResult.result.FIRSTNAME}</p>
                                    <p>Middle Name: {validationResult.result.MIDDLENAME}</p>
                                    <p> Last Name: {validationResult.result.SURNAME}</p>
                                    {/* Add more fields as needed */}
                                </div>
                            )}
                        </div>
                    )}
                    <p>The NIDA status is : <Tag color={getStatusColor(currentRow?.nida_statuses?.[currentRow?.nida_statuses.length - 1]?.status)}>{currentRow?.nida_statuses?.[currentRow?.nida_statuses.length - 1]?.status}</Tag></p>
                    <Item
                        label="NIDA Number"
                        name="nidaNumber"
                        initialValue={currentRow?.nida || ''}
                        rules={[
                            {
                                required: true,
                                message: 'Please enter NIDA Number',
                            },
                        ]}
                    >
                        <Input
                            value={currentRow?.nida || ''}
                            disabled

                        />
                    </Item>

        <Button type="primary" onClick={() => handleNidaChecking(currentRow?.nida)} disabled={loading}>
        {loading ? 'Validating...' : 'Validate NIDA'}
      </Button>
      {loading && <PageLoading />}
                    <div style={{ marginTop: 20 }}>
                        <p>This NIDA has passed through the following statuses:</p>
                        {currentRow?.nida_statuses?.map((status, index) => (
                            <Tag key={index} color={getStatusColor(status.status)}>
                                {status.status}
                            </Tag>
                        ))}
                    </div>
                </Form>

            </Drawer>
        </PageContainer>
    );
};

export default ClientList;