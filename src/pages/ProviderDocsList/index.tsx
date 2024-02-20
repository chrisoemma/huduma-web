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
  ProFormSelect,
  PageLoading,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl, useRequest } from '@umijs/max';
import { Button, Drawer, Image, Input, Tag, message, Form } from 'antd';
import React, { useRef, useState, useEffect } from 'react';
//import type { FormValueType } from './components/UpdateForm';
import UpdateForm from './components/UpdateForm';
import { storage } from './../../firebase/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addProviderDoc, getProviderBusiness, getProviderDocs, updateDocStatus } from './ProviderDocsSlice';
import { useParams } from 'react-router-dom';

import { getRegistrationDoc } from '../RegistrationDocList/RegistrationDocSlice';
import { formatErrorMessages, showErrorWithLineBreaks } from '@/utils/function';
import { getNida, validateNida } from '../NidaSlice';
import { Document, Page,pdfjs } from 'react-pdf';




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
  const [regDocs, setRegDocs] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [form] = ProForm.useForm();
  const { Item } = Form;

  const [documentDrawerVisible, setDocumentDrawerVisible] = useState<boolean>(false);
  const [currentDocument, setCurrentDocument] = useState<API.ProviderDocsListItem | undefined>(undefined);
  const [showNidaValidationDrawer, setShowNidaValidationDrawer] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState(null);
  const [providerData, setProviderData] = useState(null);
  const [nidaNumber, setNida] = useState(null)
  const [loadingValidation, setLoading] = useState(false);


  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }



  // pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  //   'pdfjs-dist/build/pdf.worker.min.js',
  //   import.meta.url,
  // ).toString();
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

  const handleOpenDocumentDrawer = (document: API.ProviderDocsListItem, nida) => {
    setCurrentDocument(document);
    setNida(nida)
    setDocumentDrawerVisible(true);
  };


  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getRegistrationDoc();
        const regDocs = response.data.docs;
        //  console.log('regDocs',regDocs);
        setRegDocs(regDocs);
        actionRef.current?.reloadAndRest();
      } catch (error) {
        console.error('Error fetching Reg docs data:', error);
      }
    }
    fetchData();
  }, []);


  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getProviderBusiness(id);
        const businesses = response.data.businesses;
        // console.log('businesses',businesses);
        setBusinesses(businesses);
        actionRef.current?.reloadAndRest();
      } catch (error) {
        console.error('Error fetching Businesses data:', error);
      }
    }
    fetchData();
  }, []);

  const handleNidaValidationDrawerOpen = () => {
    setShowNidaValidationDrawer(true);
  };

  const handleNidaValidationDrawerClose = () => {
    setValidationResult(null);
    setShowNidaValidationDrawer(false);

  };

  const handleNidaChecking = async (nida) => {
    try {
      setLoading(true); // Set loading to true when starting the operation

      const nidaValidationData = {
        status: '',
        user_type: 'Provider',
      };

      const response = await getNida(nida);

      if (response.error) {
        // Case 1: Validation error
        setValidationResult({ error: response.obj.error });
      } else if (response.obj.error) {
        // Case 2: NIDA number does not exist
        nidaValidationData.status = 'A.Invalid';

        const nidaResponse = await validateNida(currentDocument?.provider_id, nidaValidationData);
        actionRef.current?.reloadAndRest();

        setValidationResult({ error: 'NIDA Number does not exist' });
      } else if (response.obj.result) {
        // Case 3: Successful NIDA number validation
        const { FIRSTNAME, MIDDLENAME, SURNAME, SEX, DateofBirth } = response.obj.result;

        // Update state with successful result
        nidaValidationData.status = 'A.Valid';
        const nidaResponse = await validateNida(currentDocument?.provider_id, nidaValidationData);
        actionRef.current?.reloadAndRest();
        setValidationResult({ result: response.obj.result });
      }

      return response;
    } catch (error) {
      console.error(error);
      setValidationResult({ error: 'Failed to perform NIDA checking' });
      return { error: 'Failed to perform NIDA checking' };
    } finally {
      setLoading(false);
    }
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'S.Valid':
      case 'A.Valid':
        return 'green';
      case 'S.Invalid':
      case 'A.Invalid':
        return 'red';
      case 'A.Pending':
      case 'S.Pending':
        return 'orange';
      default:
        return 'gray';
    }
  };



  const handleStatus = async (id, status) => {

    const response = await updateDocStatus(id, { status });

    if (response?.status) {
      message.success(response?.message);
      setDocumentDrawerVisible(false);
      setTableData((prevData) =>
        prevData.map((row) =>
          row.id === id ? { ...row, status: response.data.status } : row
        )
      );
    } else {
      message.error(response?.message);
    }
    if (actionRef.current) {
      actionRef.current.reloadAndRest();
    }
    //   return true;
  }



  const NidaValidationDrawer = (

    <Drawer
      width={400}
      title="Validate NIDA Number"
      placement="right"
      onClose={handleNidaValidationDrawerClose}
      visible={showNidaValidationDrawer}
      destroyOnClose
    >


      <Form>
        {validationResult && (

          <div style={{ marginTop: 20 }}>
            {validationResult.error ? (
              <Tag color="red">Error: {validationResult.error}</Tag>
            ) : (
              <div>
                <Tag color="green" style={{ fontWeight: 'bold' }}>
                  NIDA Validation Successful!
                </Tag>
                <p>First Name: {validationResult.result.FIRSTNAME}</p>
                <p>Middle Name: {validationResult.result.MIDDLENAME}</p>
                <p> Last Name: {validationResult.result.SURNAME}</p>
                {/* Add more fields as needed */}
              </div>
            )}
          </div>
        )}
        <p>The NIDA status is : <Tag color={getStatusColor(currentRow?.nida_statuses?.[currentRow?.nida_statuses.length - 1]?.status)}>{currentRow?.nida_statuses?.[currentRow?.nida_statuses.length - 1]?.status}</Tag></p>
        <Item
          label="NIDA Number"
          name="nidaNumber"
          initialValue={nidaNumber || ''}
          rules={[
            {
              required: true,
              message: 'Please enter NIDA Number',
            },
          ]}
        >
          <Input
            value={nidaNumber || ''}
            disabled

          />
        </Item>

        <Button type="primary" onClick={() => handleNidaChecking(currentRow?.nida)} disabled={loadingValidation}>
          {loadingValidation ? 'Validating...' : 'Validate NIDA'}
        </Button>
        {loadingValidation && <PageLoading />}

        <div style={{ marginTop: 20 }}>
          <p>This NIDA has passed through the following statuses:</p>
          {currentRow?.nida_statuses?.map((status, index) => (
            <Tag key={index} color={getStatusColor(status.status)}>
              {status.status}
            </Tag>
          ))}
        </div>
      </Form>

    </Drawer>

  );

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
            <Button style={{ marginRight: 20 }} onClick={() => handleStatus(currentDocument?.id, 'Pending')}>Pending</Button>
            <Button style={{ marginRight: 20 }} onClick={() => handleStatus(currentDocument?.id, 'Approved')}>Approved</Button>
            <Button style={{ marginRight: 20 }} onClick={() => handleStatus(currentDocument?.id, 'Rejected')}>Reject</Button>
          </>
        )}
        {currentDocument?.status === 'Pending' && (
          <>
            <Button style={{ marginRight: 20 }} onClick={() => handleStatus(currentDocument?.id, 'Approved')}>Approve</Button>
            <Button style={{ marginRight: 20 }} onClick={() => handleStatus(currentDocument?.id, 'Rejected')}>Reject</Button>
          </>
        )}
        {currentDocument?.status === 'Approved' && (
          <>
            <Button style={{ marginRight: 20 }} onClick={() => handleStatus(currentDocument?.id, 'Pending')}>Pending</Button>
            <Button style={{ marginRight: 20 }} onClick={() => handleStatus(currentDocument?.id, 'Rejected')}>Reject</Button>
          </>
        )}
        {currentDocument?.status === 'Rejected' && (
          <Button style={{ marginRight: 20 }} onClick={() => handleStatus(currentDocument?.id, 'Approved')}>Approve</Button>
        )}

        {
          currentDocument?.doc_format == 'Nida' ? (
            <Button style={{ marginLeft: 20 }} type="primary" onClick={handleNidaValidationDrawerOpen}>
              Validate NIDA
            </Button>
          ) : (<></>)
        }

      </div>
      <div style={{ paddingTop: 20 }}>
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
            <Document file={currentDocument?.doc_url}   
               onLoadError={(error) => console.log('Error loading PDF:', error)}  
               onLoadSuccess={onDocumentLoadSuccess}>
              <Page pageNumber={pageNumber} />
                {console.log('pdfff',currentDocument?.doc_url)}
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


  const [formData, setFormData] = useState({
    name: '',
    doc_type: 'registration', // Default document type
    doc_name: '', // Registration Doc field
    business: '', // Business field
    // ... (other form fields)
  });


  const handleAdd = async (formData: FormData) => {

    const imageFile = formData.get('doc_url') as File;
    const business = formData.get('business') as string | undefined;
    const doc_format = formData.get('doc_format') as string;
    const working_document_id = formData.get('working_document_id');
    const doc_type = formData.get('doc_type') as string
    const businessId = business === 'undefined' ? null : business

    try {

      const fileType = imageFile.type;
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
              const providerDocData: API.ProviderDocList = {
                id: 0,
                business: businessId,
                doc_url: downloadURL,
                working_document_id: Number(working_document_id),
                doc_format: doc_format,
                document_type: fileType
              };
              // Save the data to the database
              const hide = message.loading('Loading...');
              try {
                const response = await addProviderDoc(id, providerDocData);
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
        message.error('Please upload Document of type image or pdf')
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
              handleOpenDocumentDrawer(entity, entity.provider.nida);
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
      search: false,
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
        pagination={{
          pageSizeOptions: ['15', '30', '60', '100'],
          defaultPageSize: 15, 
          showSizeChanger: true, 
          locale: {items_per_page: ""}
        }}
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
            const response = await getProviderDocs(id, params);
            const docs = response.data.documents;
            const provider = response.data

            // Fetch provider information for each document
            const dataWithProvider = docs.map(doc => ({
              ...doc,
              provider: {
                nida: provider.nida, // Adjust the field according to your actual structure
                // Include other provider information if needed
              },
            }));

            // Filter the data based on the 'name' filter
            const filteredDocs = dataWithProvider.filter((doc) =>
              params.name
                ? doc.doc_format
                  .toLowerCase()
                  .split(' ')
                  .some((word) => word.startsWith(params.doc_format.toLowerCase()))
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
          id: 'pages.searchTable.createForm.newDoc',
          defaultMessage: 'New Document',
        })}
        width="400px"
        open={createModalOpen}
        onOpenChange={handleModalOpen}
        onFinish={async (value) => {
          const formData = new FormData();
          formData.append('doc_format', value.name);
          formData.append('business', value.business);
          formData.append('working_document_id', value.working_document_id);
          formData.append('doc_type', value.doc_type)
          if (value.image) {
            formData.append('doc_url', value.image[0].originFileObj);
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

          <ProFormSelect
            name="doc_type"
            width="md"
            label={intl.formatMessage({
              id: 'pages.searchTable.updateForm.docType',
              defaultMessage: 'Select Document Type',
            })}
            valueEnum={{
              registration: 'Registration Doc',
              business: 'Business Doc',
            }}
            onChange={(value) => {
              setFormData((prevData) => {
                const updatedData = { ...prevData, doc_type: value };
                // If "registration" is selected, reset the value of the "business" field
                if (value === 'registration') {
                  updatedData.business = '';
                }

                // If "business" is selected, reset the value of the "doc_name" field (if needed)
                if (value === 'business') {
                  updatedData.doc_name = '';
                }

                return updatedData;
              });
            }}
          />

          <ProFormSelect
            name="working_document_id"
            width="md"
            label={intl.formatMessage({
              id: 'pages.searchTable.updateForm.registration',
              defaultMessage: 'Select Registration Doc',
            })}
            valueEnum={regDocs.reduce((enumObj, doc) => {
              enumObj[doc.id] = doc.doc_name;
              return enumObj;
            }, {})}

            disabled={formData.doc_type !== 'registration'}
          //{...(formData.doc_type === 'registration' ? { initialValue: '' } : {})}
          />


          <ProFormSelect
            name="business"
            width="md"
            label={intl.formatMessage({
              id: 'pages.searchTable.updateForm.registration',
              defaultMessage: 'Select Business',
            })}
            valueEnum={businesses?.reduce((enumObj, business) => {
              enumObj[business.service.id] = business.service.name;
              return enumObj;
            }, {})}
            disabled={formData.doc_type !== 'business'}
          // {...(formData.doc_type === 'business' ? { initialValue: '' } : {})}
          />

          <ProFormUploadButton
            name="image"
            label="Upload document"
            style={{ display: 'none' }}
            fieldProps={{
              accept: 'image/*,.pdf',
              multiple: false,
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

      {NidaValidationDrawer}

    </PageContainer>
  );
};

export default ProviderDocsList;
