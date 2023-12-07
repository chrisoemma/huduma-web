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
    
  },
};

export default Settings;
