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
import { FormattedMessage, useIntl, useRequest } from '@umijs/max';
import { Button, Drawer, Image, Input, Tag, message } from 'antd';
import React, { useRef, useState, useEffect } from 'react';
//import type { FormValueType } from './components/UpdateForm';
import UpdateForm from './components/UpdateForm';
import { storage } from './../../firebase/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getProviderDocs, updateDocStatus } from './ProviderDocsSlice';
import { useParams } from 'react-router-dom';
import { Document } from 'react-pdf';



const ProviderDocsList: React.FC = () => {

  const [createModalOpen, handleModalOpen] = useState<boolean>(false);

  const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

  const [showDetail, setShowDetail] = useState<boolean>(false);

  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<API.ProviderDocsListItem>();
  const [selectedRowsState, setSelectedRows] = useState<API.ProviderDocsListItem[]>([]);
  const [categories, setCategories] = useState([]);
  const { id } = useParams();
  const { data, error, loading } = useRequest(() => getProviderDocs(Number(id)));
  const [tableData, setTableData] = useState<API.ProviderDocsListItem[]>([]);

  const intl = useIntl();



  const [documentDrawerVisible, setDocumentDrawerVisible] = useState<boolean>(false);
  const [currentDocument, setCurrentDocument] = useState<API.ProviderDocsListItem | undefined>(undefined);
  const handleOpenDocumentDrawer = (document: API.ProviderDocsListItem) => {
    setCurrentDocument(document);
    setDocumentDrawerVisible(true);
  };


  const handleStatus=async (id,status)=>{
   
    const response = await updateDocStatus(id, { status });

      if(response?.status){
      message.success(response?.message);
      setDocumentDrawerVisible(false);
      setTableData((prevData) =>
      prevData.map((row) =>
        row.id === id ? { ...row, status: response.data.status } : row
      )
    );
      }else{
        message.error(response?.message);
      }
      if (actionRef.current) {
        actionRef.current.reloadAndRest(); 
      }
   //   return true;
  }  

  const DocumentDrawer = (
    <Drawer
      width={800}
      visible={documentDrawerVisible}
     
      onClose={() => {
        setCurrentDocument(undefined);
        setDocumentDrawerVisible(false);
      }}
      title={currentDocument?.doc_format}
    >
        <div>
       {currentDocument?.status === 'Uploaded' && (
          <>
            <Button style={{marginRight:20}} onClick={()=>handleStatus(currentDocument?.id,'Pending')}>Pending</Button>
            <Button  style={{marginRight:20}} onClick={()=>handleStatus(currentDocument?.id,'Approved')}>Approved</Button>
            <Button style={{marginRight:20}} onClick={()=>handleStatus(currentDocument?.id,'Rejected')}>Reject</Button>
          </>
        )}
        {currentDocument?.status === 'Pending' && (
          <>
            <Button style={{marginRight:20}} onClick={()=>handleStatus(currentDocument?.id,'Approved')}>Approve</Button>
            <Button style={{marginRight:20}} onClick={()=>handleStatus(currentDocument?.id,'Rejected')}>Reject</Button>
          </>
        )}
        {currentDocument?.status === 'Approved' && (
          <>
            <Button style={{marginRight:20}} onClick={()=>handleStatus(currentDocument?.id,'Pending')}>Pending</Button>
            <Button style={{marginRight:20}} onClick={()=>handleStatus(currentDocument?.id,'Rejected')}>Reject</Button>
          </>
        )}
        {currentDocument?.status === 'Rejected' && (
          <Button style={{marginRight:20}} onClick={()=>handleStatus(currentDocument?.id,'Approved')}>Approve</Button>
        )}
         </div>
          <div style={{paddingTop:20}}>
      {currentDocument?.doc_type && currentDocument?.doc_url && (
        <>
          {currentDocument.doc_type.startsWith('image/') && (
            <Image
              src={currentDocument.doc_url}
              alt={currentDocument.doc_format}
              style={{ width: '100%', height: 'auto' }}
            />
          )}
          {currentDocument.doc_type === 'application/pdf' && (
            <Document file={currentDocument.doc_url} onLoadSuccess={console.log}>
              {/* <Page pageNumber={1} /> */}
            </Document>
            
          )}
        </>
      )}
      </div>
    </Drawer>
  );


  const handleRemove = async (selectedRows: API.ProviderDocsListItem[]) => {
  

    const hide = message.loading('Loading....');
    if (!selectedRows) return true;
    try {
      // console.log('in try and catch');
      await removeCategory({
        key: selectedRows.map((row) => row.id),
      });
      hide();
      message.success('Deleted successfully and will refresh soon');
      if (actionRef.current) {
        console.log('invoking this which is null')
        actionRef.current.reloadAndRest();
      }
      return true;
    } catch (error) {
      hide();
      message.error('Delete failed, please try again');
      return false;
    }
  };



  

  const handleAdd = async (formData: FormData) => {

    const name = formData.get('name') as string;
    const imageFile = formData.get('image') as File;


     

    try {
      const storageRef = ref(storage, `images/${imageFile.name}`);

      if (imageFile) {
        const uploadTask = uploadBytesResumable(storageRef, imageFile);

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
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              const categoryData: API.ProviderDocsListItem = {
                id: 0, // Set the appropriate ID
                name: name,
                img_url: downloadURL, // Save the download URL to the database
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
              } finally {
                handleModalOpen(false);
                actionRef.current.reload();
              }
            } catch (error) {
              message.error('Error getting download URL, please try again!');
              return false
            } finally {
              handleModalOpen(false);
            }
          }
        );
      } else {
        // If no image is uploaded, create an object without img_url
        const categoryData: API.ProviderDocsListItem = {
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
      }
    } catch (error) {
      message.error('Image upload failed, please try again!');
      return false
    }
  };


  


  const columns: ProColumns<API.ProviderDocsListItem>[] = [
    {
      title: (
        <FormattedMessage
          id="pages.searchTable.updateForm.docName"
          defaultMessage="Doc Name"
        />
      ),
      dataIndex: 'doc_format',
      valueType: 'text',
      tip: 'The Doc Name is the unique key',
      render: (dom, entity) => {
        return (
          <a
          onClick={() => {
            handleOpenDocumentDrawer(entity);
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
            id="pages.searchTable.updateForm.docType"
            defaultMessage="Doc Format"
          />
        ),
        dataIndex: 'doc_type',
        valueType: 'text',
        tip: 'The Doc Format',
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
            id="pages.searchTable.updateForm.docType"
            defaultMessage="Doc Type"
          />
        ),
        dataIndex: 'doc_type',
        valueType: 'text',
        tip: 'The Doc is for business or registration',
        render: (_, entity) => {
          const workingDocName = entity.working_document?.doc_name;
          const businessDocName = entity.business_document?.name;
    
          // Check if working_document is available, use its doc_name
          if (workingDocName) {
            return (
              <a
                onClick={() => {
                  setCurrentRow(entity);
                  setShowDetail(true);
                }}
              >
                {workingDocName}
              </a>
            );
          }
          // If working_document is not available, check if business_document is available
          else if (businessDocName) {
            return (
              <a
                onClick={() => {
                  setCurrentRow(entity);
                  setShowDetail(true);
                }}
              >
                {businessDocName}{` (Business)`}
              </a>
            );
          }
          // If both working_document and business_document are null, display a default value
          else {
            return (
              <a
                onClick={() => {
                  setCurrentRow(entity);
                  setShowDetail(true);
                }}
              >
                No Doc Type Available
              </a>
            );
          }
        },
        search: false,
      },

      {
        title: <FormattedMessage id="pages.searchTable.titleStatus" defaultMessage="Status" />,
        dataIndex: 'status',
        hideInForm: true,
        search: false,
        render: (text, record) => {
            let color = '';
            if (text == 'Uploaded') {
                color = 'orange';
            } else if (text == 'Pending') {  //'Pending', 'Approved', 'Rejected'
                color = 'yellow'
            } else if (text == 'Approved') {
                color = 'green';
            }else if (text == 'Rejected') {
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
          id: 'pages.searchTable.ProviderName',
          defaultMessage: `${data?.name}' Documents`,
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
        //  filterType: 'light', // Use a light filter form for better layout
        }}
        request={async (params, sorter, filter) => {
          try {      

            const response = await getProviderDocs(id,params);
            const docs = response.data.documents;
            // Filter the data based on the 'name' filter
            const filteredDocs = docs.filter(doc =>
              params.name
                ? doc.doc_format
                    .toLowerCase()
                    .split(' ')
                    .some(word => word.startsWith(params.doc_format.toLowerCase()))
                : true
            );
      
            return {
              data: filteredDocs,
              success: true,
            };
          } catch (error) {
            console.error('Error fetching Docs data:', error);
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
          defaultMessage: 'Doc Name',
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
      {/* <UpdateForm
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
      /> */}

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
          <ProDescriptions<API.ProviderDocsListItem>
            column={2}
            title={currentRow?.name}
            request={async () => ({
              data: currentRow || {},
            })}
            params={{
              id: currentRow?.name,
            }}
            columns={columns as ProDescriptionsItemProps<API.ProviderDocsListItem>[]}
          />
        )}
      </Drawer>
      {DocumentDrawer}

    </PageContainer>
  );
};

export default ProviderDocsList;
