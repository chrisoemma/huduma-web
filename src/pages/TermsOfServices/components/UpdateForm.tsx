import React, { useEffect, useState } from 'react';
import { Modal, Upload, Button, message, Form, Radio } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useIntl, useModel } from '@umijs/max';
import { updateTermOfService } from '../TermOfServiceSlice';
import { ProFormUploadButton } from '@ant-design/pro-components';

export type UpdateFormProps = {
  onCancel: (flag?: boolean) => void;
  onSubmit: (values: FormValueType) => Promise<void>;
  updateModalOpen: boolean;
  values: Partial<API.TermOfServiceListItem>;
  onTableReload: () => void;
};

const UpdateForm: React.FC<UpdateFormProps> = (props) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const action_by = currentUser?.id;

  useEffect(() => {
    if (props.updateModalOpen) {
      form.setFieldsValue({
        status: props.values.status,
      });
    }
  }, [props.updateModalOpen, props.values, form]);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const termId = props.values.id;

      const formData = new FormData();
      Object.keys(values).forEach((key) => {
        formData.append(key, values[key]);
      });

      formData.append('updated_by', action_by);

      if (fileList.length > 0) {
        formData.append('file', fileList[0].originFileObj);
      } else {
        formData.append('url', props.values.url);
      }

      await updateTermOfService(termId, formData);
      message.success('Terms of Service updated successfully');
      props.onCancel(true);
      props.onTableReload();
    } catch (error) {
      console.log('Update failed:', error);
      message.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = ({ fileList }: any) => {
    // Update the file list state
    setFileList(fileList);
  };

  return (
    <Modal
      title={intl.formatMessage({
        id: 'pages.searchTable.updateForm.editTermOfService',
        defaultMessage: 'Edit Terms of Service',
      })}
      visible={props.updateModalOpen}
      onCancel={() => props.onCancel()}
      footer={[
        <Button key="cancel" onClick={() => props.onCancel()}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleUpdate} loading={loading}>
          Update
        </Button>,
      ]}
    >
      <Form form={form}>
        <Form.Item
          name="status"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.status',
            defaultMessage: 'Status',
          })}
        >
          <Radio.Group>
            <Radio value="Active">Active</Radio>
            <Radio value="In Active">In Active</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="Current PDF">
          {props.values.url && (
            <a href={props.values.url} target="_blank" rel="noopener noreferrer">
              View Current PDF
            </a>
          )}
        </Form.Item>

        <Form.Item label="Upload New PDF" name="pdf_file">
          <ProFormUploadButton
            name="pdf_file"
            label="Upload PDF"
            max={1}
            fieldProps={{
              accept: '.pdf',
              onChange: handleChange,
              fileList,
              beforeUpload: (file: File) => {
                const isPdf = file.type === 'application/pdf';
                if (!isPdf) {
                  message.error('You can only upload PDF files!');
                }
                return isPdf || Upload.LIST_IGNORE;
              },
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateForm;
