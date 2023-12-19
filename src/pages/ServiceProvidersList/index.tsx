import { PlusOutlined, StarOutlined } from '@ant-design/icons';
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
import { Button, Drawer, Image, Input, Tag, message, Form } from 'antd';
import React, { useRef, useState, useEffect } from 'react';
//import type { FormValueType } from './components/UpdateForm';
import UpdateForm from './Components/UpdateForm';
import { storage } from './../../firebase/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addProvider, fetchBusinessesData, getProviders } from './ServiceProviderSlice';
import { history } from 'umi';
import { formatErrorMessages, showErrorWithLineBreaks, validateNIDANumber, validateTanzanianPhoneNumber } from '@/utils/function';
import { getNida } from '../NidaSlice';


const ProviderList: React.FC = () => {

    const [createModalOpen, handleModalOpen] = useState<boolean>(false);

    const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

    const [showDetail, setShowDetail] = useState<boolean>(false);

    const actionRef = useRef<ActionType>();
    const [currentRow, setCurrentRow] = useState<API.ProviderListItem>();
    const [selectedRowsState, setSelectedRows] = useState<API.ProviderListItem[]>([]);
    const [providers, setProvider] = useState([]);
    const [showBusinessesDrawer, setShowBusinessesDrawer] = useState<boolean>(false);
    const [currentBusinessesData, setCurrentBusinessesData] = useState([])
    const [showNidaValidationDrawer, setShowNidaValidationDrawer] = useState<boolean>(false);
    const [validationResult, setValidationResult] = useState(null);

    const intl = useIntl();
    const [form] = ProForm.useForm();
    const { Item } = Form;


    //console.log('business data',currentBusinessesData);
    //   const handleRemove = async (selectedRows: API.ProviderListItem[]) => {


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


    const handleNidaValidationDrawerOpen = () => {
        setShowNidaValidationDrawer(true);
    };

    const handleNidaValidationDrawerClose = () => {
        setValidationResult(null);
        setShowNidaValidationDrawer(false);

    };

    const handleNidaChecking = async (nida) => {
        try {
            const response = await getNida(nida);

            if (response.error) {
                // Case 1: Validation error
                console.log(`Validation Error: ${response.obj.error}`);
                setValidationResult({ error: response.obj.error });
            } else if (response.obj.error) {
                // Case 2: NIDA number does not exist
                console.log(`NIDA Number does not exist: ${response.obj.error}`);
                setValidationResult({ error: response.obj.error });
            } else if (response.obj.result) {
                // Case 3: Successful NIDA number validation
                const {
                    FIRSTNAME,
                    MIDDLENAME,
                    SURNAME,
                    SEX,
                    DateofBirth,
                } = response.obj.result;

                // Update state with successful result
                setValidationResult({ result: response.obj.result });
            }

            return response;
        } catch (error) {
            console.error(error);
            setValidationResult({ error: 'Failed to perform NIDA checking' });
            return { error: 'Failed to perform NIDA checking' };
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




    const handleViewDocs = () => {
        if (history) {
            // Assuming you have a route named '/documents/:providerId'
            const route = `/documents/provider/${currentRow?.id}`;
            history.push(route);
        }
    };


    const handleViewEmployees = () => {
        if (history) {
            // Assuming you have a route named '/documents/:providerId'
            const route = `/employees/provider/${currentRow?.id}`;
            history.push(route);
        }
    }

    const handleBusinessesDrawerOpen = async (provider) => {
        // Check if the drawer is closed
        if (!showBusinessesDrawer) {
            try {
                // Fetch businesses data for the selected provider
                const response = await fetchBusinessesData(provider.id);  // Implement a function to fetch data
                const businessesData = response.data.businesses;

                // Set the fetched data and open the drawer
                setCurrentBusinessesData(businessesData);
                setCurrentRow(provider);
                setShowBusinessesDrawer(true);
            } catch (error) {
                console.error('Error fetching businesses data:', error);
            }
        } else {
            // If the drawer is already open, just update the current row
            setCurrentRow(provider);
        }
    };

    const calculateAverageRating = (ratings) => {
        if (!ratings || ratings.length === 0) {
            return 0;
        }

        const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
        return totalRating / ratings.length;
    };




    const handleAdd = async (formData: FormData) => {
        const first_name = formData.get('first_name') as string;
        const last_name = formData.get('last_name') as string;
        const phone = formData.get('phone') as string;
        const newphone = validateTanzanianPhoneNumber(phone);
        const email = formData.get('email') as string;
        const imageFile = formData.get('image') as File;
        const nida = formData.get('nida') as string;

        let providerData: API.ProviderListItem = {
            id: 0, // Set the appropriate ID
            first_name: first_name,
            last_name: last_name,
            nida: nida,
            email: email,
            phone: newphone,
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
            providerData = {
                ...providerData,
                profile_img: downloadURL,
            };

            // Add provider data to the database
            const hide = message.loading('Loading...');
            try {
                const response = await addProvider(providerData);
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
                const response = await getProviders();
                const providers = response.data.providers;

                setProvider(providers);
                actionRef.current?.reloadAndRest(); // Reload and reset the table state
            } catch (error) {
                console.error('Error fetching Providers data:', error);
            }
        }

        fetchData();
    }, []);



    const columns: ProColumns<API.ProviderListItem>[] = [
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.ruleName.providerName"
                    defaultMessage="Provider Name"
                />
            ),
            dataIndex: 'name',
            valueType: 'text',
            tip: 'The Provider Name',
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
            dataIndex: 'phone',
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

        // Inside the columns definition
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
                    id="pages.searchTable.updateForm.rating"
                    defaultMessage="Rating"
                />
            ),
            search: false,
            dataIndex: 'ratings',
            valueType: 'text',
            render: (ratings, entity) => {
                const averageRating = calculateAverageRating(ratings);

                return (
                    <div>
                        {Array.from({ length: Math.round(averageRating) }).map((_, index) => (
                            <StarOutlined key={index} style={{ color: 'gold' }} />
                        ))}
                        <span style={{ marginLeft: '5px' }}>{averageRating.toFixed(1)}</span>
                    </div>
                );
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
            title: <FormattedMessage id="pages.searchTable.profilePhoto" defaultMessage="Photo" />,
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
            valueType: 'option',
            render: (_, record) => [
                <a
                    key="config"
                    onClick={() => {

                        handleUpdateModalOpen(true);
                        setCurrentRow(record); //here pass the props to UpdateForm
                    }}
                >
                    <FormattedMessage id="pages.searchTable.edit" defaultMessage="Edit" />
                </a>,
                <a
                    key="businesses-link"
                    onClick={() => {
                        // Open the drawer and pass the record (provider) to display business details
                        handleBusinessesDrawerOpen(record);
                    }}
                >
                    Businesses
                </a>

            ],
        },
    ];

    return (
        <PageContainer>
            <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                <ProTable
                    //key={categories.length}

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
                            const response = await getProviders();
                            const providers = response.data.providers;

                            // Filter the data based on the search parameters
                            const filteredProviders = providers.filter(provider => {
                                return (
                                    (params.name ? provider.name.toLowerCase().includes(params.name.toLowerCase()) : true) &&
                                    (params.phone ? provider.phone.toLowerCase().includes(params.phone.toLowerCase()) : true) &&
                                    (params.nida ? provider.nida.toLowerCase().includes(params.nida.toLowerCase()) : true) &&
                                    (params.email ? provider.user.email.toLowerCase().includes(params.email.toLowerCase()) : true) &&
                                    (params.location ? provider.location.toLowerCase().includes(params.location.toLowerCase()) : true) &&
                                    (params.status ? provider.status.toLowerCase().includes(params.status.toLowerCase()) : true)
                                );
                            });

                            return {
                                data: filteredProviders,
                                success: true,
                            };
                        } catch (error) {
                            console.error('Error fetching agents data:', error);
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
                        id: 'pages.searchTable.createForm.newAgent',
                        defaultMessage: 'New Provider',
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
                                    required: true,
                                    message: 'Please enter the Email!',
                                },
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
                    key={currentRow?.id}
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
                        <ProDescriptions<API.ProviderListItem>
                            column={2}
                            title={currentRow?.name}
                            request={async () => ({
                                data: currentRow || {},
                            })}
                            params={{
                                id: currentRow?.name,
                            }}
                            columns={columns as ProDescriptionsItemProps<API.ProviderListItem>[]}
                        />
                    )}

                    <Button type="primary" onClick={handleViewDocs}>
                        View Docs
                    </Button>

                    <Button style={{ marginLeft: 20 }} type="primary" onClick={handleViewEmployees}>
                        View Employees
                    </Button>
                    <Button style={{ marginLeft: 20 }} type="primary" onClick={handleNidaValidationDrawerOpen}>
                        Validate NIDA
                    </Button>
                </Drawer>
                <Drawer
                    width={600}
                    title={`${currentRow?.name}'s Businesses`}
                    placement="right"
                    onClose={() => {
                        setCurrentRow(undefined);
                        setShowBusinessesDrawer(false);
                    }}
                    visible={showBusinessesDrawer}
                    destroyOnClose
                    style={{ padding: '20px' }}
                >
                    {currentBusinessesData?.map((business) => (
                        <div key={business.id} style={{ marginBottom: '20px' }}>
                            <h3 style={{ color: '#1890ff' }}>{business.service.name}</h3>
                            <div>{business.description}</div>
                            {business?.sub_services.map((subService) => (
                                <div key={subService.id} style={{ marginLeft: '20px', borderLeft: '2px solid #1890ff', paddingLeft: '10px' }}>

                                    {/* {console.log('aples',subService)} */}

                                    <h4 style={{ color: '#1890ff' }}>{subService.name}</h4>
                                    <div>{subService.description}</div>
                                    {/* Add additional information for sub-services */}
                                </div>
                            ))}
                        </div>
                    ))}
                </Drawer>



                {/* NIDA Validation Drawer */}
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

                        <Button type="primary" onClick={() => handleNidaChecking(currentRow?.nida)}>
                            Validate NIDA
                        </Button>
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
            </div>
        </PageContainer>
    );
};

export default ProviderList;
