// @ts-ignore
/* eslint-disable */

declare namespace API {
  type CurrentUser = {
    name?: string;
    avatar?: string;
    userid?: string;
    email?: string;
    signature?: string;
    title?: string;
    group?: string;
    tags?: { key?: string; label?: string }[];
    notifyCount?: number;
    unreadCount?: number;
    country?: string;
    access?: string;
    geographic?: {
      province?: { label?: string; key?: string };
      city?: { label?: string; key?: string };
    };
    address?: string;
    phone?: string;
  };

  type LoginResult = {
    status?: string;
    type?: string;
    currentAuthority?: string;
  };

  type PageParams = {
    current?: number;
    pageSize?: number;
  };

  type RuleListItem = {
    key?: number;
    disabled?: boolean;
    href?: string;
    avatar?: string;
    name?: string;
    owner?: string;
    desc?: string;
    callNo?: number;
    status?: number;
    updatedAt?: string;
    createdAt?: string;
    progress?: number;
  };

  type SubCategoryListItem = {
     id:number;
     name_en: string,
     name_sw: string,
     img_url:array;
  }

  
  type ServiceListItem = {
    id:number;
    name:string;
    category_id:number,
    img_url:array;
 }




type ServiceListItem = {
  id:number;
  name:string;
  service_id:number,
  img_url:array;
}

type AgentListItem ={
  first_name:string,
  last_name:string,
  email:string,
  nida:string,
  profile_img:string,
  status:string
  birth_date:string,
  phone:string
}

type ProviderListItem ={
  first_name:string,
  last_name:string,
  email:string,
  nida:string,
  profile_img:string,
  status:string
  birth_date:string,
  phone:string
}

type RegistrationDocListItem = {
     doc_name:string,
     status:string,
     percentage:integer,
     created_by:integer,
     deleted_by:integer,
     deleted_at:string,
     updated_at:string,
     created_at:string,
     type:string
}
type EmployeeListItem = {
    id:number,
    name:string,
    email:string,
    nida:string,
    phone:string,
    profile_img:string,
    
}
type ClientListItem ={
  first_name:string,
  last_name:string,
  name:string
  email:string,
  nida:string,
  profile_img:string,
  status:string
  birth_date:string,
  phone:string
}

  type RuleList = {
    data?: RuleListItem[];
    /** 列表的内容总数 */
    total?: number;
    success?: boolean;
  };

  type FakeCaptcha = {
    code?: number;
    status?: string;
  };

  type LoginParams = {
    email?: string;
    password?: string;
    autoLogin?: boolean;
    type?: string;
  };

  type ErrorResponse = {
    /** 业务约定的错误码 */
    errorCode: string;
    /** 业务上的错误信息 */
    errorMessage?: string;
    /** 业务上的请求是否成功 */
    success?: boolean;
  };

  type NoticeIconList = {
    data?: NoticeIconItem[];
    /** 列表的内容总数 */
    total?: number;
    success?: boolean;
  };

  type NoticeIconItemType = 'notification' | 'message' | 'event';

  type NoticeIconItem = {
    id?: string;
    extra?: string;
    key?: string;
    read?: boolean;
    avatar?: string;
    title?: string;
    status?: string;
    datetime?: string;
    description?: string;
    type?: NoticeIconItemType;
  };
}
