import { CheckOutlined, PlusOutlined } from '@ant-design/icons';
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
import { Button, Card, Drawer,Form, Image, Input, Tag, message } from 'antd';

import React, { useRef, useState, useEffect } from 'react';

//import UpdateForm from './components/UpdateForm';

import { getExpiredSubscriptions,renewSubscription,upgradeSubscription } from './ProviderSubscriptionSlice';
import moment from 'moment';
import { getDiscounts } from '../DiscountList/DiscountSlice';


const ExpiredSubscriptionsList: React.FC = () => {

    const [createModalOpen, handleModalOpen] = useState<boolean>(false);

    const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

    const [showDetail, setShowDetail] = useState<boolean>(false);

    const actionRef = useRef<ActionType>();
    const [currentRow, setCurrentRow] = useState<API.ExpiredSubscriptionsListItem>();
    const [selectedRowsState, setSelectedRows] = useState<API.ExpiredSubscriptionsListItem[]>([]);
 
    const [packages,setPackages]=useState([]);
    const intl = useIntl();

    const [form] = ProForm.useForm();
    const [selectedCard, setSelectedCard] = useState(null);


      useEffect(() => {
    async function fetchData() {
      try {
        const response = await getDiscounts();
        const packages = response.data.discounts;
      
        setPackages(packages);
      } catch (error) {
        console.error('Error fetching packages data:', error);
      }
    }
  
    fetchData();
  }, []);


  const handleAdd = async (formData: FormData) => {
     
      

       let data= {
        provider_id:currentRow.provider.id,
        free_trial:currentRow.is_trial,
        subscription_id:currentRow.id,
        user_id:currentRow.provider.user_id
    };

      if(!selectedCard){
        message.error('Please select package!');
        return 
      }


    //   console.log('data',data)
    //   console.log('selected card',selectedCard)

    //   return 

      const hide = message.loading('Loading...');
      try {
        const response = await renewSubscription(selectedCard, { ...data });
              message.success('successfully Renewed');
       } catch (error) {
        hide();
        message.error('Renew failed, please try again!');
        return false
      } finally {
        handleModalOpen(false);
        actionRef.current.reload();
      }


  }



    const columns: ProColumns<API.ExpiredSubscriptionsListItem>[] = [
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
                    defaultMessage="Package Name"
                />
            ),
            dataIndex: 'name',
            valueType: 'text',
            render: (dom, entity) => {
                const packageName = entity.is_trial ? entity.package.name : `"${entity.discount.name}"`;
                return (
                    <a
                        onClick={() => {
                            setCurrentRow(entity);
                            setShowDetail(true);
                        }}
                    >
                        {packageName}
                    </a>
                );
            },
        },
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.AmountPaid"
                    defaultMessage="Amount Paid"
                />
            ),
            dataIndex: 'amountPaid',
            valueType: 'text',
            render: (dom, entity) => {
                let amountPaid;
                if (entity.is_trial) {
                    amountPaid = 'Trial/Free';
                } else {
                    const discountAmount = parseFloat(entity.discount.amount);
                    const discountDuration = parseFloat(entity.discount.duration);
                    amountPaid = (entity.package.amount * discountDuration) - (discountAmount * discountDuration);
                }
                return (
                    <a
                        onClick={() => {
                            setCurrentRow(entity);
                            setShowDetail(true);
                        }}
                    >
                        {amountPaid}
                    </a>
                );
            },
        },
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.Duration"
                    defaultMessage="Duration"
                />
            ),
            dataIndex: 'duration',
            valueType: 'text',
            render: (dom, entity) => {
                let duration;
                if (entity.is_trial) {
                    duration = '1 month';
                } else {
                    duration = `${entity.discount.duration} month(s)`;
                }
                return (
                    <a
                        onClick={() => {
                            setCurrentRow(entity);
                            setShowDetail(true);
                        }}
                    >
                        {duration}
                    </a>
                );
            },
        },
        
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.StartDate"
                    defaultMessage="Start Date"
                />
            ),
            dataIndex: 'start_date',
            valueType: 'dateTime',
        },
        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.EndDate"
                    defaultMessage="End Date"
                />
            ),
            dataIndex: 'end_date',
            valueType: 'dateTime',
        },

        {
            title: (
                <FormattedMessage
                    id="pages.searchTable.updateForm.WillExpireIn"
                    defaultMessage="Will Expire In"
                />
            ),
            dataIndex: 'expireIn',
            valueType: 'text',
            render: (dom, entity) => {
                // Calculate days until expiration
                const endDate = moment(entity.end_date);
                const now = moment();
                const daysUntilExpiration = endDate.diff(now, 'days');
            
                // Render the value
                let color = '';
                if (daysUntilExpiration > 0) {
                    color = 'green'; 
                } else if (daysUntilExpiration === 0) {
                    color = 'orange'; 
                } else {
                    color = 'red'; 
                }
            
                return (
                    <span>
                        <Tag color={color}>
                            {daysUntilExpiration > 0
                                ? `${daysUntilExpiration} day(s)`
                                : daysUntilExpiration === 0
                                ? 'Expires today'
                                : 'Expired'}
                        </Tag>
                    </span>
                );
            },
        },
        {
            title: <FormattedMessage id="pages.searchTable.titleStatus" defaultMessage="Status" />,
            dataIndex: 'status',
            valueType: 'text',
            render: (text, record) => {
                let color = '';
                if (text === 'Active') {
                    color = 'green';
                } else {
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
                  handleModalOpen(true);
                  setCurrentRow(record);
                }}
              >
                <FormattedMessage id="pages.searchTable.renew" defaultMessage="Renew" />
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
                    locale: {items_per_page: ""}
                  }}
                headerTitle={intl.formatMessage({
                    id: 'pages.searchTable.title1',
                    defaultMessage: 'Subscriptions',
                })}
                actionRef={actionRef}
                rowKey="id"

                search={{
                    labelWidth: 120,
                    //  filterType: 'light', // Use a light filter form for better layout
                }}
                request={async (params, sorter, filter) => {
                    try {
                        const response = await getExpiredSubscriptions(params);
                        const subscriptions = response.data.subscriptions;
            
                        // Filter by provider name
                        const filteredByProvider = params.provider
                            ? subscriptions.filter(subscription =>
                                subscription.provider.name.toLowerCase().includes(params.provider.toLowerCase())
                            )
                            : subscriptions;
            
                        // Filter by package name
                        const filteredByPackage = params.package_name
                            ? filteredByProvider.filter(subscription =>
                                subscription.name.toLowerCase().includes(params.package_name.toLowerCase())
                            )
                            : filteredByProvider;
            
                        return {
                            data: filteredByPackage,
                            success: true,
                        };
                    } catch (error) {
                        console.error('Error fetching filteredSubscriptions data:', error);
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
                    <ProDescriptions<API.ExpiredSubscriptionsListItem>
                        column={2}
                        title={currentRow?.name}
                        request={async () => ({
                            data: currentRow || {},
                        })}
                        params={{
                            id: currentRow?.name,
                        }}
                        columns={columns as ProDescriptionsItemProps<API.ExpiredSubscriptionsListItem>[]}
                    />
                )}
            </Drawer>


            <ModalForm
    form={form}
    title={intl.formatMessage({
        id: 'pages.searchTable.createForm.newPackage',
        defaultMessage: 'Renew Package',
    })}
    width="800px"
    open={createModalOpen}
    onOpenChange={handleModalOpen}
    onFinish={async value => {
        const formData = new FormData();
        // Handle form submission here
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
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap', // Allow flex items to wrap to the next line
                gap: '16px',
            }}
        >
            {Object.values(packages.reduce((acc, subPackage) => {
                if (!selectedRowsState.some(subscription => subscription.discount_id === subPackage.id)) {
                    const packageId = subPackage.package.id;
                    const packageName = subPackage.package.name;
                    if (!acc[packageId]) {
                        acc[packageId] = {
                            name: packageName,
                            packages: [],
                        };
                    }
                    acc[packageId].packages.push(subPackage);
                }
                return acc;
            }, {})).map(({ name, packages }) => (
                <div key={name}>
                    <h3>{name}</h3>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap', // Allow flex items to wrap to the next line
                            gap: '16px',
                        }}
                    >
                        {packages
                            .sort((a, b) => a.duration - b.duration) // Sort packages by duration within each group
                            .map(subPackage => (
                                <Card
                                    key={subPackage.id}
                                    title={subPackage.name}
                                    style={{
                                        flexBasis: 'calc(33.33% - 16px)',
                                        marginBottom: '16px',
                                        position: 'relative',
                                        boxShadow:
                                            selectedCard === subPackage.id
                                                ? '0 0 10px rgba(0, 0, 0, 0.3)'
                                                : 'none',
                                   
                                    }}
                                    onClick={() => setSelectedCard(subPackage.id)}
                                >
                            
                                    <p style={{ textDecoration: 'line-through' }}>Price: {subPackage.package.amount * subPackage.duration}</p>
                                    <p>Price: {(subPackage.package.amount * subPackage.duration) - (subPackage.amount * subPackage.duration)}</p>
                                    <p>Duration: {subPackage.duration}</p>

                                    {selectedCard === subPackage.id && (
                                        <div style={{ position: 'absolute', top: 10, right: 10 }}>
                                            <CheckOutlined style={{ fontSize: 24, color: 'green' }} />
                                        </div>
                                    )}
                                </Card>
                            ))}
                    </div>
                </div>
            ))}
        </div>
    </ProForm.Group>
</ModalForm>




        </PageContainer>
    );
};

export default ExpiredSubscriptionsList;
