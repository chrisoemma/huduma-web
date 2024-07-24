import React, { useState } from 'react';
import { useIntl, history, Link, Helmet } from '@umijs/max';
import { ProFormText, LoginForm } from '@ant-design/pro-components';
import { message, Form } from 'antd';
import { useEmotionCss } from '@ant-design/use-emotion-css';
import Settings from '../../../../config/defaultSettings';
import { createNewPassword } from '../AuthSlice';
import { useLocation } from 'react-router-dom';

const CreateAccountPassword: React.FC = () => {
  const intl = useIntl();
  const [loading, setLoading] = useState(false);
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

    const location = useLocation();
    const { user } = location?.state || {};

  const handleSubmit = async (values: { password: string; confirmPassword: string }) => {
    setLoading(true);
    try {
      if (values.password !== values.confirmPassword) {
        message.error(intl.formatMessage({ id: 'pages.createAccountPassword.passwordMismatch', defaultMessage: 'Passwords do not match' }));
        return;
      }

      const payload = { password: values.password,user_id:user?.id };

      const response = await createNewPassword(payload);


      if (response.status) {
        message.success(intl.formatMessage({ id: 'pages.createAccountPassword.success', defaultMessage: 'Password created successfully!' }));
        history.push('/user/login');
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(intl.formatMessage({ id: 'pages.createAccountPassword.failure', defaultMessage: 'Password creation failed' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={containerClassName}>
      <Helmet>
        <title>
          {intl.formatMessage({
            id: 'menu.createAccountPassword',
            defaultMessage: 'Create Account Password',
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
          Create Account Password
        </div>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <LoginForm
            contentStyle={{
              minWidth: 280,
              maxWidth: '75vw',
            }}
            submitter={{
              searchConfig: { submitText: intl.formatMessage({ id: 'pages.createAccountPassword.create', defaultMessage: 'Create' }) },
              submitButtonProps: {
                loading,
              },
            }}
            form={form}
            onFinish={handleSubmit}
          >
            <ProFormText.Password
              name="password"
              fieldProps={{ size: 'large' }}
              placeholder={intl.formatMessage({ id: 'pages.createAccountPassword.password', defaultMessage: 'Password' })}
              rules={[{ required: true, message: intl.formatMessage({ id: 'pages.createAccountPassword.passwordRequired', defaultMessage: 'Please enter your password' }) }]}
            />
            <ProFormText.Password
              name="confirmPassword"
              fieldProps={{ size: 'large' }}
              placeholder={intl.formatMessage({ id: 'pages.createAccountPassword.confirmPassword', defaultMessage: 'Confirm Password' })}
              rules={[{ required: true, message: intl.formatMessage({ id: 'pages.createAccountPassword.confirmPasswordRequired', defaultMessage: 'Please confirm your password' }) }]}
            />
          </LoginForm>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
          <Link to="/user/login">
            {intl.formatMessage({ id: 'pages.createAccountPassword.backToLogin', defaultMessage: 'Back to Login' })}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CreateAccountPassword;
