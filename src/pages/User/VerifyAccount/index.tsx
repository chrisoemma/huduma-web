import React, { useState } from 'react';
import { useIntl, useModel,Link, Helmet } from '@umijs/max';
import { useNavigate } from "react-router-dom";
import { ProFormText, LoginForm } from '@ant-design/pro-components';
import { message, Form } from 'antd';
import { useEmotionCss } from '@ant-design/use-emotion-css';
import { verifyAccount, requestNewToken } from '../AuthSlice';
import Settings from '../../../../config/defaultSettings';
import { validateTanzanianPhoneNumber } from '@/utils/function';

const VerifyAccount: React.FC = () => {
  const intl = useIntl();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const containerClassName = useEmotionCss(() => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'auto',
    backgroundImage:
      "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
    backgroundSize: '100% 100%',
  }));

  const handleSubmit = async (values: { identifier: string; token: string }) => {
    setLoading(true);
    try {
      // Determine if the identifier is a phone number or email
      const isEmail = values.identifier.includes('@');
      const payload = isEmail 
        ? { email: values.identifier, code: values.token } 
        : { phone:  validateTanzanianPhoneNumber(values.identifier), code: values.token };
 
       const response = await verifyAccount(payload);
  
      if (response.status) {
        const user=response?.user;
        message.success(intl.formatMessage({ id: 'pages.verifyAccount.success', defaultMessage: 'Account verified successfully!' }));
        navigate('/user/create-account-password', { state: { user } });
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(intl.formatMessage({ id: 'pages.verifyAccount.failure', defaultMessage: 'Verification failed' }));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestNewToken = async () => {
    const identifier = form.getFieldValue('identifier');
    try {
      const response = await requestNewToken({ identifier });
      if (response.status) {
        message.success(intl.formatMessage({ id: 'pages.verifyAccount.newTokenSuccess', defaultMessage: 'New token sent successfully!' }));
      } else {
        message.error(response.message);
      }
    } catch (error) {
        console.log('error123',error)
      message.error(intl.formatMessage({ id: 'pages.verifyAccount.newTokenFailure', defaultMessage: 'Failed to send new token' }));
    }
  };

  return (
    <div className={containerClassName}>
      <Helmet>
        <title>
          {intl.formatMessage({
            id: 'menu.verifyAccount',
            defaultMessage: 'Verify Account',
          })}
          - {Settings.title}
        </title>
      </Helmet>
      <div
        style={{
          flex: '1',
          justifyContent: 'center',
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          padding: '32px 0',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img alt="logo" src="/espe.png" style={{ width: '200px', height: 'auto' }} />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: 30, fontWeight: 'bold' }}>
          Verify Account
        </div>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <LoginForm
            contentStyle={{
              minWidth: 280,
              maxWidth: '75vw',
            }}
            submitter={{
              searchConfig: { submitText: intl.formatMessage({ id: 'pages.verifyAccount.verify', defaultMessage: 'Verify' }) },
              submitButtonProps: {
                loading,
              },
            }}
            form={form}
            onFinish={handleSubmit}
          >
            <ProFormText
              name="identifier"
              fieldProps={{ size: 'large' }}
              placeholder={intl.formatMessage({ id: 'pages.verifyAccount.identifier', defaultMessage: 'Phone Number or Email' })}
              rules={[{ required: true, message: intl.formatMessage({ id: 'pages.verifyAccount.identifierRequired', defaultMessage: 'Please enter your phone number or email' }) }]}
            />
            <ProFormText
              name="token"
              fieldProps={{ size: 'large' }}
              placeholder={intl.formatMessage({ 
                id: 'pages.verifyAccount.token',
                 defaultMessage: 'Verification Token' })}
              rules={[{ required: true, message: intl.formatMessage({ id: 'pages.verifyAccount.tokenRequired', defaultMessage: 'Please enter the verification token' }) }]}
            />
          </LoginForm>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
        {/* <a onClick={handleRequestNewToken} style={{ marginRight: 100 }}>
          {intl.formatMessage({ id: 'pages.verifyAccount.requestNewToken', defaultMessage: 'Request New Token' })}
        </a> */}
          <Link to="/user/login">
            {intl.formatMessage({ id: 'pages.verifyAccount.backToLogin', defaultMessage: 'Back to Login' })}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyAccount;
