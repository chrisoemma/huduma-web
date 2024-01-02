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
import moment from 'moment';



import { getMonthName } from '@/utils/function';
import { getPreviousCommisions } from '../CommisionSlice';


const PreviousCommisionList: React.FC = () => {

  const [createModalOpen, handleModalOpen] = useState<boolean>(false);

  const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

  const [showDetail, setShowDetail] = useState<boolean>(false);

  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<API.PreviousCommisionListItem>();
  const [selectedRowsState, setSelectedRows] = useState<API.PreviousCommisionListItem[]>([]);

  const intl = useIntl();



  
  const columns: ProColumns<API.PreviousCommisionListItem>[] = [
    {
      title: (
        <FormattedMessage
          id="pages.searchTable.updateForm.providerName"
          defaultMessage="Agent name"
        />
      ),
      dataIndex: 'agent_name',
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
      search: true,
    },
    
        {
      title: (
        <FormattedMessage
          id="pages.searchTable.updateForm.amountTobePaid"
          defaultMessage="Amount to be paid"
        />
      ),
      dataIndex: 'total_should_be_paid',
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
      search:false,
    },

    {
        title: (
          <FormattedMessage
            id="pages.searchTable.amountPaid"
            defaultMessage="Amount Paid"
          />
        ),
        dataIndex: 'total_paid_so_far',
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
        search: false,
      },

      {
        title: (
          <FormattedMessage
            id="pages.searchTable.updateForm.Month"
            defaultMessage="Month"
          />
        ),
        dataIndex: 'month',
        valueType: 'text',
        render: (dom, entity) => {
          const monthName = getMonthName(entity.month);
          const year = entity.year;
          const displayText = `${monthName} ${year}`;
          return (
            <a
              onClick={() => {
                setCurrentRow(entity);
                setShowDetail(true);
              }}
            >
              {displayText}
            </a>
          );
        },
        search: true,
      },
    {
      title: <FormattedMessage id="pages.searchTable.titleStatus" defaultMessage="Status" />,
      dataIndex: 'status',
      hideInForm: true,
      render: (text, record) => {
          let color = '';
          if (text == 'Paid') {
              color = 'green';
          } else if (text == 'Unpaid') {
              color = 'red';
          }else{
            color = 'yellow';
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
        headerTitle={intl.formatMessage({
          id: 'pages.searchTable.title',
          defaultMessage: 'Enquiry form',
        })}
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
         filterType: 'light', 
        }}
        request={async (params, sorter, filter) => {
          try {      
            const response = await getPreviousCommisions(params);
            const commisions = response.data.commissions            ;
            // Filter the data based on the 'name' filter
            const PreviousCommisions = commisions.filter(commision =>
              params.name
                ? commision.provider.name
                    .toLowerCase()
                    .split(' ')
                    .some(word => word.startsWith(params.name.toLowerCase()))
                : true
            );
      
            return {
              data: PreviousCommisions,
              success: true,
            };
          } catch (error) {
            console.error('Error fetching Commisions data:', error);
            return {
              data: [],
              success: false,
            };
          }
        }}
      
        columns={columns}
    
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
        {currentRow?.agent_name && (
          <ProDescriptions<API.PreviousCommisionListItem>
            column={2}
            title={currentRow?.agent_name}
            request={async () => ({
              data: currentRow || {},
            })}
            params={{
              id: currentRow?.agent_name,
            }}
            columns={columns as ProDescriptionsItemProps<API.PreviousCommisionListItem>[]}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default PreviousCommisionList;