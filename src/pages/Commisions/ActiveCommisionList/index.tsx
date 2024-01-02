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
import { getActiveCommisions } from '../CommisionSlice';


const ActiveCommisionList: React.FC = () => {

  const [createModalOpen, handleModalOpen] = useState<boolean>(false);

  const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

  const [showDetail, setShowDetail] = useState<boolean>(false);

  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<API.ActiveCommisionListItem>();
  const [selectedRowsState, setSelectedRows] = useState<API.ActiveCommisionListItem[]>([]);

  const intl = useIntl();



  const handleAdd = async (formData: FormData) => {

    try {

        // If no image is uploaded, create an object without img_url
        const categoryData: API.ActiveCommisionListItem = {
          id: 0, // Set the appropriate ID
          name: name,
          img_url: '', // No image URL in this case
        };

        // Save the data to the database
        const hide = message.loading('Loading...');
        try {
          await addCategory(categoryData);
          hide();
          message.success('Added successfully');
          return true
        } catch (error) {
          hide();
          message.error('Adding failed, please try again!');
          return false
        }
      
    } catch (error) {
      message.error('Image upload failed, please try again!');
      return false
    }
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
    {
      title: <FormattedMessage id="pages.searchTable.titleOption" defaultMessage="Action" />,
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="config"
          onClick={() => {
          //  handleUpdateModalOpen(true);
            setCurrentRow(record);
          }}
        >
          <FormattedMessage id="pages.searchTable.pay" defaultMessage="Pay" />
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
        search={{
          labelWidth: 120,
         filterType: 'light', 
        }}
        request={async (params, sorter, filter) => {
          try {      
            const response = await getActiveCommisions(params);
            const commisions = response.data.commissions            ;
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
        title={intl.formatMessage({
          id: 'pages.searchTable.createForm.newCategory',
          defaultMessage: 'Provider Name',
        })}
        width="400px"
        open={createModalOpen}
        onOpenChange={handleModalOpen}
        onFinish={async (value) => {
          const formData = new FormData();
          formData.append('name', value.name);
          if (value.image) {
            formData.append('image', value.image[0].originFileObj);
          }

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
          <ProFormUploadButton
            name="image"
            label="Upload Image"
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
