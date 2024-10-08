import React, { useState, useEffect } from 'react';
import { getUserFromToken } from '../utils/auth';
import { generateAvatar } from '../utils/avatar';
import Notificat from '../assets/notification.png';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';


const Navbar = () => {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [socket, setSocket] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      const userData = getUserFromToken(token);
      if (userData && userData._id) {
        setUser(userData);
        fetchNotifications(userData._id);
        getUserLocation();
        setupSocket(userData._id, token);
      } else {
        console.error("Invalid user data in token");
        localStorage.removeItem('authToken'); 
      }
    } else {
      console.log("No token found in local storage");
    }
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
    const newSocket = io('https://pharmacies-management.onrender.com', {
      transports: ['websocket'],
      auth: { token },
    });
    setSocket(newSocket);
    newSocket.emit('join', userId);
    newSocket.on('new_request', handleNewNotification);
    newSocket.on('status_update', handleNewNotification);
    newSocket.on('new_medicine', handleNewNotification);
    
    return () => newSocket.disconnect();
  };

  const handleNewNotification = (notification) => {
    setUnreadNotifications((prev) => [notification, ...prev]);
    setNotificationCount((prev) => (prev === '99+' ? '99+' : prev + 1));
  };

  const fetchNotifications = async (userId) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`https://pharmacies-management.onrender.com/api/notify/notifications`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      const unread = data.filter((notif) => !notif.read);
      setUnreadNotifications(unread.slice(0, 5));
      setNotificationCount(unread.length > 99 ? '99+' : unread.length);
    } catch (error) {
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

      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
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

      setUnreadNotifications((prev) => prev.filter((notif) => notif._id !== notificationId));
      setNotificationCount((prev) => (prev === '99+' ? '99+' : prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <header className="bg-white shadow relative">
      <div className="container mx-auto flex items-center justify-between py-4 px-4">
        <div className="flex items-center space-x-2">
          <img
            src="https://via.placeholder.com/40"
            alt="PharmaCare Logo"
            className="h-10 w-10"
          />
          <span className="text-2xl font-bold text-green-600">PharmaCare</span>
        </div>

        <div className="flex-grow mx-4 relative">
          <form onSubmit={handleSearchSubmit} className="relative">
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

        {searchResults.length > 0 && (
          <div className="absolute mt-2 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
            <ul>
              {searchResults.map((medicine) => (
                <Link to={`/medicines/${medicine._id}`} key={medicine._id}>
                <li
                  key={medicine._id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
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
                      {medicine.distance ? `${medicine.distance.toFixed(0)} meters` : 'Distance unknown'}
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
            <div className="absolute mt-2 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 p-4">
              Loading...
            </div>
          )}
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-1 text-gray-700 relative">
            <img
              src={Notificat}
              alt="Notification"
              onClick={toggleNotifications}
              className="cursor-pointer"
            />

            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}

            {showNotifications && (
              <div className="absolute mt-2 right-0 w-60 bg-white border border-gray-300 rounded-md shadow-lg z-10 p-4 max-h-60 overflow-y-auto">
                <h4 className="font-semibold mb-2">Notifications</h4>
                <ul>
                  {unreadNotifications.length > 0 ? (
                    unreadNotifications.map((notification) => (
                      <li
                        key={notification._id}
                        className="px-2 py-1 hover:bg-gray-100 flex justify-between items-center"
                      >
                        <span>{notification.message}</span>
                        <button
                          onClick={() => markAsRead(notification._id)}
                          className="text-sm text-blue-500 hover:underline"
                        >
                          Mark as Read
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-600">No notifications</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 p-2 bg-white shadow rounded-lg">
            {user ? (
              <>
                <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white text-lg font-semibold">
                  {generateAvatar(user.ownerName)}
                </div>
                <div className="flex flex-col">
                  <p className="text-lg font-semibold text-gray-800">{user.ownerName}</p>
                  <div className="flex items-center space-x-1 text-gray-600">
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
                        d="M5.121 17.804A12.09 12.09 0 0 1 12 15c2.977 0 5.73.87 8.238 2.362m-6.057-7.266a4 4 0 1 1-6.038 0M12 11V5a4 4 0 0 1 8 0v6"
                      />
                    </svg>
                    <p className="text-sm">Account Settings</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-600">Not Logged In</p>
            )}
          </div>
        </div>
      </div>

      <nav className="bg-green-500">
        <div className="container mx-auto flex justify-between px-4 py-3">
          <Link to="/" className="text-white text-sm font-semibold hover:underline">
            Home
          </Link>
          <Link to="/categories" className="text-white text-sm font-semibold hover:underline">
          categories
          </Link>
          <Link to="/requests" className="text-white text-sm font-semibold hover:underline">
            Requests
          </Link>
          <Link to="/bonuses" className="text-white text-sm font-semibold hover:underline">
            Bonuses
          </Link>
          <Link to="/pharmacies" className="text-white text-sm font-semibold hover:underline">
            Pharmacies
          </Link>
          <Link to="/store" className="text-white text-sm font-semibold hover:underline">
          Medicine
          </Link>
          <Link to="/about" className="text-white text-sm font-semibold hover:underline">
            About Us
          </Link>
          <Link to="/contact" className="text-white text-sm font-semibold hover:underline">
            Contact Us
          </Link>
          <Link to="/ask" className="text-white text-sm font-semibold">
          Ask Your Pharmacist
          </Link>
         
        </div>
      </nav>
    </header>
  );
};

export default Navbar;