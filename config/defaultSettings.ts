import { ProLayoutProps } from '@ant-design/pro-components';
const Settings: ProLayoutProps & {
  pwa?: boolean;
  logo?: string;
} = {
  navTheme: 'light',
  colorPrimary: '#82D0D4',
  layout: 'mix',
  contentWidth: 'Fluid',
  fixedHeader: false,
  fixSiderbar: true,
  colorWeak: false,
  title: 'Huduma Yoyote',
  pwa: true,
  logo:'https://i.ibb.co/YPNpYWw/espe2.png',
  iconfontUrl: 'https://i.ibb.co/ZYxHy9K/espe-logo-luciana-k3.png',
  token: {
    // 参见ts声明，demo 见文档，通过token 修改样式
    //https://procomponents.ant.design/components/layout#%E9%80%9A%E8%BF%87-token-%E4%BF%AE%E6%94%B9%E6%A0%B7%E5%BC%8F
  },
};

export default Settings;
