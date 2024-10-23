import { PlusOutlined } from '@ant-design/icons';
import { ActionType, ProColumns, ProDescriptionsItemProps } from '@ant-design/pro-components';
import {
  FooterToolbar,
  ModalForm,
  PageContainer,
  ProDescriptions,
  ProFormText,
  ProFormUploadButton,
  ProTable,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl, useModel } from '@umijs/max';
import { Button, Drawer, Tag, message } from 'antd';
import React, { useRef, useState } from 'react';
import { storage } from './../../firebase/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { addTermOfService, getTermsOfService, removeTermsOfService } from './TermOfServiceSlice';
import moment from 'moment';
import UpdateForm from './components/UpdateForm';

const TermOfServiceList: React.FC = () => {
  const [createModalOpen, handleModalOpen] = useState<boolean>(false);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<API.TermOfServiceListItem>();
  const [selectedRowsState, setSelectedRows] = useState<API.TermOfServiceListItem[]>([]);
  const intl = useIntl();
  const [loading, setLoading] = useState(false);
  const formRef = useRef();
  const { initialState } = useModel('@@initialState');
  const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

  const currentUser = initialState?.currentUser;
  const action_by = currentUser?.id;

  const handleRemove = async (selectedRows: API.TermOfServiceListItem[]) => {
    const hide = message.loading('Loading...');
    if (!selectedRows) return true;
    try {

      await removeTermsOfService({
        key: selectedRows.map((row) => row.id),
        deleted_by:action_by
      });

      hide();
      message.success('Deleted successfully and will refresh soon');
      if (actionRef.current) {
        actionRef.current.reloadAndRest();
      }
      return true;
    } catch (error) {
     
      hide();
      message.error(`Delete failed, please try again ${error}`);
      return false;
    }
  };

  const handleAdd = async (formData: FormData) => {

    const pdfFile = formData.get('pdf_file') as File;

    const newFormData = new FormData();

    if (pdfFile) {
      try {

        newFormData.append('file', pdfFile);
        newFormData.append('doc_name', pdfFile.name);
        newFormData.append('doc_type', pdfFile.type);
        newFormData.append('created_by', action_by);

        try {
          const hide = message.loading('Loading...');
          await addTermOfService(newFormData);
          setLoading(false);
          hide();
          message.success('Added successfully');
          return true;
        } catch (error) {
          hide();
          message.error('Adding failed, please try again!');
          setLoading(false);
          return false;
        } finally {
          handleModalOpen(false);
          formRef.current?.resetFields();
        }

      } catch (error) {
        message.error('Error getting download URL, please try again!');
        return false;
      }
    }
  };

  const columns: ProColumns<API.TermOfServiceListItem>[] = [
    {
      title: 'Terms of Service Link',
      dataIndex: 'url',
      render: (_, record) => (
        <a href={record.url} target="_blank" rel="noopener noreferrer">
          View PDF
        </a>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      valueType: 'text',
      render: (text) => moment(text).format('DD/MM/YYYY h:mm A'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (text) => (
        <Tag color={text === 'Active' ? 'green' : 'red'}>{text}</Tag>
      ),
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
      <ProTable<API.TermOfServiceListItem>
        actionRef={actionRef}
        rowKey="id"
        toolBarRender={() => [
          <Button
            type="primary"
            onClick={() => handleModalOpen(true)}
          >
            <PlusOutlined /> New Terms of Service
          </Button>,
        ]}
        request={async (params) => {
          const response = await getTermsOfService(params);
          return {
            data: response.data,
            success: true,
          };
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
        </FooterToolbar>
      )}

      <UpdateForm
        onSubmit={async (value) => {
          // const success = await handleUpdate(value);
          // if (success) {
          //   handleUpdateModalOpen(false);
          //   setCurrentRow(undefined);
          //   if (actionRef.current) {
          //     actionRef.current.reload();
          //   }
          // }
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
      <ModalForm
        title="Add Terms of Service"
        width="400px"
        open={createModalOpen}
        formRef={formRef}
        onOpenChange={handleModalOpen}
        onFinish={async (value) => {
          const formData = new FormData();
          formData.append('pdf_file', value.pdf_file[0].originFileObj);

          const success = await handleAdd(formData);

          if (success) {
            handleModalOpen(false);
            actionRef.current?.reload();
            formRef.current?.resetFields();
          }
        }}
      >

        <ProFormUploadButton
          name="pdf_file"
          label="Upload PDF"
          max={1}
          fieldProps={{
            accept: '.pdf',
          }}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default TermOfServiceList;
