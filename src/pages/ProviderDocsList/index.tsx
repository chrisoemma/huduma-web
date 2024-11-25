import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProDescriptionsItemProps } from '@ant-design/pro-components';
import Tesseract from 'tesseract.js';
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
import { Button, Drawer, Image, Input, Tag, message, Form, Modal, List, Select } from 'antd';
import React, { useRef, useState, useEffect } from 'react';
//import type { FormValueType } from './components/UpdateForm';
import UpdateForm from './components/UpdateForm';
import { storage } from './../../firebase/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addProviderDoc, getProviderBusiness, getProviderDocs, providerDesignationDoc, removeDocs, updateDocStatus } from './ProviderDocsSlice';
import { useParams } from 'react-router-dom';

import { getRegistrationDoc } from '../RegistrationDocList/RegistrationDocSlice';
import { formatErrorMessages, showErrorWithLineBreaks } from '@/utils/function';
import { getNida, validateNida } from '../NidaSlice';
import { Document, Page,pdfjs } from 'react-pdf';
import { useNavigate, useLocation } from 'react-router-dom';





const ProviderDocsList: React.FC = () => {

  const [createModalOpen, handleModalOpen] = useState<boolean>(false);

  const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [ocrResult, setOcrResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedNidaType, setSelectedNidaType] = useState(null);
  const [nidaNumberValidation, setNidaNumberValidation] = useState(currentRow?.nida || '');


 

  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<API.ProviderDocsListItem>();
  const [selectedRowsState, setSelectedRows] = useState<API.ProviderDocsListItem[]>([]);
  const [categories, setCategories] = useState([]);
  const { id } = useParams();
  const { data, error } = useRequest(() => getProviderDocs(Number(id)));
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
  const [loadingValidation, setLoadingValidation] = useState(false);
  const [loading,setLoading]=useState(false);
  const formRef = useRef();


  const navigate = useNavigate();
  const location = useLocation();
  const { Option } = Select;

  //console.log('currentDocument?.doc_format',currentDocument);

  const handleBackClick = () => {
    if (location.state && location.state.from) {
      navigate(location.state.from, { state: { providerId: location.state.providerId } });
    } else {
      navigate('/user-management/service-providers');
    }
  }


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


  const [designationDocs, setDesignationDocs] = useState([]);
  const [designationModalVisible, setDesignationModalVisible] = useState(false);

  const handleDesignationModalOpen = () => {
    setDesignationModalVisible(true);
  };

  const handleDesignationModalClose = () => {
    setDesignationModalVisible(false);
  };


  useEffect(() => {
      async function fetchData() {
          try {
              const response = await providerDesignationDoc(id);
              const designationDocs = response.data.documents;

              console.log('designationssss',designationDocs);
              setDesignationDocs(designationDocs);
             
          } catch (error) {
              console.error('Error fetching Roles data:', error);
          }
      }

      fetchData();
  }, []);


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

  const handleNidaChecking = async (nida,type) => {
    try {
      setLoading(true); 

      const response = await getNida(nida);

      console.log('nida checking',nida)

      if (response.error) {
        setValidationResult({ error: response.obj.error });
      } else if (response.obj.error) {    
        setValidationResult({ error: 'NIDA Number does not exist' });
        actionRef.current?.reloadAndRest();
      } else if (response.obj.result) {
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


  const handleNidaTypeChange = (value) => {
    setSelectedNidaType(value);
  };

  
  const handleNidaApproval = async(value,nida,type)=>{

    Modal.confirm({
        title: `Are you sure you want to ${value.toLowerCase()} this`,
        okText: 'Yes',
        cancelText: 'No',
        onOk: async () => {

    try{
      const nidaValidationData = {
        status: '',
        user_type: 'Provider',
      };

      setLoading(true);
       let dataMessage=''
      if (value=='Reject') {
        nidaValidationData.status = 'A.Invalid';
         dataMessage='Rejected successfully'
      } else{         
        nidaValidationData.status = 'A.Valid';
         dataMessage='Approved successfully'
      }

      const nidaResponse = await validateNida(currentRow?.id, nidaValidationData);
      message.success(dataMessage);
      actionRef.current?.reloadAndRest();
        
    } catch (error) {
        console.error(error);
        return { error: 'Failed to perform NIDA checking' };
      } finally {
        setLoading(false);
      }

    }
});
}


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



  const handleTogglePreviewable = (doc: API.ProviderDocsListItem) => {
    setPreviewableDocs((prev) => {
      if (prev.some((d) => d.id === doc.id)) {
        // Remove document from previewable list
        return prev.filter((d) => d.id !== doc.id);
      } else {
        // Add document to previewable list (limit to 2 for comparison)
        if (prev.length < 2) {
          const updatedDocs = [...prev, doc];
  
          // Open the modal automatically if it's the second previewable document
          if (updatedDocs.length === 2) {
            setIsModalVisible(true);// Assuming you have a state to control modal visibility
          }
  
          return updatedDocs;
        } else {
          message.warning('Only two documents can be previewed at a time.');
          return prev;
        }
      }
    });
  };


  const isValidateButtonDisabled =
  !selectedNidaType ||
  nidaNumberValidation.length !== 20 ||
  !/^\d{20}$/.test(nidaNumberValidation);

  const NidaValidationDrawer = (
    <Drawer
      width={400}
      title="Validate NIDA Number"
      placement="right"
      onClose={handleNidaValidationDrawerClose}
      visible={showNidaValidationDrawer}
      destroyOnClose
    >
      <Form layout="vertical">
        {validationResult?.error && (
          <div style={{ marginBottom: 20 }}>
            <Tag color="red">Error: {validationResult.error}</Tag>
          </div>
        )}
  
        {/* Dropdown for NIDA Type Selection */}
        <Item
          label="Select NIDA Type"
          name="nidaType"
          rules={[{ required: true, message: 'Please select a NIDA type' }]}
        >
          <Select placeholder="Choose NIDA Type" onChange={handleNidaTypeChange}>
            <Option value="guarantor">Guarantor NIDA</Option>
            <Option value="provider">Provider NIDA</Option>
          </Select>
        </Item>
  
        {/* Editable Input for NIDA Number */}
        <Item
  label="NIDA Number"
  name="nidaNumber"
  rules={[
    { required: true, message: 'Please enter NIDA Number' },
    {
      pattern: /^\d*$/,
      message: 'NIDA Number must contain only digits',
    },
  ]}
>
  <div style={{ position: 'relative' }}>
    <Input
      placeholder="Enter NIDA Number"
      value={nidaNumberValidation}
      onChange={(e) => setNidaNumberValidation(e.target.value)}
      maxLength={20} // Optional: Limit input to 20 digits
    />
    <div style={{ marginTop: 5, fontSize: '12px', color: '#888' }}>
      {`Digits entered: ${nidaNumberValidation.length}/20`}
    </div>
  </div>
</Item>
  
        {/* Validate NIDA Button */}
        <div style={{ marginBottom: 20 }}>
          <Button
            type="primary"
            onClick={() => handleNidaChecking(nidaNumberValidation, selectedNidaType)}
            disabled={isValidateButtonDisabled || loading}
          >
            {loading ? 'Validating...' : 'Validate NIDA'}
          </Button>
        </div>
  
        {loading && <PageLoading />}
  
        {/* Validation Result and Comparison */}
        {validationResult && (
          <div style={{ marginTop: 20 }}>
            {validationResult.error ? (
              <Tag color="red">Error: {validationResult.error}</Tag>
            ) : (
              <>
              <Tag color="green" style={{ fontWeight: 'bold' }}>
                NIDA Validation Successful!
              </Tag>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
              {/* Current User Details */}
              <div>
                <h4>User Input Details</h4>
                <p>First Name: {currentRow?.first_name || 'N/A'}</p>
                <p>Last Name: {currentRow?.last_name || 'N/A'}</p>
                <p>Phone Number: {currentRow?.phone || 'N/A'}</p>
              </div>

              {/* NIDA Details */}
              <div>
                <h4>NIDA Details</h4>
                <p>First Name: {validationResult.result.FIRSTNAME}</p>
                <p>Last Name: {validationResult.result.SURNAME}</p>
                <p>Phone Number: {validationResult.result.PHONE || 'N/A'}</p>
              </div>
            </div>
              </>
            )}
          </div>
        )}
  
        {/* Approve/Reject Buttons */}
        <div style={{ marginTop: 20, display: 'flex', gap: '10px' }}>
          <Button
            type="primary"
            danger
            onClick={() => handleNidaApproval('Reject', nidaNumberValidation, selectedNidaType)}
            disabled={isValidateButtonDisabled || loading}
          >
            {loading ? 'Rejecting...' : 'Reject'}
          </Button>
          <Button
            type="primary"
            onClick={() => handleNidaApproval('Approve', nidaNumberValidation, selectedNidaType)}
            disabled={isValidateButtonDisabled || loading}
          >
            {loading ? 'Approving...' : 'Approve'}
          </Button>
        </div>
  
        {/* NIDA Status History */}
        <div style={{ marginTop: 20 }}>
          <h4>NIDA Status History</h4>
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
  currentDocument?.working_document?.doc_name?.toLowerCase().includes('nida') ? (
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



   //console.log('current',currentDocument);

  const handleRemove = async (selectedRows: API.ProviderDocsListItem[]) => {

    const hide = message.loading('Loading....');
    if (!selectedRows) return true;
    try {
      // console.log('in try and catch');
      await removeDocs({
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

    setLoading(true);
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
                  setLoading(false);
                  return true;
                } else {
                  if (response.data) {
                    const errors = response.data.errors;
                    showErrorWithLineBreaks(formatErrorMessages(errors));
                    setLoading(false);
                  } else {
                    setLoading(false);
                    message.error(response.message);
                  }
                }
              } catch (error) {
                hide();
                message.error('Adding failed, please try again!');
                setLoading(false);
                return false
              } finally {
                handleModalOpen(false);
                setLoading(false);
                actionRef.current.reload();
              }
            } catch (error) {
              message.error('Error getting download URL, please try again!');
              return false
            } finally {
              setLoading(false);
              handleModalOpen(false);
            }
          }
        );
      } else {
        setLoading(false);
        message.error('Please upload Document of type image or pdf')
      }
    } catch (error) {
        setLoading(false);
      message.error('Image upload failed, please try again!');
      return false
    }
  };



  const [previewableDocs, setPreviewableDocs] = useState<API.ProviderDocsListItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  
  // Manual button to open the modal
  const handleManualOpenModal = () => {
    setIsModalVisible(true);
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
      title: 'Action',
      dataIndex: 'action',
      render: (_, record) => {
        const isPreviewable = previewableDocs.some((doc) => doc.id === record.id);
        return (
          <Button
            type={isPreviewable ? 'default' : 'primary'}
            onClick={() => handleTogglePreviewable(record)}
          >
            {isPreviewable ? 'Remove Previewable' : 'Add to Previewable'}
          </Button>
        );
      },
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
          type="default"
          key="previewModal"
          onClick={handleManualOpenModal}
          disabled={previewableDocs.length === 0} // Disable button if no previewable docs
        >
          <FormattedMessage id="pages.searchTable.previewDocs" defaultMessage="Preview Docs" />
        </Button>,

          <Button
          type="primary"
          key="primary"
          onClick={handleBackClick}
        >
          <PlusOutlined /> <FormattedMessage id="pages.searchTable.goBack" defaultMessage="Go Back" />
        </Button>,

          <Button
            type="primary"
            key="primary"
            style={{backgroundColor:'orange'}}
            onClick={handleDesignationModalOpen}
          >
             <FormattedMessage id="pages.searchTable.requiredDoc" defaultMessage="Required Docs" />
          </Button>,
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
        formRef={formRef}
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
            formRef.current.resetFields();
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


      <Modal
      visible={isModalVisible}
      title="Preview Documents"
      onCancel={() => setIsModalVisible(false)}
      footer={null}
      width={800}
    >
      {previewableDocs.length > 0 ? (
        <div style={{ display: 'flex', gap: '1rem' }}>
          {previewableDocs.map((doc) => (
            <div key={doc.id} style={{ border: '1px solid #ddd', padding: '1rem', width: '45%' }}>
              <h4>{doc.doc_format}</h4>
              {/* Check if document is an image */}
              {doc.doc_type.includes('image') ? (
                <Image.PreviewGroup>
                  <Image
                    src={doc.doc_url}
                    alt={doc.doc_format}
                    style={{ width: '100%', height: 'auto' }}
                  />
                </Image.PreviewGroup>
              ) : (
                <iframe
                  src={doc.doc_url}
                  style={{ width: '100%', height: '300px' }}
                  title={doc.doc_format}
                />
              )}

{doc.working_document?.doc_name
                  ?.toLowerCase()
                  .includes('nida') && (
                  <Button
                    type="primary"
                    onClick={() => {}}
                    loading={isProcessing}
                    style={{ marginTop: 10 }}
                  >
                    Extract NIDA Number
                  </Button>
                )}
            </div>
          ))}
        </div>

        
      ) : (
        <p>No documents available for preview.</p>
      )}

{ocrResult && (
            <div style={{ marginTop: 20 }}>
              <h4>Extracted NIDA Number:</h4>
              <p>{ocrResult}</p>
            </div>
          )}

{previewableDocs.some((doc) =>
    doc.working_document?.doc_name?.toLowerCase().includes('nida')
  ) && (
    <Button
      style={{ marginTop: 20 }}
      type="primary"
      onClick={handleNidaValidationDrawerOpen}
    >
      Validate NIDA
    </Button>
  )}
    </Modal>
      
      <Modal
        visible={designationModalVisible}
        title="Required  Documents"
        onCancel={handleDesignationModalClose}
        footer={null}
      >
        <List
          dataSource={designationDocs}
          renderItem={(item) => (
            <List.Item>
             <Tag>{item?.doc_name}</Tag> 
            </List.Item>
          )}
        />
      </Modal>

    </PageContainer>
  );
};

export default ProviderDocsList;
