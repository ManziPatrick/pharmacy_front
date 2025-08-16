import React, { useState, useEffect } from 'react';

import { getUserFromToken } from '../utils/auth';
import { generateAvatar } from '../utils/avatar';
import Notificat from '../assets/notification.png';
import { Link, NavLink } from 'react-router-dom';
import io from 'socket.io-client';


const Navbar = () => {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allNotifications, setAllNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [socket, setSocket] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      const userData = getUserFromToken(token);
      if (userData && userData._id) {
        setUser(userData);
        fetchAllNotifications(userData._id);
        getUserLocation();
        setupSocket(userData._id, token);
        fetchOnlineUsers();
        
        // Refresh online users every 30 seconds
        const onlineUsersInterval = setInterval(fetchOnlineUsers, 30000);
        
        return () => {
          clearInterval(onlineUsersInterval);
        };
      } else {
        console.error("Invalid user data in token");
        localStorage.removeItem('authToken'); 
      }
    } else {
      console.log("No token found in local storage");
    }
    // Responsive: close notifications on resize if desktop
    const handleResize = () => {
      if (window.innerWidth > 640) {
        setShowNotifications(false);
        setIsMobileMenuOpen(false);
        setIsSearchExpanded(false);
        setShowOnlineUsers(false);
      }
    };
    
    // Close dropdowns when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest('.notification-dropdown') && !event.target.closest('.notification-button')) {
        setShowNotifications(false);
      }
      if (!event.target.closest('.online-users-dropdown') && !event.target.closest('.online-users-button')) {
        setShowOnlineUsers(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting user location:", error);
        }
      );
    }
  };

  const setupSocket = (userId, token) => {
    // Use import.meta.env for Vite/React, fallback to localhost
    const apiUrl = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:5000';
    const newSocket = io(apiUrl, {
      transports: ['websocket', 'polling'],
      auth: { token },
      query: { userId },
      timeout: 20000,
      forceNew: true
    });
    
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      console.log('Connected to notification server');
      newSocket.emit('authenticate', { userId });
      // Fetch current online users when connected
      setTimeout(() => fetchOnlineUsers(), 1000);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    // Listen for online users updates
    newSocket.on('onlinePharmacies', (usersArray) => {
      const usersMap = new Map();
      usersArray.forEach(user => {
        usersMap.set(user.userId, user);
      });
      setOnlineUsers(usersMap);
    });
    
    // Listen for individual user online/offline events
    newSocket.on('userOnline', (userData) => {
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(userData.userId, userData);
        return newMap;
      });
    });
    
    newSocket.on('userOffline', (userId) => {
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
    });
    
    // Handle different notification types
    newSocket.on('new_request', handleNewNotification);
    newSocket.on('status_update', handleNewNotification);
    newSocket.on('new_medicine', handleNewNotification);
    newSocket.on('notification', handleNewNotification);
    
    // Listen for unreadCounts event for real-time badge
    newSocket.on('unreadCounts', (counts) => {
      setNotificationCount(counts.notifications || 0);
    });
    
    return () => newSocket.disconnect();
  };

  const handleNewNotification = (notification) => {
    setAllNotifications((prev) => [notification, ...prev]);
    setNotificationCount((prev) => (prev === '99+' ? '99+' : prev + 1));
    if (window.innerWidth <= 640) setShowNotifications(true);
  };

  // Listen for new chat messages as notifications
  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (msg) => {
      // Only show notification if message is not from current user
      if (msg.sender !== user?._id) {
        // Try to get sender name from online users
        const senderInfo = onlineUsers.get(msg.sender);
        const senderName = senderInfo?.pharmacyName || senderInfo?.ownerName || `User ${msg.sender?.substring(0, 8)}...`;
        
        setAllNotifications((prev) => [{
          _id: msg._id || Math.random().toString(36),
          message: `New message from ${senderName}: ${msg.message?.substring(0, 40) || 'Image'}${msg.message?.length > 40 ? '...' : ''}`,
          type: 'chat',
          timestamp: msg.createdAt || new Date(),
          read: false,
          senderId: msg.sender,
          senderName: senderName
        }, ...prev]);
        setNotificationCount((prev) => (prev === '99+' ? '99+' : prev + 1));
        if (window.innerWidth <= 640) setShowNotifications(true);
      }
    };
    
    socket.on('receiveMessage', handleNewMessage);
    socket.on('newMessage', handleNewMessage);
    
    return () => {
      socket.off('receiveMessage', handleNewMessage);
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, user]);

  const fetchAllNotifications = async (userId) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setAllNotifications([]);
        setNotificationCount(0);
        return;
      }
      const apiUrl = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/notify/notifications`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setAllNotifications(data);
      const unread = data.filter((notif) => !notif.read);
      setNotificationCount(unread.length > 99 ? '99+' : unread.length);
    } catch (error) {
      setAllNotifications([]);
      setNotificationCount(0);
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        performSearch(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 500);
    
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const performSearch = async (query) => {
    setIsSearching(true);
    try {
      let url = `https://pharmacies-management.onrender.com/api/medicines/all?searchTerm=${query}`;
      if (userLocation) {
        url += `&latitude=${userLocation.latitude}&longitude=${userLocation.longitude}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      performSearch(searchTerm);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`https://pharmacies-management.onrender.com/api/notify/mark-as-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationId }),
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      setAllNotifications((prev) => prev.map((notif) => notif._id === notificationId ? { ...notif, read: true } : notif));
      setNotificationCount((prev) => (prev === '99+' ? '99+' : prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');
      
      // Remove from local state immediately for better UX
      setAllNotifications((prev) => prev.filter((notif) => notif._id !== notificationId));
      
      // If notification was unread, decrease count
      const notification = allNotifications.find(notif => notif._id === notificationId);
      if (notification && !notification.read) {
        setNotificationCount((prev) => (prev === '99+' ? '99+' : prev - 1));
      }

      // Optional: Make API call to delete from server
      // const response = await fetch(`https://pharmacies-management.onrender.com/api/notify/delete`, {
      //   method: 'DELETE',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({ notificationId }),
      // });
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Optionally restore notification on error
      fetchAllNotifications(user._id);
    }
  };

  // Test function to create a sample notification
  const createTestNotification = () => {
    const testNotification = {
      _id: Date.now().toString(),
      message: 'Test notification - System is working!',
      type: 'new_request',
      timestamp: new Date(),
      read: false
    };
    handleNewNotification(testNotification);
  };

  const sendTestNotificationToServer = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token || !user?._id) return;
      
      const apiUrl = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/notify/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user._id,
          message: 'Server test notification - Real-time system working!',
          type: 'test'
        }),
      });
      
      if (response.ok) {
        console.log('Test notification sent successfully');
      } else {
        console.error('Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  const fetchOnlineUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      const apiUrl = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/notify/online-users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const usersMap = new Map();
        data.users.forEach(user => {
          usersMap.set(user.userId, user);
        });
        setOnlineUsers(usersMap);
        console.log(`Fetched ${data.count} online users`);
      }
    } catch (error) {
      console.error('Error fetching online users:', error);
    }
  };

  const fetchUserInfo = async (userId) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return null;
      
      const apiUrl = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        return userData;
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
    return null;
  };

  return (
    <header className="bg-white shadow relative w-full">
      {/* Main Header */}
      <div className="container mx-auto flex items-center justify-between py-4 px-4 w-full">
        {/* Logo */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <img
            src="https://via.placeholder.com/40"
            alt="PharmaCare Logo"
            className="h-8 w-8 sm:h-10 sm:w-10"
          />
          <span className="text-lg sm:text-2xl font-bold text-green-600">PharmaCare</span>
        </div>

        {/* Desktop Search Bar */}
        <div className="hidden md:flex flex-grow mx-4 relative">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-4.35-4.35M17 10a7 7 0 1 0-14 0 7 7 0 0 0 14 0z"
                />
              </svg>
            </button>
          </form>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute mt-2 top-full w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
              <ul>
                {searchResults.map((medicine) => (
                  <Link to={`/medicines/${medicine._id}`} key={medicine._id}>
                    <li
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      onClick={() => {
                        console.log('Selected medicine:', medicine);
                        setSearchTerm('');
                        setSearchResults([]);
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-semibold">{medicine.name}</span>
                          <span className="ml-2 text-sm text-gray-600">
                            Expires: {new Date(medicine.expiryDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {medicine.distance ? `${medicine.distance.toFixed(0)}m` : 'Distance unknown'}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        Pharmacy: {medicine.pharmacy.pharmacyName}
                      </div>
                    </li>
                  </Link>
                ))}
              </ul>
            </div>
          )}

          {isSearching && (
            <div className="absolute mt-2 top-full w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 p-4">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                <span className="ml-2">Loading...</span>
              </div>
            </div>
          )}
        </div>

        {/* Mobile & Tablet Actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Mobile Search Toggle */}
          <button
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-full"
            onClick={() => setIsSearchExpanded(!isSearchExpanded)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-4.35-4.35M17 10a7 7 0 1 0-14 0 7 7 0 0 0 14 0z"
              />
            </svg>
          </button>

          {/* Online Users Indicator */}
          <div className="relative">
            <button
              onClick={() => setShowOnlineUsers(!showOnlineUsers)}
              className="online-users-button relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Online Users"
            >
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {onlineUsers.size > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {onlineUsers.size}
                </span>
              )}
            </button>

            {/* Online Users Panel */}
            {showOnlineUsers && (
              <div className="online-users-dropdown absolute right-0 top-12 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="p-4 border-b bg-green-50">
                  <h4 className="text-lg font-semibold text-gray-800">Online Users ({onlineUsers.size})</h4>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {onlineUsers.size > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {Array.from(onlineUsers.values()).map((userInfo) => (
                        <li key={userInfo.userId} className="p-3 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <div>
                              <span className="text-sm text-gray-700 font-medium">
                                {userInfo.userId === user?._id ? 'You' : userInfo.pharmacyName || userInfo.ownerName || `User ${userInfo.userId.substring(0, 8)}...`}
                              </span>
                              <div className="text-xs text-gray-500">
                                {userInfo.userId === user?._id ? 'Online now' : userInfo.ownerName ? `Owner: ${userInfo.ownerName}` : 'Online now'}
                              </div>
                            </div>
                          </div>
                          {userInfo.userId !== user?._id && (
                            <Link 
                              to={`/chat/${userInfo.userId}`}
                              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                              onClick={() => setShowOnlineUsers(false)}
                            >
                              Chat
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <div className="text-gray-400 mb-2">
                        <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      No users online
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={toggleNotifications}
              className="notification-button relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <img
                src={Notificat}
                alt="Notification"
                className="w-6 h-6 sm:w-7 sm:h-7"
              />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium shadow-lg animate-pulse">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>

            {/* Notifications Panel */}
            {showNotifications && (
              <div className="notification-dropdown fixed inset-0 z-50 md:absolute md:inset-auto md:right-0 md:top-12 md:w-80">
                <div className="absolute inset-0 bg-black bg-opacity-50 md:hidden" onClick={() => setShowNotifications(false)}></div>
                <div className="relative bg-white w-full h-full md:w-80 md:h-auto md:max-h-96 md:rounded-lg md:shadow-xl border-0 md:border border-gray-200 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b bg-green-50">
                    <h4 className="text-lg font-semibold text-gray-800">Notifications</h4>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Notifications List */}
                  <div className="overflow-y-auto max-h-80 md:max-h-64">
                    {allNotifications.length > 0 ? (
                      <ul className="divide-y divide-gray-100">
                        {allNotifications.map((notification) => (
                          <li
                            key={notification._id}
                            className={`p-4 hover:bg-gray-50 transition-colors ${
                              notification.read ? 'opacity-60' : 'bg-blue-50'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              {/* Notification Icon */}
                              <div className="flex-shrink-0 mt-1">
                                {notification.type === 'chat' && (
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                  </div>
                                )}
                                {notification.type === 'new_request' && (
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                  </div>
                                )}
                                {notification.type === 'status_update' && (
                                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                  </div>
                                )}
                                {notification.type === 'new_medicine' && (
                                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                  </div>
                                )}
                                {!['chat', 'new_request', 'status_update', 'new_medicine'].includes(notification.type) && (
                                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 1 0-15 0v5z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                                      {notification.message}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <span className={`text-xs px-2 py-1 rounded-full ${
                                        notification.type === 'chat' ? 'bg-blue-100 text-blue-800' :
                                        notification.type === 'new_request' ? 'bg-green-100 text-green-800' :
                                        notification.type === 'status_update' ? 'bg-yellow-100 text-yellow-800' :
                                        notification.type === 'new_medicine' ? 'bg-purple-100 text-purple-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {notification.type === 'chat' ? 'Message' :
                                         notification.type === 'new_request' ? 'Request' :
                                         notification.type === 'status_update' ? 'Update' :
                                         notification.type === 'new_medicine' ? 'Medicine' :
                                         'Notification'}
                                      </span>
                                      <p className="text-xs text-gray-500">
                                        {new Date(notification.createdAt || notification.timestamp).toLocaleDateString()} at{' '}
                                        {new Date(notification.createdAt || notification.timestamp).toLocaleTimeString([], { 
                                          hour: '2-digit', 
                                          minute: '2-digit' 
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Action Buttons */}
                                  <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                                    {!notification.read && notification.type !== 'chat' && (
                                      <button
                                        onClick={() => markAsRead(notification._id)}
                                        className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full hover:bg-blue-600 transition-colors"
                                        title="Mark as read"
                                      >
                                        ✓
                                      </button>
                                    )}
                                    <button
                                      onClick={() => deleteNotification(notification._id)}
                                      className="text-xs bg-red-500 text-white px-2 py-1 rounded-full hover:bg-red-600 transition-colors"
                                      title="Delete notification"
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-8 text-center">
                        <div className="text-gray-400 mb-2">
                          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 1 0-15 0v5z" />
                          </svg>
                        </div>
                        <p className="text-gray-500">No notifications yet</p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="border-t p-3 bg-gray-50 space-y-2">
                    {/* Test Notification Buttons (Development) */}
                    {import.meta.env.DEV && (
                      <div className="space-y-2">
                        <button
                          onClick={createTestNotification}
                          className="w-full text-sm bg-blue-500 text-white py-2 px-3 rounded hover:bg-blue-600 transition-colors"
                        >
                          Test Local Notification
                        </button>
                        <button
                          onClick={sendTestNotificationToServer}
                          className="w-full text-sm bg-green-500 text-white py-2 px-3 rounded hover:bg-green-600 transition-colors"
                        >
                          Test Server Notification
                        </button>
                      </div>
                    )}
                    
                    {allNotifications.length > 0 && (
                      <button
                        onClick={() => setAllNotifications([])}
                        className="w-full text-sm text-gray-600 hover:text-red-600 transition-colors"
                      >
                        Clear All Notifications
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {user ? (
              <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-600 flex items-center justify-center text-white text-sm sm:text-lg font-semibold">
                  {generateAvatar(user.ownerName)}
                </div>
                <div className="hidden sm:flex flex-col">
                  <p className="text-sm font-semibold text-gray-800">{user.ownerName}</p>
                  <p className="text-xs text-gray-600">Account</p>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {isSearchExpanded && (
        <div className="md:hidden px-4 pb-4 border-b">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-4.35-4.35M17 10a7 7 0 1 0-14 0 7 7 0 0 0 14 0z"
                />
              </svg>
            </button>
          </form>

          {/* Mobile Search Results */}
          {searchResults.length > 0 && (
            <div className="absolute left-4 right-4 mt-2 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
              <ul>
                {searchResults.map((medicine) => (
                  <Link to={`/medicines/${medicine._id}`} key={medicine._id}>
                    <li
                      className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      onClick={() => {
                        console.log('Selected medicine:', medicine);
                        setSearchTerm('');
                        setSearchResults([]);
                        setIsSearchExpanded(false);
                      }}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <div>
                          <span className="font-semibold block">{medicine.name}</span>
                          <span className="text-sm text-gray-600 block">
                            Expires: {new Date(medicine.expiryDate).toLocaleDateString()}
                          </span>
                          <span className="text-sm text-gray-600 block">
                            Pharmacy: {medicine.pharmacy.pharmacyName}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-2 sm:mt-0">
                          {medicine.distance ? `${medicine.distance.toFixed(0)}m away` : 'Distance unknown'}
                        </div>
                      </div>
                    </li>
                  </Link>
                ))}
              </ul>
            </div>
          )}

          {isSearching && (
            <div className="absolute left-4 right-4 mt-2 bg-white border border-gray-300 rounded-md shadow-lg z-10 p-4">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                <span className="ml-2">Searching...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-green-500">
        <div className="container mx-auto flex justify-center space-x-8 px-4 py-3">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? "text-blue-100 font-extrabold bg-blue-600 px-3 py-1 rounded"
                : "text-white text-sm font-semibold hover:text-blue-200 transition-colors px-3 py-1 rounded hover:bg-green-600"
            }
          >
            Home
          </NavLink>
          
          <NavLink
            to="/categories"
            className={({ isActive }) =>
              isActive
                ? "text-blue-100 font-extrabold bg-blue-600 px-3 py-1 rounded"
                : "text-white text-sm font-semibold hover:text-blue-200 transition-colors px-3 py-1 rounded hover:bg-green-600"
            }
          >
            Categories
          </NavLink>
          
          {user && (
            <NavLink
              to="/requests"
              className={({ isActive }) =>
                isActive
                  ? "text-blue-100 font-extrabold bg-blue-600 px-3 py-1 rounded"
                  : "text-white text-sm font-semibold hover:text-blue-200 transition-colors px-3 py-1 rounded hover:bg-green-600"
              }
            >
              Requests
            </NavLink>
          )}
          
          {user && (
            <NavLink
              to="/store"
              className={({ isActive }) =>
                isActive
                  ? "text-blue-100 font-extrabold bg-blue-600 px-3 py-1 rounded"
                  : "text-white text-sm font-semibold hover:text-blue-200 transition-colors px-3 py-1 rounded hover:bg-green-600"
              }
            >
              Medicine
            </NavLink>
          )}
          
          <NavLink
            to="/about"
            className={({ isActive }) =>
              isActive
                ? "text-blue-100 font-extrabold bg-blue-600 px-3 py-1 rounded"
                : "text-white text-sm font-semibold hover:text-blue-200 transition-colors px-3 py-1 rounded hover:bg-green-600"
            }
          >
            About Us
          </NavLink>
          
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              isActive
                ? "text-blue-100 font-extrabold bg-blue-600 px-3 py-1 rounded"
                : "text-white text-sm font-semibold hover:text-blue-200 transition-colors px-3 py-1 rounded hover:bg-green-600"
            }
          >
            Contact Us
          </NavLink>
          
          <NavLink
            to="/ask"
            className={({ isActive }) =>
              isActive
                ? "text-blue-100 font-extrabold bg-blue-600 px-3 py-1 rounded"
                : "text-white text-sm font-semibold hover:text-blue-200 transition-colors px-3 py-1 rounded hover:bg-green-600"
            }
          >
            Ask Pharmacist
          </NavLink>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-green-500 border-t border-green-400">
          <div className="px-4 py-2 space-y-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive
                  ? "block text-blue-200 font-extrabold bg-blue-600 px-3 py-2 rounded"
                  : "block text-white text-sm font-semibold hover:text-blue-200 transition-colors px-3 py-2 rounded hover:bg-green-600"
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              🏠 Home
            </NavLink>
            
            <NavLink
              to="/categories"
              className={({ isActive }) =>
                isActive
                  ? "block text-blue-200 font-extrabold bg-blue-600 px-3 py-2 rounded"
                  : "block text-white text-sm font-semibold hover:text-blue-200 transition-colors px-3 py-2 rounded hover:bg-green-600"
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              📂 Categories
            </NavLink>
            
            {user && (
              <NavLink
                to="/requests"
                className={({ isActive }) =>
                  isActive
                    ? "block text-blue-200 font-extrabold bg-blue-600 px-3 py-2 rounded"
                    : "block text-white text-sm font-semibold hover:text-blue-200 transition-colors px-3 py-2 rounded hover:bg-green-600"
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                📋 Requests
              </NavLink>
            )}
            
            {user && (
              <NavLink
                to="/store"
                className={({ isActive }) =>
                  isActive
                    ? "block text-blue-200 font-extrabold bg-blue-600 px-3 py-2 rounded"
                    : "block text-white text-sm font-semibold hover:text-blue-200 transition-colors px-3 py-2 rounded hover:bg-green-600"
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                💊 Medicine
              </NavLink>
            )}
            
            <NavLink
              to="/about"
              className={({ isActive }) =>
                isActive
                  ? "block text-blue-200 font-extrabold bg-blue-600 px-3 py-2 rounded"
                  : "block text-white text-sm font-semibold hover:text-blue-200 transition-colors px-3 py-2 rounded hover:bg-green-600"
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ℹ️ About Us
            </NavLink>
            
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                isActive
                  ? "block text-blue-200 font-extrabold bg-blue-600 px-3 py-2 rounded"
                  : "block text-white text-sm font-semibold hover:text-blue-200 transition-colors px-3 py-2 rounded hover:bg-green-600"
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              📞 Contact Us
            </NavLink>
            
            <NavLink
              to="/ask"
              className={({ isActive }) =>
                isActive
                  ? "block text-blue-200 font-extrabold bg-blue-600 px-3 py-2 rounded"
                  : "block text-white text-sm font-semibold hover:text-blue-200 transition-colors px-3 py-2 rounded hover:bg-green-600"
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              👨‍⚕️ Ask Pharmacist
            </NavLink>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;