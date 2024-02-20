import { Footer } from '@/components';
import { getFakeCaptcha } from '@/services/ant-design-pro/login';
import {
  AlipayCircleOutlined,
  LockOutlined,
  MobileOutlined,
  TaobaoCircleOutlined,
  UserOutlined,
  WeiboCircleOutlined,
} from '@ant-design/icons';
import {
  LoginForm,
  ProFormCaptcha,
  ProFormCheckbox,
  ProFormText,
} from '@ant-design/pro-components';
import { useEmotionCss } from '@ant-design/use-emotion-css';
import { FormattedMessage, history, SelectLang, useIntl, useModel, Helmet } from '@umijs/max';
import { Alert, message, Tabs } from 'antd';
import Settings from '../../../../config/defaultSettings';
import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { login} from '../AuthSlice';
import { formatErrorMessages, showErrorWithLineBreaks, validateTanzanianPhoneNumber } from '@/utils/function';
import Cookies from 'js-cookie';


const LoginMessage: React.FC<{
  content: string;
}> = ({ content }) => {
  return (
    <Alert
      style={{
        marginBottom: 24,
      }}
      message={content}
      type="error"
      showIcon
    />
  );
};

const Login: React.FC = () => {
  const [userLoginState, setUserLoginState] = useState<API.LoginResult>({});
  const [type, setType] = useState<string>('account');
  const { initialState, setInitialState } = useModel('@@initialState');

  const containerClassName = useEmotionCss(() => {
    return {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto',
      backgroundImage:
        "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
      backgroundSize: '100% 100%',
    };
  });

  const intl = useIntl();




  const handleSubmit = async (values: API.LoginParams) => {
    try {
      const loginData = {
        email: values.email,
        password: values.password,
      };
      
      const response = await login(loginData);
  
      if (response.status) {
        const defaultLoginSuccessMessage = intl.formatMessage({
          id: 'pages.login.success',
          defaultMessage: 'Successfully login！',
        });
  
        message.success(defaultLoginSuccessMessage);
        var currentTime = new Date();

        var expirationDate = new Date(currentTime.getTime() + (2 * 60 * 60 * 1000));

        Cookies.set('currentUser', JSON.stringify(response.userData), { path: '/', expires: expirationDate });
      //   Cookies.set('token', response.token, { path: '/', expires: expirationDate });
        setInitialState((prevState) => ({
          ...prevState,
          currentUser: response.userData,
          token: response.token,
        }));
  
        // Redirect to the dashboard
        const urlParams = new URL(window.location.href).searchParams;
        history.push(urlParams.get('redirect') || '/dashboard');
      } else {
        console.log('Login failed');
        message.error(response.message);
        // Move setUserLoginState to here if needed
        setUserLoginState(response);
      }
    } catch (error) {
      const defaultLoginFailureMessage = intl.formatMessage({
        id: 'pages.login.failure',
        defaultMessage: 'Login fail',
      });
      console.error('Login error:', error);
      message.error(defaultLoginFailureMessage);
      // Move setUserLoginState to here if needed
      setUserLoginState({ status: 'error', type: 'account', message: defaultLoginFailureMessage });
    }
  };
  

  useEffect(() => {
    if (userLoginState.status === 'error' && userLoginState.type === 'account') {
      // Handle error-related side effects or logic
    }
  }, [userLoginState]);


  const { status, type: loginType } = userLoginState;

  return (
    <div className={containerClassName}>
      <Helmet>
        <title>
          {intl.formatMessage({
            id: 'menu.login',
            defaultMessage: 'Login',
          })}
          - {Settings.title}
        </title>
      </Helmet>
      {/* <Lang /> */}
      <div
        style={{
          flex: '1',
          padding: '32px 0',
        }}
      >
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
    <img alt="logo" src="/espe.png" style={{ width: '200px', height: 'auto' }} />
  </div>
        <LoginForm
          contentStyle={{
          
            minWidth: 280,
            maxWidth: '75vw',
          
          }}
         
          submitter={{ searchConfig: { submitText: "Login" },
           
        }}
          initialValues={{
            autoLogin: true,
          }}
     
          onFinish={async (values) => {
            await handleSubmit(values as API.LoginParams);
          }}
        >
          <Tabs
            activeKey={type}
            onChange={setType}
            centered
            items={[
              {
                key: 'account',
                label: intl.formatMessage({
                  id: 'pages.login.accountLogin.tab',
                  defaultMessage: 'Login',
                }),
              },
            ]}
          />

          {status === 'error' && loginType === 'account' && (
            <LoginMessage
              content={intl.formatMessage({
                id: 'pages.login.accountLogin.errorMessage',
                defaultMessage: '(admin/ant.design)',
              })}
            />
          )}
          {type === 'account' && (
            <>
              <ProFormText
                name="email"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined />,
                  type: 'email',
                }}
                placeholder={intl.formatMessage({
                  id: 'pages.login.email',
                  defaultMessage: 'Email',
                })}
                rules={[
                  {
                    required: true,
                    message: (
                      <FormattedMessage
                        id="pages.login.emailRequired"
                        defaultMessage="Please input your email"
                      />
                    ),
                  },
                ]}
              />
              <ProFormText.Password
                name="password"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined />,
                }}
                placeholder={intl.formatMessage({
                  id: 'pages.login.passwordPlaceholder',
                  defaultMessage: 'Password',
                })}
                rules={[
                  {
                    required: true,
                    message: (
                      <FormattedMessage
                        id="pages.login.password.required"
                        defaultMessage="Please input your password"
                      />
                    ),
                  },
                ]}
              />
            </>
          )}

          <div
            style={{
              marginBottom: 24,
            }}
          >
         
            <a
              style={{
                float: 'right',
              }}
            >
              {/* <FormattedMessage id="pages.login.forgotPassword" defaultMessage="Forgot Password" /> */}
            </a>
          </div>

        </LoginForm>
      </div>
    
    </div>
  );
};

export default Login;
