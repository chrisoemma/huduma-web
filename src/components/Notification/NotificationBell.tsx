import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, Menu } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import {getPendingActivities } from '@/pages/ActivitiesList/ActivitySlice';

// Custom styles for Badge
const badgeStyle = {
  backgroundColor: '#f5222d',
  fontSize: '12px',
  width: '16px',
  height: '16px',
  lineHeight: '16px',
  borderRadius: '50%',
  padding: '0',
};

// Sample API fetch functions
const fetchNotificationCount = async () => {
  
  return 0; 
};

const fetchActivityCount = async () => {
  try {
    const params = {}; 
    const response = await getPendingActivities(params);
    const activities = response.data || [];

    // Return the count of filtered activities
    return activities.length;
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    return 0;
  }
};

export const NotificationBell = () => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [activityCount, setActivityCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      const notifications = await fetchNotificationCount();
      const activities = await fetchActivityCount();
      setNotificationCount(notifications);
      setActivityCount(activities);
    };

    fetchCounts();
  }, []);

  const menu = (
    <Menu>
      <Menu.Item key="notifications">
        <Link to="/notifications">
          Notifications ({notificationCount})
        </Link>
      </Menu.Item>
      <Menu.Item key="activities">
        <Link to="/activities">
          Activities ({activityCount})
        </Link>
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={['click']}>
      <a
        className="ant-dropdown-link"
        onClick={(e) => e.preventDefault()}
        style={{ color: '#1890ff', fontSize: '24px', marginRight: '16px' }}
      >
        <Badge
          count={notificationCount + activityCount}
          overflowCount={99}
          style={badgeStyle}
        >
          <BellOutlined style={{ fontSize: '24px' }} />
        </Badge>
      </a>
    </Dropdown>
  );
};

export default NotificationBell;
