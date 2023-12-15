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
import { Button, Drawer, Image, Input, Tag, message } from 'antd';
import React, { useRef, useState, useEffect } from 'react';
import UpdateForm from './components/UpdateForm';
import { storage } from './../../firebase/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { formatErrorMessages, showErrorWithLineBreaks, validateTanzanianPhoneNumber } from '@/utils/function';
import { addUserAdmin, getRoles, getSystemAdmins } from './AdminSlice';


const AdminList: React.FC = () => {

    const [createModalOpen, handleModalOpen] = useState<boolean>(false);

    const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

    const [showDetail, setShowDetail] = useState<boolean>(false);

    const actionRef = useRef<ActionType>();
    const [currentRow, setCurrentRow] = useState<API.AdminListItem>();
    const [selectedRowsState, setSelectedRows] = useState<API.AdminListItem[]>([]);
    const [roles, setRoles] = useState([]);

    const intl = useIntl();
    const [form] = ProForm.useForm();


    //   const handleRemove = async (selectedRows: API.AdminListItem[]) => {


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


    useEffect(() => {
        async function fetchData() {
            try {
                const response = await getRoles();
                const roles = response.data.roles;
                setRoles(roles);
                actionRef.current?.reloadAndRest(); // Reload and reset the table state
            } catch (error) {
                console.error('Error fetching Roles data:', error);
            }
        }

        fetchData();
    }, []);



    const handleAdd = async (formData: FormData) => {
        const name = formData.get('name') as string;
        const phone = formData.get('phone') as string;
        const newphone = validateTanzanianPhoneNumber(phone);
        const email = formData.get('email') as string;
        const role = formData.get('role') as string;
        const imageFile = formData.get('image') as File;


        let userData: API.AdminListItem = {
            id: 0, // Set the appropriate ID
            name: name,
            email: email,
            phone: newphone,
            roles: role,
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
            userData = {
                ...userData,
                profile_img: downloadURL,
            };

            // Add agent data to the database
            const hide = message.loading('Loading...');
            try {
                const response = await addUserAdmin(userData);
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



    const columns: ProColumns<API.AdminListItem>[] = [
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.ruleName.name"
                    defaultMessage="Name"
                />
            ),
            dataIndex: 'name',
            valueType: 'text',
            tip: 'Admin Name',
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
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.roles"
                    defaultMessage="Roles"
                />
            ),
            dataIndex: 'roles',
            valueType: 'text',
            tip: 'The Roles is unique',
            render: (dom, entity) => {
                const roleNames = entity.roles.map(role => role.name).join(', ');
                return (
                    <a
                        onClick={() => {
                            setCurrentRow(entity);
                            setShowDetail(true);
                        }}
                    >
                        {roleNames}
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
            title: <FormattedMessage id="pages.searchTable.profilePhoto" defaultMessage="Profile photo" />,
            dataIndex: 'profile_img',
            hideInSearch: true,
            render: (_, record) => {
                const profileImage = record.profile_img;
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
                        const response = await getSystemAdmins();
                        const admins = response.data.users;

                        // Filter the data based on the search parameters
                        const filteredAdmins = admins.filter(admin => {
                            return (
                                (params.name ? admin.name.toLowerCase().includes(params.name.toLowerCase()) : true) &&
                                (params.phone ? admin.phone.toLowerCase().includes(params.phone.toLowerCase()) : true) &&
                                (params.nida ? admin.nida.toLowerCase().includes(params.nida.toLowerCase()) : true) &&
                                (params.email ? admin.user.email.toLowerCase().includes(params.email.toLowerCase()) : true)

                            );
                        });

                        return {
                            data: filteredAdmins,
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
                    defaultMessage: 'New System User',
                })}
                width="400px"
                open={createModalOpen}
                onOpenChange={handleModalOpen}
                onFinish={async (value) => {
                    const formData = new FormData();
                    formData.append('name', value.name);
                    formData.append('phone', value.phone);
                    formData.append('email', value.email);
                    formData.append('role',value.role);

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

                    <ProFormSelect
                        name="role"
                        width="md"
                        label={intl.formatMessage({
                            id: 'pages.searchTable.updateForm.role',
                            defaultMessage: 'Select Role',
                        })}
                        valueEnum={roles.reduce((enumObj, role) => {
                            enumObj[role.id] = role.name;
                            return enumObj;
                        }, {})}

                        rules={[
                            {
                                required: true,
                                message: 'Please select role!',
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
                    <ProDescriptions<API.AdminListItem>
                        column={2}
                        title={currentRow?.name}
                        request={async () => ({
                            data: currentRow || {},
                        })}
                        params={{
                            id: currentRow?.name,
                        }}
                        columns={columns as ProDescriptionsItemProps<API.AdminListItem>[]}
                    />
                )}
            </Drawer>
        </PageContainer>
    );
};

export default AdminList;
