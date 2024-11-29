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

//import UpdateForm from './components/UpdateForm';
import { storage } from './../../firebase/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getPastProviderSubservices} from '../SubserviceChangeStatus/SubServiceStatusChangeSlice';


const ProviderSubServiceList: React.FC = () => {

    const [createModalOpen, handleModalOpen] = useState<boolean>(false);

    const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

    const [showDetail, setShowDetail] = useState<boolean>(false);

    const actionRef = useRef<ActionType>();
    const [currentRow, setCurrentRow] = useState<API.ProviderSubServiceListItem>();
    const [selectedRowsState, setSelectedRows] = useState<API.ProviderSubServiceListItem[]>([]);

    const intl = useIntl();

    const columns: ProColumns<API.ProviderSubServiceListItem>[] = [

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
            hideInForm: true,
            render: (text, record) => {
                let color = '';
                if (text == 'Accepted') {
                    color = 'green';
                } else if (text == 'Rejected') {
                    color = 'red';
                }

                return (
                    <span>
                        <Tag color={color}>{text}</Tag>
                    </span>
                );
            },
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
                        const response = await getPastProviderSubservices(params);
                        const subservices = response.data.sub_services;
                    
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
                    <ProDescriptions<API.ProviderSubServiceListItem>
                        column={2}
                        title={currentRow?.name}
                        request={async () => ({
                            data: currentRow || {},
                        })}
                        params={{
                            id: currentRow?.name,
                        }}
                        columns={columns as ProDescriptionsItemProps<API.ProviderSubServiceListItem>[]}
                    />
                )}
            </Drawer>
        </PageContainer>
    );
};

export default ProviderSubServiceList;
