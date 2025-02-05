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
    PageLoading,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl,useModel } from '@umijs/max';
import { Button, Drawer, Image, Input, Tag, message, Form, List, Descriptions, Typography, Divider, Space, Modal } from 'antd';
import React, { useRef, useState, useEffect } from 'react';
//import type { FormValueType } from './components/UpdateForm';
import UpdateForm from './Components/UpdateForm';
import { storage } from './../../firebase/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addProvider, approveProfession, fetchBusinessesData, getProviders, removeProvider } from './ServiceProviderSlice';
import { history } from 'umi';
import { formatErrorMessages, getLocationName, showErrorWithLineBreaks, validateNIDANumber, validateTanzanianPhoneNumber } from '@/utils/function';
import { getNida, request_nida_from_api, validateNida } from '../NidaSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles.css'
import moment from 'moment';

const { Text, Title } = Typography;



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
    const [confirmAction, setConfirmAction] = useState(null);
   
    
    const intl = useIntl();
    const [form] = ProForm.useForm();
    const { Item } = Form;
    const { initialState } = useModel('@@initialState');
    const [loading, setLoading] = useState(false);
    const formRef = useRef();
    const navigate = useNavigate();
    const providerRefs = useRef({});

    const location = useLocation();
       
    const currentUser = initialState?.currentUser;

    // console.log('location',location);

    const [locationData, setLocationData] = useState({})

    const navigateToId = location?.state?.navigateToId;
    const tableRef = useRef<HTMLDivElement>(null);


    const fetchLocationData = async (providers) => {
        const locationMap = {};
    
        for (const provider of providers) {
          if (provider.latitude && provider.longitude) {
            const locationName = await getLocationName(provider.latitude, provider.longitude);
            locationMap[provider.id] = locationName;
          }
        }
    
        setLocationData(locationMap);
      };

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

    
      const handleRemove = async (selectedRows: API.ProviderListItem[]) => {

        const hide = message.loading('Loading....');
        if (!selectedRows) return true;
        try {

                const  action_by=currentUser?.id;
        const response=  await removeProvider({
            key: selectedRows.map((row) => row.id),
            action_by: action_by,
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




      const handleApproval = (status) => {
        if (!currentRow) {
          message.error('No profession change request selected.');
          return;
        }
        // Show confirmation dialog
        Modal.confirm({
          title: `Are you sure you want to ${status.toLowerCase()} this profession change request?`,
          okText: 'Yes',
          cancelText: 'No',
          onOk: async () => {
            try {
              const action_by = currentUser?.id;
              const profChangeId=currentRow?.profession_change_requests[currentRow?.profession_change_requests?.length-1]?.id;
              const data = {
                status: status,
                updated_by: action_by
              };
             
     
              const response = await approveProfession(profChangeId, data);

        

              if (response.status) {
                message.success(`Profession change request has been ${status.toLowerCase()} successfully.`);
                handleApproveProfessionDrawerClose();
              } else {
                message.error(response.message);
              }
            } catch (error) {
              message.error('An error occurred while processing the request.');
              console.error('Error approving/rejecting profession change request:', error);
            }
          }
        });
      };


    const handleNidaValidationDrawerOpen = () => {
        setShowNidaValidationDrawer(true);
    };

    const handleNidaValidationDrawerClose = () => {
        setValidationResult(null);
        setShowNidaValidationDrawer(false);
    };

    const [professionApprovalDrawer, setProfessionApprovalDrawer]=useState(false)
    const handleApproveProfessionDrawerClose = () => {
        // Open the drawer with the profession change options
        setProfessionApprovalDrawer(false);
      };

      const handleApproveProfessionDrawerOpen = () => {
        setProfessionApprovalDrawer(true);
    };


    const handleNidaApproval = async(value)=>{

        Modal.confirm({
            title: `Are you sure you want to ${value.toLowerCase()} this`,
            okText: 'Yes',
            cancelText: 'No',
            onOk: async () => {

        try{
          const nidaValidationData = {
            status: '',
            user_type: 'Provider',
          };

          setLoading(true);
           let dataMessage=''
          if (value=='Reject') {
            nidaValidationData.status = 'A.Invalid';
             dataMessage='Rejected successfully'
          } else{         
            nidaValidationData.status = 'A.Valid';
             dataMessage='Approved successfully'
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

    const handleNidaChecking = async (nida) => {
        try {

          setLoading(true); 
          const nidaData={
            nida:nida
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
        if (navigate) {
          navigate(`/user-management/service-providers/documents/provider/${currentRow?.id}`, {
            state: { from: `/user-management/service-providers`,providerId: currentRow.id,provider: currentRow},
          });
        }
      }


    const handleViewEmployees = () => {
        if (history) {
            // Assuming you have a route named '/documents/:providerId'
            const route = `/user-management/service-providers/employees/provider/${currentRow?.id}`;
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
        const currentUser = initialState?.currentUser;

        setLoading(true);

        let providerData: API.ProviderListItem = {
  
            first_name: first_name,
            last_name: last_name,
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
            providerData = {
                ...providerData,
                profile_img: downloadURL,
            };

            // Add provider data to the database
            const hide = message.loading('Loading...');
            try {
                const response = await addProvider(providerData);
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
                hide();
                setLoading(false); 
                message.error('Adding failed, please try again!');
                return false;
            } finally {
                setLoading(false); 
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
                  
                fetchLocationData(providers);
                // console.log('providerss',providers);
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
            title: <FormattedMessage id="pages.searchTable.titleClientNumber" defaultMessage="Number" />,
            dataIndex:  ['user','reg_number'],
            hideInForm: true,
            search: {
                name:'reg_number'
            },
          },
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.ruleName.providerName"
                    defaultMessage="Name"   
                />
            ),
            dataIndex: 'name',
            valueType: 'text',
            tip: 'The Provider Name',
            render: (dom, entity) => {

                return (
                    
                    <a
                        data-row-id={entity.id}
                        onClick={() => {
                            setCurrentRow(entity);
                            setShowDetail(true);
                        }}
                    ref={(el) => (providerRefs.current[entity.id] = el)}
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
                // Check if phone_verified_at is null or not
                 
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
                name:'phone'
            }
        },

        // Inside the columns definition
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.nida"
                    defaultMessage="NIDA"
                />
            ),
            dataIndex: ['user','nida'],
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
           search:{
            name:'nida'
           }
        },

        {
            title: "Profession",
            dataIndex: 'designation',
            search: false,
            valueType: 'text',
            render: (_, entity) => {
                const englishDesignation = entity?.designation?.name?.en;
                const swahiliDesignation = entity?.designation?.name?.sw;
        
                return (
                    <div>
                        <div>{englishDesignation}</div>
                        <div style={{ whiteSpace: 'nowrap' }}>{' | '}</div>
                        <div>{swahiliDesignation}</div>
                    </div>
                );
            },
         
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
            search: false,
        },
        {
            title: (
              <FormattedMessage
                id="pages.searchTable.updateForm.ruleName.location"
                defaultMessage="Location"
              />
            ),
            dataIndex: ['latitude', 'longitude'],
            valueType: 'text',
            tip: 'Location',
            render: (_, entity) => {
              const location = locationData[entity.id] || '-';
              return (
                <a
                  onClick={() => {
                    setCurrentRow(entity);
                    setShowDetail(true);
                  }}
                >
                  {location}
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
            title: <FormattedMessage id="pages.searchTable.profilePhoto" defaultMessage="Photo" />,
            dataIndex: ['user', 'profile_img'],
            hideInSearch: true,
            search: false,
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
            <div 
            ref={tableRef}
            style={{ overflowY: 'auto' }}>
               
            <ProTable
           rowClassName={getRowClassName}
           scroll={{ x: 1200 }} 
    pagination={{
        pageSizeOptions: ['15', '30', '60', '100'],
        defaultPageSize:30, 
        showSizeChanger: true, 
        locale: { items_per_page: "" } 
    }}
    actionRef={actionRef} 
    rowKey="id" 
    toolBarRender={() => [
        <Button
            type="primary"
            key="primary"
            onClick={() => handleModalOpen(true)} 
        >
            <PlusOutlined /> <FormattedMessage id="pages.searchTable.new" defaultMessage="New" />
        </Button>,
    ]}
    search={{
        labelWidth: 120,
        filterType: 'query',
    }}
    request={async (params, sorter, filter) => {
        try {
            const response = await getProviders(params);
            const providers = response.data.providers;
          
          
            const filteredProviders = providers.filter(provider => {
                const matchesNumber =params['users.reg_number']
                ? provider.users.reg_number?.toLowerCase().includes(params['reg_number'].toLowerCase())
                : true;
                const matchesProviderName = params.name
                  ? provider.name?.toLowerCase().includes(params.name.toLowerCase())
                  : true;
                const matchesPhone =params['users.phone']
                  ? provider.users.phone?.toLowerCase().includes(params['users.phone'].toLowerCase())
                  : true;

                  const matchesNida =params['users.nida']
                  ? provider.users.phone?.toLowerCase().includes(params['users.nida'].toLowerCase())
                  : true;
        
                return matchesNumber && matchesProviderName && matchesPhone && matchesNida;
            });

            return {
                data: filteredProviders,
                success: true,
            };
        } catch (error) {
            console.error('Error fetching providers data:', error);
            return {
                data: [],
                success: false,
            };
        }
    }}
    columns={columns} // Ensure columns are properly defined
    rowSelection={{
        onChange: (_, selectedRows) => {
            setSelectedRows(selectedRows); // Ensure setSelectedRows is properly defined
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
                        id: 'pages.searchTable.createForm.newAgent',
                        defaultMessage: 'New Provider',
                    })}
                    width="400px"
                    open={createModalOpen}
                    formRef={formRef}
                    onOpenChange={handleModalOpen}
                    onFinish={async (value) => {
                            // //
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

                        {/* <ProFormText
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
                        /> */}

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

                    <Button style={{ marginLeft: 15 }} type="primary" onClick={handleViewEmployees}>
                        View Employees
                    </Button>
                    <Button style={{ marginLeft:15,marginRight:15 }} type="primary" onClick={handleNidaValidationDrawerOpen}>
                        Validate NIDA
                    </Button>
                    {/* <Button style={{ marginLeft: 20 }} type="primary" onClick={handleNidaValidationDrawerOpen}>
                    Requests
                </Button> */}
                <Button
  type="primary"
  key="approveProfession"
  onClick={handleApproveProfessionDrawerOpen}
  style={{ marginTop: '20px' }}
>
  Approve Profession
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
      onClick={()=>{handleNidaApproval('Reject')}}
       disabled={loading}
      >
         {loading ? 'Rejecting...' : 'Reject'}
      </Button>
      <Button type="primary"
       onClick={()=>{handleNidaApproval('Approve')}}
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



                <Drawer
  width={500}
  placement="right"
  onClose={handleApproveProfessionDrawerClose}
  visible={professionApprovalDrawer}
  destroyOnClose
  closable={false}
>
  {currentRow && (
    <div>
      <Title level={3}>Profession Change Details</Title>

      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Current Profession">
          <Text strong>{currentRow?.designation?.name?.en}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Requested Profession">
          <Text strong>{currentRow?.pending_profession?.name.en}</Text>
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      <Space
        size="middle"
        style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}
      >
        <Button
          type="primary"
          onClick={() => { handleApproval('Approved'); }}
          disabled={currentRow?.profession_change_status !=='pending'}
        >
          Approve
        </Button>
        <Button
          style={{ background: "red", borderColor: "red" }}
          type="primary"
          onClick={() => { handleApproval('Rejected'); }}
          disabled={currentRow?.profession_change_status !=='pending'}
        >
          Reject
        </Button>
      </Space>

      <Divider />

      <Title level={4}>History</Title>
      <List
        dataSource={currentRow?.profession_change_requests}
        renderItem={(item) => (
          <List.Item>
            <Space>
              <Tag color="blue">{new Date(item.request_date).toLocaleDateString()}</Tag>
              <Text>
                Changed from <Text strong>{item?.old_profession?.name?.en}</Text> to <Text strong>{item?.new_profession?.name?.en}</Text>
                {item?.status && (
                  <div>
                    <br />
                    {'- Status '}
                    <Tag color={item?.status === 'Pending' ? 'orange' : item?.status === 'Approved' ? 'green' : 'red'}>
                      {item?.status}
                    </Tag>
                  </div>
                )}
              </Text>
            </Space>
          </List.Item>
        )}
      />
    </div>
  )}
</Drawer>

            </div>
        </PageContainer>
    );
};

export default ProviderList;
