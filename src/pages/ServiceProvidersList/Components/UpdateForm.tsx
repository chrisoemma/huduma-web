// import {
import React, { useEffect, useState, useRef } from 'react';
import { Modal, Upload, Image, Form, Button, message, Tag, Card, } from 'antd';
import { ProFormText, StepsForm, ProFormSelect, ProFormRadio } from '@ant-design/pro-form';
import { InboxOutlined } from '@ant-design/icons';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { FormattedMessage, useIntl, useModel } from '@umijs/max';
import { storage } from '@/firebase/firebase';
import { updateProvider } from '../ServiceProviderSlice';
import { formatErrorMessages, getStatus, showErrorWithLineBreaks, validateTanzanianPhoneNumber } from '@/utils/function';
import { history } from 'umi';
import { providerDesignationDoc } from '@/pages/ProviderDocsList/ProviderDocsSlice';
import { getPackages } from '@/pages/SubscriptionPackageList/SubscriptionPackageSlice';
import { CheckOutlined } from '@ant-design/icons';

export type UpdateFormProps = {

  onCancel: (flag?: boolean, formVals?: FormValueType) => void;
  onSubmit: (values: FormValueType) => Promise<void>;
  updateModalOpen: boolean;
  values: Partial<API.CategoryListItem>;
  onTableReload: () => void;
};

const UpdateForm: React.FC<UpdateFormProps> = (props) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string | undefined>(props.values.user?.profile_img);
  const [selectedRadioValue, setSelectedRadioValue] = useState("");
  const stepsFormRef = useRef();


  const { initialState } = useModel('@@initialState');
  const [designationDocs, setDesignationDocs] = useState([]);
  const [packages, setSubPackages] = useState([]);

  const [loading, setLoading] = useState(false);

  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    if (props.updateModalOpen) {
      // console.log('props.value', props.values);
      form.setFieldsValue({
        first_name: props.values.first_name,
        last_name: props.values.last_name,
        status: props.values.status,
        nida: props.values.user?.nida,
        email: props.values.user?.email,
        phone: props.values.user?.phone
      });

    }
  }, [props.updateModalOpen, props.values, form]);



  console.log('props?.values?.status', props?.values?.status)

  console.log('props.values.user?.status', props.values.user?.status)

  console.log('getStatus(props.values.user?.status)', getStatus(props.values.user?.status));


  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getPackages();
        const packages = response.data.packages;
        console.log('packages', response)
        setSubPackages(packages);
      } catch (error) {
        console.error('Error fetching permissions data:', error);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await providerDesignationDoc(props.values.id);
        const designationDocs = response.data.documents;

        console.log('designationssss', designationDocs);
        setDesignationDocs(designationDocs);

      } catch (error) {
        console.error('Error fetching Roles data:', error);
      }
    }

    fetchData();
  }, []);


  const areRequiredDocumentsUploaded = () => {
    // Check if all designation documents have corresponding uploaded documents
    return designationDocs?.every(designationDoc =>
      props?.values?.documents?.some(uploadDoc => uploadDoc.working_document_id === designationDoc.id)
    );
  };


  const checkAllRequiredDocumentsApproved = () => {
    let allApproved = true;

    if (!props?.values?.documents || props?.values?.documents?.length < 1) {
      allApproved = false;
    } else {
      props?.values?.documents?.forEach(uploadDoc => {
        if (uploadDoc.status !== "Approved") {
          allApproved = false;
        }
      });
    }
    return allApproved;
  };




  // Determine if status editing should be enabled
  const isStatusEditingEnabled = () => {
    const allRequiredDocumentsApproved = checkAllRequiredDocumentsApproved();
    return allRequiredDocumentsApproved;
  };



  const listMissingDocuments = () => {
    // Extract the IDs of all required documents
    const requiredDocumentIds = designationDocs?.map(doc => doc.id);

    // Extract the working document IDs of all uploaded documents
    const uploadedWorkingDocumentIds = props?.values?.documents?.map(doc => doc?.working_document_id);

    // Find the IDs of missing documents
    const missingDocumentIds = requiredDocumentIds?.filter(id => !uploadedWorkingDocumentIds.includes(id));

    // Filter out the missing documents from the designationDocs
    const missingDocuments = designationDocs?.filter(doc => missingDocumentIds.includes(doc.id));

    // Extract the names of missing documents
    const missingDocumentNames = missingDocuments?.map(doc => doc.doc_name);

    return missingDocumentNames;
  };


  const handleViewDocs = () => {
    // Assuming you have a route named '/documents/:providerId'
    const route = `/user-management/service-providers/documents/provider/${props.values.id}`;
    // Redirect to the documents route
    history.push(route);
  };



  const { Dragger } = Upload;

  const beforeUpload = (file: File) => {

    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
    }
    return isImage;
  };

  const handleUpload = async (file: File) => {

    const storageRef = ref(storage, `profile/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);


    return new Promise<string | undefined>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Handle upload progress if needed
        },
        (error) => {
          // Handle unsuccessful upload
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            console.error('Error getting download URL:', error);
            reject(error);
          }
        }
      );
    });
  };

  const handleChange = async (info: any) => {

    if (info.file.status === 'done') {
      const downloadURL = await handleUpload(info.file.originFileObj);
      setImageUrl(downloadURL);
    }
  };



  const handleUpdate = async (values) => {

    setLoading(true);

    try {

      const providerId = props.values.id;
      const profile_img = imageUrl || props.values.user?.profile_img;
      values.profile_img = profile_img;

      if (props?.values?.active_subscription == null) {
        if (!selectedCard) {
          message.error('Please select a subscription package');
          return;
        }
      }
      values.phone = validateTanzanianPhoneNumber(values.phone);
      const currentUser = initialState?.currentUser;
      values.action_by = currentUser?.id;
      values.package = selectedCard;



      const response = await updateProvider(providerId, { ...values, profile_img });
      if (response.status) {
        setImageUrl(undefined);
        form.resetFields();
        setLoading(false);
        props.onCancel(true);
        message.success(response.message);
        props.onTableReload();
        stepsFormRef.current?.submit();
      } else {
        setLoading(false);
        if (response.data) {
          const errors = response.data.errors;
          showErrorWithLineBreaks(formatErrorMessages(errors));
        } else {
          setLoading(false);
          if (response.error) {
            message.error(response.error);
          } else {
            setLoading(false);
            message.error(response.message);
          }

        }
      }
    } catch (error) {
      setLoading(false);
      console.log('Update failed:', error);
    }
  };


  return (
    <StepsForm
      onFinish={async (values) => {
        await handleUpdate(values);
        await props.onSubmit(values);
      }}
      stepsProps={{
        size: 'small',
      }}
      stepsFormRender={(dom, submitter) => (
        <Modal
          width={640}
          bodyStyle={{ padding: '32px 40px 48px' }}
          destroyOnClose
          title={intl.formatMessage({

            id: 'pages.searchTable.updateForm.editprovider',
            defaultMessage: 'Edit Provider',
          })}

          open={props.updateModalOpen}
          footer={submitter}
          onCancel={() => {
            props.onCancel();
          }}
        >
          {dom}
        </Modal>
      )}
    >

      <StepsForm.StepForm
        initialValues={{
          first_name: props.values.first_name,
          last_name: props.values.last_name,
          status: props.values.status,
          nida: props.values.user?.nida,
          email: props.values.user?.email,
          phone: props.values.user?.phone
        }}
        title={intl.formatMessage({
          id: 'pages.searchTable.updateForm.providerInfo',
          defaultMessage: 'Provider Info',
        })}
      >

        <ProFormText
          name="first_name"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.firstName',
            defaultMessage: 'First Name',
          })}
          width="md"
          rules={[
            {
              required: true,
              message: 'Please enter the first name!',
            },
          ]}
        />
        <ProFormText
          name="last_name"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.lastName',
            defaultMessage: 'Last Name',
          })}
          width="md"
          rules={[
            {
              required: true,
              message: 'Please enter the last name!',
            },
          ]}
        />


        <ProFormText
          rules={[
            {
              required: true,
              message: 'Phone number is required',
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const phoneNumber = value.replace(/\D/g, ''); // Remove non-numeric characters
                const validCountryCodes = ['255', '254', '256', '250', '257']; // Add more as needed

                // Check if the phone number has a valid length and starts with either a leading zero or a valid country code
                const isValid = validCountryCodes.some(code => {
                  const countryCodeLength = code.length;
                  return (
                    (phoneNumber.length === 10 && phoneNumber.startsWith('0')) ||
                    (phoneNumber.length === 12 && phoneNumber.startsWith(code))
                  );
                });

                if (!isValid) {
                  return Promise.reject('Invalid phone number format');
                }

                return Promise.resolve();
              },
            }),
          ]}
          width="md"
          name="phone"
          label="Phone"
        />


        <ProFormText
          name="email"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.email',
            defaultMessage: 'Email',
          })}
          width="md"
          rules={[

            {
              type: 'email',
              message: 'Please enter a valid email address!',
            },
          ]}
        />

      </StepsForm.StepForm>

      {/* Step 2 */}
      <StepsForm.StepForm

        initialValues={{
          status: props.values.status,
          nida: props.values.user?.nida,
        }}
        title={intl.formatMessage({
          id: 'pages.searchTable.updateForm.step2',
          defaultMessage: 'Other Info',
        })}
      >

        <ProFormText
          rules={[

            ({ getFieldValue }) => ({
              validator(_, value) {
                const nida = value.replace(/\D/g, '');
                const isLengthValid = nida.length === 20;

                if (!isLengthValid) {
                  return Promise.reject('NIDA must be 20 numbers');
                }

                return Promise.resolve();
              },
            }),
          ]}
          width="md"
          name="nida"
          label="NIDA"
        />

        <Form.Item
          name="image"
          label="Image"
          valuePropName="fileList"
          getValueFromEvent={(e) => {
            if (Array.isArray(e)) {
              return e;
            }
            return e && e.fileList;
          }}
          extra="Click or drag image to this area to upload"
        >
          <Dragger
            accept="image/*"
            beforeUpload={beforeUpload}
            onChange={handleChange}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag image to this area to upload</p>
          </Dragger>
        </Form.Item>

        <Form.Item label="Current Image">
          {props.values.user?.profile_img && <Image src={props.values.user?.profile_img} width={200} />}
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {/* Display a message indicating the completion status of the required documents */}
            {areRequiredDocumentsUploaded() ? (
              <p style={{ color: 'green' }}>All required documents are uploaded</p>
            ) : (
              <div>
                <p style={{ color: 'red' }}>Some required documents are missing:</p>
                {/* List the missing documents */}
                <ul>
                  {listMissingDocuments()?.map((document, index) => (
                    <li key={index}><Tag>{document}</Tag></li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <Button type="primary" onClick={handleViewDocs}>
            View Docs
          </Button>

        </div>

        <ProFormRadio.Group
          name="status"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.ruleProps.typeLabelStatus',
            defaultMessage: 'Status',
          })}
          options={[
            {
              value: 'Pending approval',
              label: 'Pending',
            },

            {
              value: 'Active',
              label: 'Active',
            },
            {
              value: 'Deactivated',
              label: 'Deactivate',
            },
          ]}
          disabled={!isStatusEditingEnabled()}
          onChange={(e) => setSelectedRadioValue(e.target.value)}
        />


        <div>
          <h3>{props?.values?.status == 'Pending approval' && selectedRadioValue === 'Active' ? 'Subscription Packages' : ''}{props?.values?.active_subscription ? 'Subscribed package' : ''}</h3>
          {props?.values?.status == 'Pending approval' && selectedRadioValue === 'Active' ? (
            <div style={{ display: 'flex', gap: '16px' }}>
              {packages?.map(subPackage => (
                <Card
                  key={subPackage?.id}
                  title={subPackage?.name}
                  style={{ width: 300, position: 'relative', boxShadow: selectedCard === subPackage?.id ? '0 0 10px rgba(0, 0, 0, 0.3)' : 'none' }}

                  onClick={() => setSelectedCard(subPackage?.id)}
                >
                  <p style={{ textDecoration: 'line-through' }}>Price: {subPackage?.amount}</p>
                  <p>Trial: Free</p>

                  {selectedCard === subPackage?.id && (
                    <div style={{ position: 'absolute', top: 10, right: 10 }}>
                      <CheckOutlined style={{ fontSize: 24, color: 'green' }} />
                    </div>
                  )}
                </Card>

              ))}
            </div>
          ) : (<div />)}

          {props?.values?.active_subscription ? (<Card
            key={props?.values?.active_subscription?.package.id}
            title={props?.values?.active_subscription?.package.name}
            style={{ width: 300, position: 'relative' }}
          >
            {props.values.active_subscription.is_trial ? (
              <div>
                <p style={{ textDecoration: 'line-through' }}>Price: {props?.values?.active_subscription?.package?.amount}</p>
                <p>Trial: Free</p>
              </div>
            ) : (
              <div>
                {props?.values?.active_subscription?.discount ? (
                  <div>
                    <p>Price: {props?.values?.active_subscription?.amount - props?.values?.active_subscription?.discount?.amount}</p>
                    <p>Duration: {props?.values?.active_subscription?.discount?.duration}</p>
                  </div>
                ) : (
                  <div>
                    <p>Price: {props?.values?.active_subscription?.package?.amount}</p>
                    <p>Duration: 1</p>
                  </div>
                )}
              </div>
            )}

            <p>Starts: {props?.values?.active_subscription.start_date}</p>
            <p>Ends: {props?.values?.active_subscription.end_date}</p>
            <div style={{ position: 'absolute', top: 10, right: 10 }}>
              <CheckOutlined style={{ fontSize: 24, color: 'green' }} />
            </div>

          </Card>) : (<div />)}
        </div>


      </StepsForm.StepForm>

    </StepsForm>
  );

};

export default UpdateForm;
