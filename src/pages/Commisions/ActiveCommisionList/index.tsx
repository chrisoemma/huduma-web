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
import { FormattedMessage, useIntl, useModel } from '@umijs/max';
import { Button, Drawer, Image, Input, Tag, message } from 'antd';
import React, { useRef, useState, useEffect } from 'react';
import moment from 'moment';



import { formatErrorMessages, getMonthName, showErrorWithLineBreaks } from '@/utils/function';
import { AddPayment, getActiveCommisions } from '../CommisionSlice';


const ActiveCommisionList: React.FC = () => {

  const [createModalOpen, handleModalOpen] = useState<boolean>(false);

  const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

  const [showDetail, setShowDetail] = useState<boolean>(false);

  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<API.ActiveCommisionListItem>();
  const [selectedRowsState, setSelectedRows] = useState<API.ActiveCommisionListItem[]>([]);

  const intl = useIntl();
  const { initialState } = useModel('@@initialState');

  const [paymentHistoryVisible, setPaymentHistoryVisible] = useState<boolean>(false);
  const [paymentHistory, setPaymentHistory] = useState<API.CommissionPayment[]>([]);

  const handlePaymentHistoryClick = () => {
    // Extract payment history from the selected row
    const paymentHistory = currentRow?.commissionPayments || [];
    setPaymentHistory(paymentHistory)
    setPaymentHistoryVisible(true);
    
  };



  const handlePayment = async (formData: FormData) => {

    try {

      const currentUser = initialState?.currentUser;
     const  action_by=currentUser?.id;

      const amount = formData.get('amount') as string;
      const paymentData: API.ActiveCommisionListItem = {
        id: 0, // Set the appropriate ID
        amount: amount,
        action_by:action_by
      };

      // Save the data to the database
      const hide = message.loading('Loading...');
      try {

        const response = await AddPayment(currentRow?.commision,paymentData);
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
        console.log('errorrrs', error)
        message.error('Adding failed, please try again!');
        return false
      }

    } catch (error) {
      message.error('Image upload failed, please try again!');
      return false
    }
  };


  const PaymentHistoryDrawer: React.FC<{ visible: boolean; onClose: () => void; paymentHistory: API.CommissionPayment[] }> = ({ visible, onClose, paymentHistory }) => {
    return (
      <Drawer
        width={600}
        visible={visible}
        onClose={onClose}
        title={<FormattedMessage id="pages.searchTable.paymentHistory" defaultMessage="Payment History" />}
        closable={true}
      >
        {paymentHistory.map((payment, index) => (
          <div key={index} style={{ marginBottom: 16 }}>
            <ProDescriptions<API.CommissionPayment>
              column={2}
              title={`Payment #${index + 1}`}
              request={async () => ({
                data: payment || {},
              })}
              params={{
                id: payment.id,
              }}
              columns={[
                {
                  title: 'Amount',
                  dataIndex: 'amount',
                  valueType: 'text',
                  render: (text) => `$${text}`,
                },
                {
                  title: 'Date',
                  dataIndex: 'paid_date',
                  valueType: 'text',
                  render: (text) => `${text}`,
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  valueType: 'text',
                  render: (text) => <Tag color={text === 'Incomplete' ? 'red' : 'green'}>{text}</Tag>,
                },
                // Add more columns as needed
              ]}
            />
          </div>
        ))}
      </Drawer>
    );
  };


  const columns: ProColumns<API.ActiveCommisionListItem>[] = [
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
          id="pages.searchTable.updateForm.amountTobePaid"
          defaultMessage="Amount Remaining"
        />
      ),
      dataIndex: 'amount_remaining', // Use a custom dataIndex for the calculated value
      valueType: 'text',
      render: (_, entity) => {
        const amountRemaining = (parseFloat(entity.total_commission) - parseFloat(entity.total_paid_so_far)).toFixed(2);
        return (
          <a
            onClick={() => {
              setCurrentRow(entity);
              setShowDetail(true);
            }}
          >
            {amountRemaining}
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
        } else {
          color = 'yellow';
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
      render: (_, record) => (
        <>
          {record.status !== 'Paid' && (
            <div key="pay">
              <a
                onClick={() => {
                  handleModalOpen(true);
                  setCurrentRow(record);
                }}
              >
                <FormattedMessage id="pages.searchTable.pay" defaultMessage="Pay" />
              </a>
            </div>
          )}
        <div key="paymentHistory" style={{ marginTop: 10 }}>
        <a onClick={
           ()=>{
            setCurrentRow(record);
          handlePaymentHistoryClick()
           }
          }>
          <FormattedMessage id="pages.searchTable.paymentHistory" defaultMessage="Payment History" />
        </a>
      </div>

      {/* Payment History Drawer */}
      <PaymentHistoryDrawer visible={paymentHistoryVisible} onClose={() => setPaymentHistoryVisible(false)} paymentHistory={paymentHistory} />

        </>
      ),
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
            const response = await getActiveCommisions(params);
            const commisions = response.data.commissions;
            // Filter the data based on the 'name' filter
            const activeCommisions = commisions.filter(commision =>
              params.name
                ? commision.provider.name
                  .toLowerCase()
                  .split(' ')
                  .some(word => word.startsWith(params.name.toLowerCase()))
                : true
            );

            return {
              data: activeCommisions,
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
        rowSelection={{
          onChange: (_, selectedRows) => {
            setSelectedRows(selectedRows);
          },
        }}
      />

      <ModalForm
        title={intl.formatMessage({
          id: 'pages.searchTable.createForm.payment',
          defaultMessage: 'Add Payment',
        })}
        width="400px"
        open={createModalOpen}
        onOpenChange={handleModalOpen}
        onFinish={async (value) => {
          const formData = new FormData();
          formData.append('amount', value.amount); // Use 'amount' instead of 'name' as per your form field name

          const success = await handlePayment(formData);

          if (success) {
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
                message: 'Amount is required',
              },

              ({ getFieldValue }) => ({
                validator(_, value) {
                  const amountRemaining = parseFloat(currentRow?.total_commission || 0) - parseFloat(currentRow?.total_paid_so_far || 0);
                  if (isNaN(amountRemaining) || value <= amountRemaining) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Amount should not exceed Amount Remaining'));
                },
              }),
            ]}
            width="md"
            name="amount"
            label="Amount"
          />
        </ProForm.Group>
      </ModalForm>

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
          <ProDescriptions<API.ActiveCommisionListItem>
            column={2}
            title={currentRow?.agent_name}
            request={async () => ({
              data: currentRow || {},
            })}
            params={{
              id: currentRow?.agent_name,
            }}
            columns={columns as ProDescriptionsItemProps<API.ActiveCommisionListItem>[]}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default ActiveCommisionList;
