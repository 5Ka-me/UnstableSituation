import React, { useState, useEffect } from 'react';
import { Card, List, Badge, Button, Empty, Spin, Alert } from 'antd';
import { BellOutlined, CloseOutlined, CheckOutlined } from '@ant-design/icons';
import { signalRService } from '../services/signalRService';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const initializeNotifications = async () => {
      await loadNotifications();
    };
    
    initializeNotifications();
    
    // Subscribe to real-time notifications
    const unsubscribe = signalRService.onNotification((notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return unsubscribe;
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // Mock initial notifications
      const mockNotifications = [
        {
          id: '1',
          message: 'System started successfully',
          type: 'info',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          read: false
        },
        {
          id: '2',
          message: 'High energy consumption detected in Office',
          type: 'warning',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          read: false
        },
        {
          id: '3',
          message: 'CO2 levels above normal in Living Room',
          type: 'error',
          timestamp: new Date(Date.now() - 180000).toISOString(),
          read: true
        }
      ];
      
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
      setError(null);
    } catch (err) {
      setError('Failed to load notifications: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'error':
        return <span className="notification-icon error">⚠</span>;
      case 'warning':
        return <span className="notification-icon warning">⚠</span>;
      case 'info':
      default:
        return <span className="notification-icon info">ℹ</span>;
    }
  };

  const getNotificationClass = (type) => {
    switch (type) {
      case 'error':
        return 'notification-item error';
      case 'warning':
        return 'notification-item warning';
      case 'info':
      default:
        return 'notification-item info';
    }
  };

  if (loading) {
    return (
      <div className="notifications-loading">
        <Spin size="large" />
        <p>Loading notifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        action={
          <Button onClick={loadNotifications} size="small">
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <Card 
      title={
        <div className="notifications-header">
          <BellOutlined />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge count={unreadCount} size="small" />
          )}
        </div>
      }
      extra={
        notifications.length > 0 && (
          <Button 
            type="link" 
            size="small" 
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </Button>
        )
      }
      className="notifications-card"
    >
      {notifications.length === 0 ? (
        <Empty 
          description="No notifications" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          dataSource={notifications}
          renderItem={(notification) => (
            <List.Item
              className={getNotificationClass(notification.type)}
              actions={[
                <Button
                  key="read"
                  type="link"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => markAsRead(notification.id)}
                  disabled={notification.read}
                >
                  {notification.read ? 'Read' : 'Mark as read'}
                </Button>,
                <Button
                  key="remove"
                  type="link"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => removeNotification(notification.id)}
                  danger
                >
                  Remove
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={getNotificationIcon(notification.type)}
                title={
                  <div className="notification-content">
                    <span className={`notification-message ${notification.read ? 'read' : 'unread'}`}>
                      {notification.message}
                    </span>
                    <span className="notification-time">
                      {new Date(notification.timestamp).toLocaleString()}
                    </span>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

export default Notifications;
