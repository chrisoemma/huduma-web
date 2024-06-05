import { PlusOutlined, ExportOutlined, DownloadOutlined } from '@ant-design/icons';
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
import { Button, Drawer, Image, Input, Tag, message,  Dropdown, Menu} from 'antd';
import React, { useRef, useState, useEffect } from 'react';
import moment from 'moment';
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';

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
    setPaymentHistory([]);

    const paymentHistory = currentRow?.payments || [];
    setPaymentHistory(paymentHistory);
    setPaymentHistoryVisible(true);
  };



  const handleDownloadPDF = () => {
    const element = document.getElementById('pro-table-container');
    if (element) {
     html2pdf(element);
    }
  };

  // Function to download as Excel
  const handleDownloadExcel = () => {
    const table = document.getElementById('pro-table-container');
    if (table) {
      const data = [];
      const headers = [];
      // Extract headers from the first row
      const headerCells = table.querySelector('thead').querySelectorAll('th');
      headerCells.forEach(cell => {
        headers.push(cell.innerText.trim()); // Trim to remove extra spaces
      });
      // Add 'payment_amount' to headers
      headers.push('payment_amount');
      
      // Extract data rows
      const bodyRows = table.querySelectorAll('tbody tr');
      bodyRows.forEach(row => {
        const rowData = [];
        row.querySelectorAll('td').forEach(cell => {
          rowData.push(cell.innerText.trim());
        });
        // Push rowData and set 'payment_amount' to an empty string
        rowData.push('');
        data.push(rowData);
      });
  
      // Create worksheet
      const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  
      // Create workbook
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, 'payments.xlsx');
    }
  };



  const handlePayment = async (formData: FormData) => {

      return 
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


  const PaymentHistoryDrawer: React.FC<{
    visible: boolean;
    onClose: () => void;
    paymentHistory: API.CommissionPayment[];
  }> = ({ visible, onClose, paymentHistory }) => {
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
                  dataIndex: 'payment_date',
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
          id="pages.searchTable.updateForm.agentName"
          defaultMessage="Agent"
        />
      ),
      dataIndex: ['agent','name'],
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
          id="pages.searchTable.updateForm.Month"
          defaultMessage="Client/Provider"
        />
      ),
      dataIndex: 'user_type', // Assuming 'user_type' holds either 'Client' or 'Provider'
      valueType: 'text',
      render: (_, record) => {
        const userType = record.user_type;
        const name = userType === 'Client' ? record?.client?.name : record?.provider?.name;
        const tagColor = userType === 'Client' ? 'blue' : 'green';
        const tagText = userType === 'Client' ? 'Client' : 'Provider';
        return (
          <span>
            {name} <Tag color={tagColor}>{tagText}</Tag>
          </span>
        );
      },
      search: true,
    },

    {
      title: (
        <FormattedMessage
          id="pages.searchTable.amount"
          defaultMessage="Amount"
        />
      ),
      dataIndex: 'amount',
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
      defaultMessage="A.Remaining"
    />
  ),
  dataIndex: 'amount_remaining',
  valueType: 'text',
  render: (_, entity) => {
    const totalAmount = parseFloat(entity.amount);
    const totalPaid = entity.payments.reduce((acc, payment) => acc + parseFloat(payment.amount), 0);
    const amountRemaining = (totalAmount - totalPaid).toFixed(2);
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
          defaultMessage="Payment for"
        />
      ),
      dataIndex: 'payment_for',
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
      title: <FormattedMessage id="pages.searchTable.titleStatus" defaultMessage="Status" />,
      dataIndex: 'status',
      hideInForm: true,
      render: (_, record) => {
        const lastPayment = record.payments[record.payments.length - 1];
        const lastStatus = lastPayment ? lastPayment.status : record.status;
        let color = '';
        if (lastStatus === 'Paid') {
          color = 'green';
        } else if (lastStatus === 'Unpaid') {
          color = 'red';
        } else {
          color = 'yellow';
        }
        return (
          <span>
            <Tag color={color}>{lastStatus}</Tag>
          </span>
        );
      },
    },
    {
      title: (
        <FormattedMessage
          id="pages.searchTable.paymentDate"
          defaultMessage="Payment Date"
        />
      ),
      dataIndex: 'payment_date',
      valueType: 'dateTime',
      hideInSearch: true,
      render: (_, record) => {
        const lastPayment = record.payments[record.payments.length - 1];
        const lastPaymentDate = lastPayment ? lastPayment.payment_date : record.payment_date;
        return <span>{lastPaymentDate}</span>;
      },
    },
  
    // Created At column
    {
      title: (
        <FormattedMessage
          id="pages.searchTable.createdAt"
          defaultMessage="Created At"
        />
      ),
      dataIndex: 'created_at',
      valueType: 'dateTime',
      hideInSearch: true,
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
        id="pro-table-container"
       
        rowSelection={false}
        pagination={{
          pageSizeOptions: ['15', '30', '60', '100'],
          defaultPageSize: 15, 
          showSizeChanger: true, 
          locale: {items_per_page: ""}
        }}
     
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
          filterType: 'light',
        }}
        request={async (params, sorter, filter) => {
          try {
            const response = await getActiveCommisions(params);
            const commissions = response.data.commissions;
            let activeCommissions = commissions;
          
            // Filter the data based on the search filter parameters
            if (filter) {
              activeCommissions = activeCommissions.filter(commission => {
                // Check each key in the filter object
                for (const key in filter) {
                  const filterValue = filter[key]?.toLowerCase(); // Convert filter value to lowercase for case-insensitive comparison
                  let commissionValue = ''; // Variable to store the commission value
          
                  if (key.includes('.')) { // Handle nested properties
                    const nestedKeys = key.split('.'); // Split the nested key
                    // Navigate through the nested structure to access the nested property
                    commissionValue = nestedKeys.reduce((obj, prop) => obj[prop], commission)?.toString().toLowerCase();
                  } else { // Handle non-nested properties
                    commissionValue = commission[key]?.toString().toLowerCase();
                  }
          
                  // If the commission value doesn't contain the filter value, return false to exclude the commission
                  if (filterValue && !commissionValue.includes(filterValue)) {
                    return false;
                  }
                }
                // If the commission passes all filter checks, return true to include it
                return true;
              });
            }
          
            return {
              data: activeCommissions,
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
        // rowSelection={{
        //   onChange: (_, selectedRows) => {
        //     setSelectedRows(selectedRows);
        //   },
        // }}
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

      <FooterToolbar>
        <Button
          icon={<ExportOutlined />}
          onClick={handleDownloadPDF}
        >
          Print
        </Button>
        <Dropdown
          overlay={
            <Menu onClick={({ key }) => {
              if (key === 'pdf') {
                handleDownloadPDF();
              } else if (key === 'excel') {
                handleDownloadExcel();
              }
            }}>
              <Menu.Item key="pdf">
                <DownloadOutlined /> PDF
              </Menu.Item>
              <Menu.Item key="excel">
                <DownloadOutlined /> Excel
              </Menu.Item>
            </Menu>
          }
        >
          <Button>
            <DownloadOutlined /> Export
          </Button>
        </Dropdown>
      </FooterToolbar>
    </PageContainer>
  );
};

export default ActiveCommisionList;
