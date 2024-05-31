import React, { useEffect, useState } from 'react';
import { Modal, Upload, Image, Form, Button, message } from 'antd';
import { ProFormText, ProFormCheckbox, ProFormRadio, ProFormSelect } from '@ant-design/pro-form';
import { InboxOutlined } from '@ant-design/icons';
import { FormattedMessage, useIntl, useModel } from '@umijs/max';
import { getPackages } from '@/pages/SubscriptionPackageList/SubscriptionPackageSlice';
import { updateDiscount } from '../DiscountSlice';


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

  const [subPackages, setSubPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packageAmount, setPackageAmount] = useState(null)


  const { initialState } = useModel('@@initialState');
  const [loading, setLoading] = useState(false);



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
    if (props.updateModalOpen) {
      const subPackage = subPackages.find((subpackage) => subpackage.id == props.values.package_id)?.name || '';
      const packageObject = subPackages.find((subpackage) => subpackage.id == props.values.package_id)
      setSelectedPackage(packageObject);
      setPackageAmount(packageObject ? packageObject.amount : null)

      form.setFieldsValue({

        duration: props.values.duration || '',
        amount: parseFloat(props.values.amount) || '',
        name:props.values.name || '',
        target: subPackage
      })
    }
  }, [props.updateModalOpen, props.values, form]);



  const handlePackageChange = (value) => {


    const selectedPackage = subPackages.find(subpackage => subpackage.id == value);

    setSelectedPackage(selectedPackage);
    setPackageAmount(selectedPackage ? selectedPackage.amount : null);
  };



  const handleUpdate = async () => {

    try {
      setLoading(true);
      const values = await form.validateFields();
    
      values.updated_by = 1;
      const discountId = props.values.id;
      const selectedPackageData =
        subPackages.find((subPackage) => subPackage.id == values.package) ||
        subPackages.find((subPackage) => subPackage.name === values.package);

      values.package = selectedPackageData?.id;

      // console.log('valuessss',values)
      // return 


      // Update the designation values with the selected documents
      const updatedValues = { ...values };

      const response = await updateDiscount(discountId, updatedValues);

      if (response.status) {
        message.success(response.message);
        setLoading(false);
        form.resetFields();
        props.onCancel(true);
        props.onTableReload();
      } else {
        setLoading(false);
        message.error(response.message);
      }
    } catch (error) {
      setLoading(false);
      console.log('Update failed:', error);
    }
  };

  return (
    <Modal
      width={640}
      bodyStyle={{ padding: '32px 40px 48px' }}
      destroyOnClose
      title={intl.formatMessage({
        id: 'pages.searchTable.updateForm.editPackage',
        defaultMessage: 'Edit Subscription Package',
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
        <Button key="submit" type="primary" 
        onClick={handleUpdate}
        disabled={loading}
        
        >
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
          package: subPackages.find((subpackage) => subpackage.id == props.values.package_id)?.name,
          duration: props.values.duration || '',
          amount: parseFloat(props.values.amount) || '',
          name:props.values.name || '',
        }}
      >

        <ProFormSelect
          name="package"
          width="md"
          label={intl.formatMessage({
            id: 'pages.searchTable.updateForm.package',
            defaultMessage: 'Subscription Package',
          })}
          valueEnum={subPackages.reduce((enumObj, subPackage) => {
            enumObj[subPackage.id] = subPackage.name;
            return enumObj;
          }, {})}
          rules={[
            {
              required: true,
              message: 'Please select Package!',
            },
          ]}
          onChange={handlePackageChange} // Add onChange handler
        />

        {selectedPackage && ( // Render package amount if package is selected
          <div style={{ marginBottom: 10 }}>
            <label style={{ color: 'green' }}>Package Amount: </label>
            <span style={{ fontWeight: 'bold' }}>{selectedPackage?.amount}</span>
          </div>
        )}


        <ProFormText
          rules={[
            {
              required: true,
              message: 'Package Name is required',
            },
          ]}
          width="md"
          name="name"
          label="Package name"
        />

        <ProFormText
          rules={[
            {
              required: true,
              pattern: /^[0-9]+$/,
              message: 'Please enter a valid number',
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || !getFieldValue('package')) {
                  return Promise.resolve();
                }
                if (Number(value) > Number(selectedPackage.amount)) {
                  return Promise.reject(new Error('Discount cannot be greater than package amount'));
                }
                return Promise.resolve();
              },
            }),
          ]}
          width="md"
          name="amount"
          label="Discount"
        />


        <ProFormText
          rules={[
            {
              required: true,
              pattern: /^[0-9]+$/,
              message: 'Please enter a valid number',
            },
          ]}
          width="md"
          name="duration"
          label="Duration (Months)"
        />


      </Form>
    </Modal>
  );
};

export default UpdateForm;
