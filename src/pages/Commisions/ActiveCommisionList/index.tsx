import { PlusOutlined, ExportOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProDescriptionsItemProps } from '@ant-design/pro-components';
import {
  FooterToolbar,
  ModalForm,
  PageContainer,
  ProForm,
  ProDescriptions,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl, useModel } from '@umijs/max';
import { Button, Drawer, Image, Upload, Input, Tag, message, Dropdown, Menu } from 'antd';
import React, { useRef, useState, useEffect } from 'react';
import moment from 'moment';
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';

import { formatErrorMessages, getMonthName, showErrorWithLineBreaks } from '@/utils/function';
import { AddPayment, PayByExcel, getActiveCommisions } from '../CommisionSlice';


const ActiveCommisionList: React.FC = () => {

  const [createModalOpen, handleModalOpen] = useState<boolean>(false);


  const [showDetail, setShowDetail] = useState<boolean>(false);

  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<API.ActiveCommisionListItem>();
  const [fileList, setFileList] = useState([]);

  const intl = useIntl();
  const { initialState } = useModel('@@initialState');
  const [paymentHistoryVisible, setPaymentHistoryVisible] = useState<boolean>(false);
  const [paymentHistory, setPaymentHistory] = useState<API.CommissionPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const formRef = useRef();

  useEffect(() => {
    if (paymentHistoryVisible && currentRow) {
      const paymentHistory = currentRow.payments || [];
      setPaymentHistory(paymentHistory);
    }
  }, [currentRow, paymentHistoryVisible]);

  const handlePaymentHistoryClick = () => {
    if (currentRow) {
      const paymentHistory = currentRow.payments || [];
      setPaymentHistory(paymentHistory);
    }
    setPaymentHistoryVisible(true);
  }



  const handleDownloadPDF = () => {
    const table = document.getElementById('pro-table-container');
    if (table) {
      const tableClone = table.cloneNode(true) as HTMLElement;
  
      // Remove "Option" column and checkboxes
      const ths = tableClone.querySelectorAll('th');
      ths.forEach((th, index) => {
        if (th.innerText.includes('Option')) {
          th.remove();
          tableClone.querySelectorAll(`td:nth-child(${index + 1}), th:nth-child(${index + 1})`).forEach(td => td.remove());
        }
      });
  
      tableClone.querySelectorAll('input[type="checkbox"]').forEach(input => input.remove());
  
      // Add custom CSS for PDF styling
      const style = document.createElement('style');
      style.textContent = `
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 8px;
          border: 1px solid #ddd;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
      `;
      tableClone.appendChild(style);
  
      const options = {
        margin: [0.5, 0.5, 0.5, 0.5], // Adjust margins
        filename: 'payments.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true }, // Use higher scale for better quality
        jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }, // Set landscape orientation
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } // Avoid page breaks within elements
      };
  
      html2pdf().from(tableClone).set(options).save();
    }
  };


 

  // Function to download as Excel

  const handleDownloadExcel = () => {
    const table = document.getElementById('pro-table-container');
    if (table) {
      const data = [];

      // Headers
      const headers = [
        'agent_name',
        'client_or_provider',
        'amount',
        'remaining',
        'payment_for',
        'status',
        'payment_date',
        'created_at',
        'payment_amount',
      ];

      data.push(headers);

      const bodyRows = table.querySelectorAll('tbody tr');
      bodyRows.forEach(row => {
        const rowData = [];

        // Extracting each cell data according to the specified columns
        const cells = row.querySelectorAll('td');


        const agentName = cells[0]?.innerText.trim();
        const clientOrProvider = cells[1]?.innerText.trim();
        const amount = cells[2]?.innerText.trim();
        const remaining = cells[3]?.innerText.trim();
        const paymentFor = cells[4]?.innerText.trim();
        const status = cells[5]?.innerText.trim();
        const paymentDate = cells[6]?.innerText.trim();
        const createdAt = cells[7]?.innerText.trim();
        const paymentAmount = '';


        rowData.push(
          agentName,
          clientOrProvider,
          amount,
          remaining,
          paymentFor,
          status,
          paymentDate,
          createdAt,
          paymentAmount,
        );
        data.push(rowData);
      });

      // Create and save the Excel file
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-CA'); // Format: YYYY-MM-DD
      const formattedTime = now.toLocaleTimeString('en-GB', { hour12: false }).replace(/:/g, '-'); // Format: HH-MM-SS
      const filename = `payments_${formattedDate}_${formattedTime}.xlsx`;

      XLSX.writeFile(wb, filename);
    }
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('Please upload an Excel file first');
      return;
    }
  
    setLoading(true); 
  
    const file = fileList[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e?.target?.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const currentUser = initialState?.currentUser;
   
      const jsonData = XLSX.utils.sheet_to_json(sheet).map(obj => ({
        ...obj, // Spread existing properties
        created_by: currentUser?.id, 
      }));


      console.log('jsonData',jsonData);

      return 
  
      try {
        const response = await PayByExcel({ excelData: jsonData });
  
        if (response.status) {
          message.success('Payments updated successfully');
          if (actionRef.current) {
            actionRef.current.reload();
          }
        } else {
          message.error('Failed to update payments');
        }
      } catch (error) {
        console.error('Error uploading payments:', error);
        message.error('Error uploading payments');
      } finally {
        setLoading(false); // End loading indicator
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handlePayment = async (formData: FormData) => {
    try {

      setLoading(true);

      const currentUser = initialState?.currentUser;
      const action_by = currentUser?.id;

      const amount = formData.get('amount') as string;
      const paymentData: API.ActiveCommisionListItem = {
        amount: amount,
        action_by: action_by,
        agent_id: currentRow?.agent_id
      };

      const hide = message.loading('Loading...');
      try {


        const response = await AddPayment(currentRow?.id, paymentData);
        if (response.status) {
          hide();
          setLoading(false); 
          message.success(response.message);
          return true;
        } else {
          setLoading(false); 
          if (response.data) {
            const errors = response.data.errors;
            showErrorWithLineBreaks(formatErrorMessages(errors));
          } else {
            message.error(response.message);
          }
        }
      } catch (error) {
        hide();
        setLoading(false); 
        console.log('errorrrs', error)
        message.error('Adding failed, please try again!');
        return false
      }

    } catch (error) {
      message.error('Adding failed, please try again!');
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
                  render: (text) => `TSH ${text}`,
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
      dataIndex: ['agent', 'name'],
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
      search: false,
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
      title: <FormattedMessage id="pages.searchTable.titleStatus" defaultMessage="Status" />,
      dataIndex: 'status',
      search: false,
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
      title: <FormattedMessage id="pages.searchTable.createdAt" defaultMessage="Created At" />,
      dataIndex: 'created_at',
      valueType: 'dateRange',
      search: true,
      render: (_, record) => (
        <span>{moment(record.created_at).format('YYYY-MM-DD')}</span>
      ),
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
              () => {
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
          locale: { items_per_page: "" }
        }}
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolbar={{
          title: 'Commission List',
          actions: [
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Button
                icon={<ExportOutlined />}
                onClick={handleDownloadExcel}
                style={{ marginRight: 8 }}
                disabled={loading}
              >
                Download Excel
              </Button>
              <Upload
                fileList={fileList}
                beforeUpload={file => {
                  setFileList([file]);
                  return false;
                }}
                onRemove={() => setFileList([])}
                disabled={loading}
              >
                <Button icon={<DownloadOutlined />} disabled={loading}>Upload Excel</Button>
              </Upload>
              <Button
                type="primary"
                onClick={handleUpload}
                style={{ marginLeft: 8 }}
                loading={loading} 
                disabled={loading} 
              >
                Make Excel Payments
              </Button>
            </div>
          ],
        }}
        request={async (params, sorter, filter) => {
          try {
            const response = await getActiveCommisions(params);
            let commissions = response.data.commissions;
      
            // Apply date range filter if provided
            if (params.created_at && params.created_at.length === 2) {
              const [start, end] = params.created_at;
              commissions = commissions.filter(commission => {
                const createdAt = moment(commission.created_at);
                return createdAt.isBetween(moment(start), moment(end), 'day', '[]');
              });
            }
      
            return {
              data: commissions,
              success: true,
            };
          } catch (error) {
            console.error('Error fetching Commissions data:', error);
            return {
              data: [],
              success: false,
            };
          }
        }}
        columns={columns}
      />
      <ModalForm
        title={intl.formatMessage({
          id: 'pages.searchTable.createForm.payment',
          defaultMessage: 'Add Payment',
        })}
        width="400px"
        open={createModalOpen}
        formRef={formRef}
        onOpenChange={handleModalOpen}
        onFinish={async (value) => {
          const formData = new FormData();
          formData.append('amount', value.amount);

          const success = await handlePayment(formData);

          if (success) {
            handleModalOpen(false);
            if (actionRef.current) {
              actionRef.current.reload();
            }
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
                message: 'Amount is required',
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const totalAmount = parseFloat(currentRow?.amount || 0);
                  const totalPaid = currentRow?.payments?.reduce((acc, payment) => acc + parseFloat(payment.amount), 0) || 0;
                  const amountRemaining = totalAmount - totalPaid;

                  if (value > amountRemaining) {
                    return Promise.reject(new Error(`Amount should not exceed Amount Remaining: ${amountRemaining.toFixed(2)}`));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
            width="md"
            name="amount"
            label="Amount"
            fieldProps={{
              type: 'number',
              min: 0,
              step: '0.01',
            }}
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
          <ProDescriptions
            column={2}
            title={currentRow?.agent_name}
            request={async () => ({
              data: currentRow || {},
            })}
            params={{
              id: currentRow?.agent_name,
            }}
            columns={columns}
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
