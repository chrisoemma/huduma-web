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
import { FormattedMessage, useIntl, useModel } from '@umijs/max';
import { Button, Drawer, Image, Input, Tag, message, Form, Modal } from 'antd';
import React, { useRef, useState, useEffect } from 'react';
//import type { FormValueType } from './components/UpdateForm';
import UpdateForm from './Components/UpdateForm';
import { storage } from './../../firebase/firebase';
import { history } from 'umi';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addAgent, getAgents, removeAgent } from './AgentSlice';
import { formatErrorMessages, showErrorWithLineBreaks, validateTanzanianPhoneNumber } from '@/utils/function';
import { getNida, request_nida_from_api, validateNida } from '../NidaSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles.css'
import moment from 'moment';


const AgentList: React.FC = () => {

    const [createModalOpen, handleModalOpen] = useState<boolean>(false);

    const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

    const [showDetail, setShowDetail] = useState<boolean>(false);
    const actionRef = useRef<ActionType>();
    const [currentRow, setCurrentRow] = useState<API.AgentListItem>();
    const [selectedRowsState, setSelectedRows] = useState<API.AgentListItem[]>([]);
    const [agents, setAgents] = useState([]);
    const [showNidaValidationDrawer, setShowNidaValidationDrawer] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);
    const intl = useIntl();
    const [form] = ProForm.useForm();
    const formRef = useRef();
    const navigate = useNavigate();

    const [validationResult, setValidationResult] = useState(null);
    const { Item } = Form;
    const { initialState } = useModel('@@initialState');
    const location = useLocation();
    const navigateToId = location?.state?.navigateToId;
    const tableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (navigateToId && tableRef.current) {
            const interval = setInterval(() => {
                const rowElement = tableRef.current.querySelector(`[data-row-id="${navigateToId}"]`);

                if (rowElement) {

                    clearInterval(interval); // Stop searching once the row is found
                    rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    rowElement.classList.add('highlighted-row');
                    setTimeout(() => rowElement.classList.remove('highlighted-row'), 5000); // Remove after 5 seconds
                }
            }, 100); // Check every 100ms

            // Clean up interval on unmount or on navigateToId change
            return () => clearInterval(interval);
        }
    }, [navigateToId]);

    const getRowClassName = (record) => {
        return record.id === navigateToId ? 'highlighted-row' : '';
    };

    const handleViewDocs = () => {

        if (history) {
            const route = `/user-management/agents/documents/agent/${currentRow?.id}`;
            history.push(route);
        }
    };


    //  console.log('business data',currentBusinessesData);
    const handleRemove = async (selectedRows: API.ProviderListItem[]) => {

        const hide = message.loading('Loading....');
        if (!selectedRows) return true;
        try {
            // console.log('in try and catch');
            const currentUser = initialState?.currentUser;
            const action_by = currentUser?.id;
            const response = await removeAgent({
                key: selectedRows.map((row) => row.id),
                action_by: action_by,
            });

            hide();
            message.success('Deleted successfully');
            if (actionRef.current) {
                //  console.log('invoking this which is null')
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
            setLoading(true);

            const nidaValidationData = {
                status: '',
                user_type: 'Agent',
            };

            const nidaData = {
                nida: nida
            }

            const response = await request_nida_from_api(nidaData);

            if (response.error) {
                setValidationResult({ error: response.obj.error });
            } else if (response.obj.error) {
                setValidationResult({ error: 'NIDA Number does not exist' });
                actionRef.current?.reloadAndRest();
            } else if (response.obj.result) {
                actionRef.current?.reloadAndRest();
                setValidationResult({ result: response.obj.result });
            }

            return response;
        } catch (error) {
            console.error(error);
            setValidationResult({ error: 'Failed to perform NIDA checking' });
            return { error: 'Failed to perform NIDA checking' };
        } finally {
            setLoading(false);
        }
    };



    const handleNidaApproval = async (value) => {

        Modal.confirm({
            title: `Are you sure you want to ${value.toLowerCase()} this`,
            okText: 'Yes',
            cancelText: 'No',
            onOk: async () => {

                try {
                    const nidaValidationData = {
                        status: '',
                        user_type: 'Agent',
                    };

                    setLoading(true);
                    let dataMessage = ''
                    if (value == 'Reject') {
                        nidaValidationData.status = 'A.Invalid';
                        dataMessage = 'Rejected successfully'
                    } else {
                        nidaValidationData.status = 'A.Valid';
                        dataMessage = 'Approved successfully'
                    }

                    const nidaResponse = await validateNida(currentRow?.id, nidaValidationData);
                    message.success(dataMessage);
                    actionRef.current?.reloadAndRest();

                } catch (error) {
                    console.error(error);
                    return { error: 'Failed to perform NIDA checking' };
                } finally {
                    setLoading(false);
                }

            }
        });

    }


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
        const first_name = formData.get('first_name') as string;
        const last_name = formData.get('last_name') as string;
        const phone = formData.get('phone') as string;
        const newphone = validateTanzanianPhoneNumber(phone);
        const email = formData.get('email') as string;
        const imageFile = formData.get('image') as File;
        const nida = formData.get('nida') as string;

        const currentUser = initialState?.currentUser;
        setLoading(true);


        let agentData: API.AgentListItem = {
            first_name: first_name,
            last_name: last_name,
            nida: nida,
            email: email,
            phone: newphone,
            profile_img: '',
            action_by: currentUser?.id
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
                            //   console.log('Upload is ' + progress + '% done');
                            switch (snapshot.state) {
                                case 'paused':
                                    //  console.log('Upload is paused');
                                    break;
                                case 'running':
                                    // console.log('Upload is running');
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
            agentData = {
                ...agentData,
                profile_img: downloadURL,
            };

            // Add agent data to the database
            const hide = message.loading('Loading...');
            try {


                const response = await addAgent(agentData);
                if (response.status) {
                    setLoading(false);
                    hide();
                    message.success(response.message);
                    return true;
                } else {
                    setLoading(false);
                    if (response.data) {
                        const errors = response.data.errors;
                        showErrorWithLineBreaks(formatErrorMessages(errors));
                    } else {
                        setLoading(false);
                        message.error(response.message);
                    }
                }
            } catch (error) {
                setLoading(false);
                hide();
                message.error('Adding failed, please try again!');
                return false;
            } finally {
                handleModalOpen(false);
                setLoading(false);
                actionRef.current.reload();
            }
        } catch (error) {
            setLoading(false);
            message.error('Image upload failed, please try again!');
            return false;
        }
    };


    useEffect(() => {
        async function fetchData() {
            try {
                const response = await getAgents();
                const agents = response.data.agents;

                setAgents(agents);
                actionRef.current?.reloadAndRest(); // Reload and reset the table state
            } catch (error) {
                console.error('Error fetching Agents data:', error);
            }
        }

        fetchData();
    }, []);


    const handleViewCommissions = () => {

        if (history) {
            // Assuming you have a route named '/documents/:providerId'
            const route = `/user-management/agents/commisions/${currentRow?.id}`;
            history.push({
                pathname: route,
                state: { agentName: currentRow?.name }, // Pass your values here
            });
        }
    }

    const handleViewClients = () => {

        if (history) {
            // Assuming you have a route named '/documents/:providerId'
            const route = `/user-management/agents/clients/${currentRow?.id}`;
            history.push({
                pathname: route,
                // state: { agentName: currentRow?.name }, // Pass your values here
            });
        }
    }

    const handleViewProviders = () => {

        if (history) {
            // Assuming you have a route named '/documents/:providerId'
            const route = `/user-management/agents/providers/${currentRow?.id}`;
            history.push({
                pathname: route,
                // state: { agentName: currentRow?.name }, // Pass your values here
            });
        }
    }

    const columns: ProColumns<API.AgentListItem>[] = [
        {
            title: <FormattedMessage id="pages.searchTable.titleClientNumber" defaultMessage="Number" />,
            dataIndex: ['user', 'reg_number'],
            hideInForm: true,
            search: {
                name: 'reg_number'
            },
        },
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.ruleName.agentName"
                    defaultMessage="Agent Name"
                />
            ),
            dataIndex: 'name',
            valueType: 'text',
            tip: 'The Agent Name',
            render: (dom, entity) => {

                return (
                    <a
                        data-row-id={entity.id}
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
                // Check if phone_verified_at is null or not
                //console.log('entitiees',entity);
                const verifiedTag = entity?.user?.phone_verified_at ? (
                    <Tag color="green"> Verified</Tag>
                ) : (
                    <Tag color="red">Not Verified</Tag>
                );

                return (
                    <>
                        {dom}
                        {' '}
                        {verifiedTag}

                    </>
                );
            },
            search: {
                name: 'phone'
            },
        },

        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.nida"
                    defaultMessage="NIDA"
                />
            ),
            dataIndex: ['user', 'nida'],
            valueType: 'text',
            tip: 'The NIDA number is unique',
            render: (dom, entity) => {
                // Get the last status from the nida_statuses array
                const lastStatus = entity?.user?.nida_statuses?.[entity?.user?.nida_statuses.length - 1]?.status;

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
            search: {
                name: 'nida'
            },
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
            search: false,
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
            search: false,
        },
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.ruleName.nameDeatails"
                    defaultMessage="Created At"
                />
            ),
            dataIndex: 'created_at',
            valueType: 'text',
            render: (text) => moment(text).format('DD/MM/YYYY h:mm A'),
        },
        {
            title: <FormattedMessage id="pages.searchTable.profilePhoto" defaultMessage="Profile photo" />,
            dataIndex: ['user', 'profile_img'],
            search: false,
            hideInSearch: true,
            render: (_, record) => {

                const profileImage = record?.user?.profile_img;
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
            search: false,
            hideInForm: true,
            render: (text, record) => {
                let color = '';
                if (text == 'Active' || text == 'Approved') {
                    color = 'green';
                } else if (text == 'Pending approval') {
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
            search: false,

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
            <div
                ref={tableRef}
                style={{ overflowY: 'auto' }}>
                <ProTable
                    rowClassName={getRowClassName}
                    scroll={{ x: 1200 }}


                    pagination={{
                        pageSizeOptions: ['15', '30', '60', '100'],
                        defaultPageSize: 30,
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
                        filterType: 'query', // Use a light filter form for better layout
                    }}
                    request={async (params, sorter, filter) => {
                        try {
                            const response = await getAgents(params);
                            const agents = response.data.agents;

                            // Filter the data based on the search parameters
                            const filteredAgents = agents.filter(agent => {
                                const matchesNumber = params['users.reg_number']
                                    ? agent.users.reg_number?.toLowerCase().includes(params['reg_number'].toLowerCase())
                                    : true;
                                const matchesagentName = params.name
                                    ? agent.name?.toLowerCase().includes(params.name.toLowerCase())
                                    : true;
                                const matchesPhone = params['users.phone']
                                    ? agent.users.phone?.toLowerCase().includes(params['users.phone'].toLowerCase())
                                    : true;

                                const matchesNida = params['users.nida']
                                    ? agent.users.nida?.toLowerCase().includes(params['users.nida'].toLowerCase())
                                    : true;

                                return matchesNumber && matchesagentName && matchesPhone && matchesNida;
                            });

                            return {
                                data: filteredAgents,
                                success: true,
                            };
                        } catch (error) {
                            // console.error('Error fetching agents data:', error);
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
            </div>
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
                        type="primary"
                        danger
                        onClick={async () => {

                            await handleRemove(selectedRowsState);
                            setSelectedRows([]);
                            actionRef.current?.reload();
                        }}
                    >
                        <FormattedMessage
                            id="pages.searchTable.batchDeletion"
                            defaultMessage="Batch Deletion"
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
                    id: 'pages.searchTable.createForm.newAgent',
                    defaultMessage: 'New Agent',
                })}
                width="400px"
                open={createModalOpen}
                onOpenChange={handleModalOpen}
                formRef={formRef}
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
                    <ProDescriptions<API.AgentListItem>
                        column={2}
                        title={currentRow?.name}
                        request={async () => ({
                            data: currentRow || {},
                        })}
                        params={{
                            id: currentRow?.name,
                        }}
                        columns={columns as ProDescriptionsItemProps<API.AgentListItem>[]}
                    />
                )}
                <Button type="primary" onClick={handleViewDocs}>
                    View Docs
                </Button>

                <Button style={{ margin: 20 }} type="primary" onClick={handleNidaValidationDrawerOpen}>
                    Validate NIDA
                </Button>
                <Button style={{ margin: 20, }} type="primary" onClick={handleViewCommissions}>
                    Commisions History
                </Button>
                <Button style={{ margin: 20, }} type="primary" onClick={handleViewProviders}>
                    Providers
                </Button>
                <Button style={{ margin: 20, }} type="primary" onClick={handleViewClients}>
                    Clients
                </Button>
            </Drawer>


            <Drawer
                width={600}
                title="Validate NIDA Number"
                placement="right"
                onClose={handleNidaValidationDrawerClose}
                visible={showNidaValidationDrawer}
                destroyOnClose
            >
                <Form layout="vertical">
                    {!validationResult && (
                        <div style={{ marginBottom: 20 }}>
                            <h3>User Input Informations</h3>
                            <p>Phone Number: {currentRow?.phone || 'N/A'}</p>
                            <p>First Name: {currentRow?.first_name || 'N/A'}</p>
                            <p>Last Name: {currentRow?.last_name || 'N/A'}</p>
                        </div>
                    )}

                    {validationResult?.error && (
                        <div style={{ marginBottom: 20 }}>
                            <Tag color="red">Error: {validationResult.error}</Tag>
                            <h3> User Input Informations</h3>
                            <p>Phone Number: {currentRow?.phone || 'N/A'}</p>
                            <p>First Name: {currentRow?.first_name || 'N/A'}</p>
                            <p>Last Name: {currentRow?.last_name || 'N/A'}</p>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
                        <Item
                            label="NIDA Number"
                            name="nidaNumber"
                            initialValue={currentRow?.nida || ''}
                            style={{ flex: 1 }}
                            rules={[
                                {
                                    required: true,
                                    message: 'Please enter NIDA Number',
                                },
                            ]}
                        >
                            <Input value={currentRow?.nida || ''} disabled />
                        </Item>

                        <Button
                            type="primary"
                            onClick={() => handleNidaChecking(currentRow?.nida)}
                            disabled={loading}
                        >
                            {loading ? 'Validating...' : 'Validate NIDA'}
                        </Button>
                    </div>
                    {loading && <PageLoading />}

                    {/* Validation Result and Comparison */}
                    {validationResult && (
                        <div style={{ marginTop: 20 }}>
                            {validationResult.error ? (
                                <Tag color="red">Error: {validationResult.error}</Tag>
                            ) : (
                                <>
                                    <Tag color="green" style={{ fontWeight: 'bold' }}>
                                        NIDA Validation Successful!
                                    </Tag>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                                        {/* Current User Details */}
                                        <div>
                                            <h4>Provider Input Details</h4>
                                            <p>First Name: {currentRow?.first_name || 'N/A'}</p>
                                            <p>Last Name: {currentRow?.last_name || 'N/A'}</p>
                                            <p>Phone Number: {currentRow?.phone || 'N/A'}</p>
                                        </div>

                                        {/* NIDA Details */}
                                        <div>
                                            <h4>NIDA Details</h4>
                                            <p>First Name: {validationResult.result.FIRSTNAME}</p>
                                            <p>Last Name: {validationResult.result.SURNAME}</p>
                                            <p>Phone Number: {validationResult.result.PHONE || 'N/A'}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Admin Actions */}
                    <div style={{ marginTop: 20, display: 'flex', gap: '10px' }}>
                        <Button
                            style={{ background: "red", borderColor: "red" }}
                            type="primary"
                            onClick={() => { handleNidaApproval('Reject') }}
                            disabled={loading}
                        >
                            {loading ? 'Rejecting...' : 'Reject'}
                        </Button>
                        <Button type="primary"
                            onClick={() => { handleNidaApproval('Approve') }}
                            disabled={loading}
                        >
                            {loading ? 'Approving...' : 'Approve'}
                        </Button>
                    </div>

                    {/* NIDA Status Stages */}
                    <div style={{ marginTop: 20 }}>
                        <h4>NIDA Status History</h4>
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

export default AgentList;
