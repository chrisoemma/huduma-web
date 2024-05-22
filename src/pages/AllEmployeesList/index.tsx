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
import { FormattedMessage, useIntl, useParams, useRequest } from '@umijs/max';
import { Button, Drawer, Image, Input, Space, Tag, message } from 'antd';
import React, { useRef, useState, useEffect } from 'react';
import UpdateForm from './components/UpdateForm';
import { storage } from '../../firebase/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

import { formatErrorMessages, showErrorWithLineBreaks, validateTanzanianPhoneNumber } from '@/utils/function';
import { getAllEmployees,addEmployee } from '../EmployeeList/EmployeeSlice';


const EmployeeList: React.FC = () => {

    const [createModalOpen, handleModalOpen] = useState<boolean>(false);

    const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

    const [showDetail, setShowDetail] = useState<boolean>(false);

    const actionRef = useRef<ActionType>();
    const [currentRow, setCurrentRow] = useState<API.EmployeeListItem>();
    const [selectedRowsState, setSelectedRows] = useState<API.EmployeeListItem[]>([]);
    const [clients, setClients] = useState([]);
    const { id } = useParams();
  //  const { data, error, loading } = useRequest(() => getProviderEmployees(Number(id)));

    const intl = useIntl();
    const [form] = ProForm.useForm(); 


    //   const handleRemove = async (selectedRows: API.EmployeeListItem[]) => {


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
        const name = formData.get('name') as string;
        const phone = formData.get('phone') as string;
        const newphone = validateTanzanianPhoneNumber(phone);
        const email = formData.get('email') as string;
        const imageFile = formData.get('image') as File;
        const nida = formData.get('nida') as string;
      
        let employeeData: API.EmployeeListItem = {
          id: 0, // Set the appropriate ID
          name: name,
          nida: nida,
          email: email,
          phone:newphone,
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
          employeeData = {
            ...employeeData,
            profile_img: downloadURL,
          };
          // Add employee data to the database
          const hide = message.loading('Loading...');
          try {
            const response = await addEmployee(id, employeeData);
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
          message.error(error);
          return false;
        }
      };
       







    const columns: ProColumns<API.EmployeeListItem>[] = [
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.employeeName"
                    defaultMessage="Employee Name"
                />
            ),
            dataIndex: 'name',
            valueType: 'text',
            tip: 'The Employee Name',
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
                    id="pages.searchTable.updateForm.providerName"
                    defaultMessage="Provider"
                />
            ),
            dataIndex: ['provider', 'name'],
            valueType: 'text',
            tip: 'The Provider Name',
            render: (dom, entity) => {
                return entity.provider ? entity?.provider?.name : 'N/A';
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
                // Check if phone_verified_at is null or not
                    console.log('entitiees',entity);
                const verifiedTag = entity.user.phone_verified_at ? (
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
        // {
        //     title: (
        //         <FormattedMessage
        //             id="pages.searchTable.updateForm.ruleName.location"
        //             defaultMessage="Location"
        //         />
        //     ),
        //     dataIndex: 'location',
        //     valueType: 'text',
        //     tip: 'Location',
        //     render: (dom, entity) => {

        //         return (
        //             <a
        //                 onClick={() => {
        //                     setCurrentRow(entity);
        //                     setShowDetail(true);
        //                 }}
        //             >
        //                 {dom}
        //             </a>
        //         );
        //     },
        //     search: true,
        // },
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
                if (text == 'Active') {
                    color = 'green';
                } else if (text=='Pending approval') {
                    text = 'Waiting Phone Verification';
                    color = 'yellow'
                } else if (text == 'Deactivated' || text == 'Suspended' || text == 'In Active') {
                    color = 'red';
                    text='Deactivated';
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
                pagination={{
                    pageSizeOptions: ['15', '30', '60', '100'],
                    defaultPageSize: 15, 
                    showSizeChanger: true, 
                    locale: {items_per_page: ""}
                  }}
                headerTitle={intl.formatMessage({
                    id: 'pages.searchTable.providerEmployees',
                    defaultMessage: `Provider employees`,
                })}
                actionRef={actionRef}
                rowKey="id"
                toolBarRender={() => [
                    // <Button
                    //     type="primary"
                    //     key="primary"
                    //     onClick={() => {
                    //         handleModalOpen(true);
                    //     }}
                    // >
                    //     <PlusOutlined /> <FormattedMessage id="pages.searchTable.new" defaultMessage="New" />
                    // </Button>,
                ]}
                search={{
                    labelWidth: 120,
                    filterType: 'light', // Use a light filter form for better layout
                }}
                request={async (params, sorter, filter) => {
                    try {

                        const response = await getAllEmployees(Number(id), params);
                        const employees = response.data.employees;

                        console.log('employeees12', employees)
                        // Filter the data based on the search parameters
                        const filteredEmployees = employees.filter(employee => {
                            return (
                                (params.name ? employee.name.toLowerCase().includes(params.name.toLowerCase()) : true) &&
                                (params.phone ? employee.phone.toLowerCase().includes(params.phone.toLowerCase()) : true) &&
                                (params.nida ? employee.nida.toLowerCase().includes(params.nida.toLowerCase()) : true) &&
                                (params.email ? employee.user.email.toLowerCase().includes(params.email.toLowerCase()) : true) &&
                                (params.location ? employee.location.toLowerCase().includes(params.location.toLowerCase()) : true) &&
                                (params.status ? employee.status.toLowerCase().includes(params.status.toLowerCase()) : true)
                            );
                        });

                        return {
                            data: filteredEmployees,
                            success: true,
                        };
                    } catch (error) {
                        console.error('Error fetching employees data:', error);
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
                    defaultMessage: 'New Employee',
                })}
                width="400px"
                open={createModalOpen}
                onOpenChange={handleModalOpen}
                onFinish={async (value) => {
                    const formData = new FormData();
                    formData.append('name', value.name);
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
                            type: 'email',
                            message: 'Please enter a valid email address!',
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
                    <ProDescriptions<API.EmployeeListItem>
                        column={2}
                        title={currentRow?.name}
                        request={async () => ({
                            data: currentRow || {},
                        })}
                        params={{
                            id: currentRow?.name,
                        }}
                        columns={columns as ProDescriptionsItemProps<API.EmployeeListItem>[]}
                    />
                )}
            </Drawer>
        </PageContainer>
    );
};

export default EmployeeList;
