import React, { useEffect, useState } from 'react';
import { Modal, Upload, Image, Form, Button, message } from 'antd';
import { ProFormText, ProFormCheckbox } from '@ant-design/pro-form';
import { InboxOutlined } from '@ant-design/icons';
import { FormattedMessage, useIntl } from '@umijs/max';
import { getWorkingDocuments, updateDesignation } from '../DesignationSlice';

export type UpdateFormProps = {
  onCancel: (flag?: boolean, formVals?: FormValueType) => void;
  onSubmit: (values: FormValueType) => Promise<void>;
  updateModalOpen: boolean;
  values: Partial<APIDesignationListItem>;
  onTableReload: () => void;

};

const UpdateForm: React.FC<UpdateFormProps> = (props) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [Docs,setDocs]=useState([]);


  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getWorkingDocuments();
        const docs = response.data.docs;
          console.log('docsss',response)
        setDocs(docs);
        actionRef.current?.reloadAndRest(); // Reload and reset the table state
      } catch (error) {
        console.error('Error fetching docs data:', error);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    if (props.updateModalOpen) {
      console.log('seletedddddd',props.values.documents);
      form.setFieldsValue({
        name_en: props.values.name?.en || '', 
        name_sw: props.values.name?.sw || '',
        ...getInitialCheckboxValues(props.values.documents),
      })
    }
  }, [props.updateModalOpen, props.values, form]);


  const getInitialCheckboxValues = (selectedDocs) => {
    const initialCheckboxValues = {};
  
    // Map selected docs directly to their IDs
    const selectedDocsIds = selectedDocs?.map(doc => doc.id);
    
    // Set the initial values directly
    initialCheckboxValues['working_documents'] = selectedDocsIds;
  
    return initialCheckboxValues;
  };


  const documentOptions = Docs.map(doc => ({
    label: doc.doc_name,
    value: doc.id,
  }));
  
  const documentCheckboxes = (
    <ProFormCheckbox.Group
      name="working_documents"
      options={documentOptions.map(document => ({
        label: document.label,
        value: document.value,
      }))}
    />
  );



  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      values.updated_by = 1;
      const DesignationId = props.values.id;

      const selectedDocumentIds = form.getFieldValue('working_documents');

      // Update the designation values with the selected documents
      const updatedValues = { ...values, working_documents: selectedDocumentIds };
  
      const response = await updateDesignation(DesignationId, updatedValues);

      if (response.status) {
        message.success(response.message);
        form.resetFields();
        props.onCancel(true);
        props.onTableReload();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      console.log('Update failed:', error);
    }
  };

  return (
    <Modal
      width={640}
      bodyStyle={{ padding: '32px 40px 48px' }}
      destroyOnClose
      title={intl.formatMessage({
        id: 'pages.searchTable.updateForm.editDesignation',
        defaultMessage: 'Edit Designaton',
      })}
      visible={props.updateModalOpen}
      footer={[
        <Button
          key="cancel"
          onClick={() => {
            props.onCancel();
          }}
        >
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleUpdate}>
          Update
        </Button>,
      ]}
      onCancel={() => {
        props.onCancel();
        form.resetFields();
      }}
    >
      <Form
        form={form}
        initialValues={{
          name_en: props.values.name?.en || '', 
          name_sw: props.values.name?.sw || '', 
        }}
      >
        <ProFormText
          name="name_en"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.docName',
            defaultMessage: 'English Name',
          })}
          width="md"
          rules={[
            {
              required: true,
              message: 'Please enter English Name!',
            },
          ]}
        />

        <ProFormText
          name="name_sw"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.name_sw',
            defaultMessage: 'Swahili Name',
          })}
          width="md"
          rules={[
            {
              required: true,
              message: 'Please enter the Kiswahili name!',
            },
          ]}
        />

       {documentCheckboxes}
      </Form>
    </Modal>
  );
};

export default UpdateForm;
