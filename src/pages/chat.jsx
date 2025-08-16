import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Send, Phone, MapPin, Clock } from 'lucide-react';
import io from 'socket.io-client';
import Header from "../componect/head";
import { getUserFromToken } from '../utils/auth';
import ApiService from '../utils/api';

const API_BASE_URL = import.meta.env.REACT_APP_API_URL || 'https://pharmacies-management.onrender.com';

const Button = ({ children, onClick, variant = 'default', className = '' }) => {
  const baseStyles = 'px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variantStyles = {
    default: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-green-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  };

  return (
    <button 
      onClick={onClick} 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ type = 'text', value, onChange, placeholder, className = '', onKeyDown }) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${className}`}
    />
  );
};

const Chat = () => {
  const { pharmacyId } = useParams();
  const navigate = useNavigate();
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [chatHistories, setChatHistories] = useState({});
  const [unreadMessages, setUnreadMessages] = useState({}); // {pharmacyId: count}
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [onlinePharmacies, setOnlinePharmacies] = useState(new Set());

  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const socketRef = useRef();

  // --- Move handleNewMessage above initializeSocket to avoid ReferenceError ---
  const handleNewMessage = useCallback((message) => {
    console.log('New message received:', message);
    
    // Determine which pharmacy this message belongs to
    let pharmacyId;
    if (message.sender === user?.id) {
      // Message sent by current user - use receiver as pharmacy ID
      pharmacyId = message.receiver;
    } else {
      // Message received from pharmacy - use sender as pharmacy ID
      pharmacyId = message.sender;
    }
    
    setChatHistories(prev => {
      const existingHistory = prev[pharmacyId] || [];
      // Check if message already exists to avoid duplicates
      const messageExists = existingHistory.some(msg => 
        msg._id === message._id || 
        (msg.message === message.message && 
         Math.abs(new Date(msg.createdAt) - new Date(message.createdAt)) < 1000)
      );
      if (messageExists) {
        return prev;
      }
      return {
        ...prev,
        [pharmacyId]: [...existingHistory, message].sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        )
      };
    });
    
    // If not currently viewing this pharmacy, increment unread count
    setUnreadMessages(prev => {
      if (selectedPharmacy && selectedPharmacy._id === pharmacyId) return prev;
      return { ...prev, [pharmacyId]: (prev[pharmacyId] || 0) + 1 };
    });
    
    // Scroll to bottom after a short delay if viewing this chat
    setTimeout(() => {
      if (chatContainerRef.current && selectedPharmacy && selectedPharmacy._id === pharmacyId) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  }, [user, selectedPharmacy]);

  const initializeSocket = useCallback(() => {
    if (!user?.id) return;
    try {
      const token = localStorage.getItem('authToken');
      const newSocket = io(API_BASE_URL, {
        auth: { token },
        query: { userId: user.id },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });
      newSocket.on('connect', () => {
        console.log('Connected to socket server');
        setError(null);
        if (user?.id) {
          newSocket.emit('authenticate', { userId: user.id });
        }
      });
      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setError('Failed to connect to chat server. Please try again.');
      });
      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from socket server:', reason);
        if (reason === 'io server disconnect') {
          newSocket.connect();
        }
      });
      // Listen for the full onlinePharmacies list from backend
      newSocket.on('onlinePharmacies', (pharmacyIds) => {
        setOnlinePharmacies(new Set(pharmacyIds));
      });
      // Fallback for single online/offline events (optional, for legacy support)
      newSocket.on('pharmacyOnline', (pharmacyId) => {
        setOnlinePharmacies(prev => new Set([...prev, pharmacyId]));
      });
      newSocket.on('pharmacyOffline', (pharmacyId) => {
        setOnlinePharmacies(prev => {
          const newSet = new Set(prev);
          newSet.delete(pharmacyId);
          return newSet;
        });
      });
      newSocket.on('message', handleNewMessage);
      newSocket.on('receiveMessage', handleNewMessage);
      newSocket.on('newMessage', handleNewMessage);
      newSocket.on('messageConfirmed', (data) => {
        console.log('Message confirmed:', data);
      });
      newSocket.on('messageError', (error) => {
        console.error('Message error:', error);
        setError('Failed to send message: ' + error.error);
      });
      newSocket.on('joinedChat', (data) => {
        console.log('Joined chat:', data);
      });
      newSocket.on('joinError', (error) => {
        console.error('Join error:', error);
        setError('Failed to join chat: ' + error.error);
      });
      socketRef.current = newSocket;
      setSocket(newSocket);
      return () => {
        if (newSocket) {
          newSocket.off('message', handleNewMessage);
          newSocket.off('receiveMessage', handleNewMessage);
          newSocket.off('newMessage', handleNewMessage);
          newSocket.off('messageConfirmed');
          newSocket.off('messageError');
          newSocket.off('joinedChat');
          newSocket.off('joinError');
          newSocket.off('pharmacyOnline');
          newSocket.off('pharmacyOffline');
          newSocket.off('onlinePharmacies');
          newSocket.close();
        }
      };
    } catch (error) {
      console.error('Error initializing socket:', error);
      setError('Failed to initialize chat connection.');
    }
  }, [user?.id, handleNewMessage]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = getUserFromToken(token);
    if (userData) {
      setUser({ 
        token, 
        id: userData._id,
        name: userData.name || userData.ownerName,
        ownerName: userData.ownerName
      });
    }
    
    return initializeSocket();
  }, [initializeSocket]);


  useEffect(() => {
    fetchPharmacies();
  }, []);

  useEffect(() => {
    if (pharmacyId && pharmacies.length > 0) {
      const pharmacy = pharmacies.find(p => p._id === pharmacyId);
      if (pharmacy) handlePharmacySelect(pharmacy);
    }
  }, [pharmacyId, pharmacies]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [selectedPharmacy, chatHistories]);

  const fetchPharmacies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await ApiService.getAllPharmacies();
      setPharmacies(data);
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
      setError('Error fetching pharmacies: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePharmacySelect = async (pharmacy) => {
    try {
      setSelectedPharmacy(pharmacy);
      navigate(`/chat/${pharmacy._id}`);
      // Mark messages as read for this pharmacy
      setUnreadMessages(prev => ({ ...prev, [pharmacy._id]: 0 }));
      if (!chatHistories[pharmacy._id]) {
        await fetchChatHistory(pharmacy._id);
      }
      if (socketRef.current) {
        socketRef.current.emit('joinChat', pharmacy._id);
      }
    } catch (error) {
      setError('Error selecting pharmacy: ' + error.message);
    }
  };

  const fetchChatHistory = async (pharmacyId) => {
    try {
      const data = await ApiService.getChatHistory(pharmacyId);
      
      setChatHistories(prev => ({
        ...prev,
        [pharmacyId]: data
      }));
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setError('Failed to load chat history: ' + error.message);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        setError('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async () => {
    if ((!message.trim() && !imagePreview) || !selectedPharmacy || !user?.id) return;

    const tempMessage = {
      _id: `temp_${Date.now()}`, // Temporary ID with prefix
      sender: user.id,
      receiver: selectedPharmacy._id,
      message: message.trim(),
      image: imagePreview,
      createdAt: new Date().toISOString(),
      isAnonymous: false,
      status: 'sending'
    };

    // Add message to local state immediately for better UX
    setChatHistories(prev => {
      const pharmacyId = selectedPharmacy._id;
      const existingHistory = prev[pharmacyId] || [];
      return {
        ...prev,
        [pharmacyId]: [...existingHistory, tempMessage].sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        )
      };
    });
    
    // Clear input immediately
    const messageText = message.trim();
    const imageData = imagePreview;
    setMessage('');
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Scroll to bottom
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);

    try {
      const sentMessage = await ApiService.sendMessage(
        selectedPharmacy._id,
        messageText,
        imageData
      );
      
      // Update the temporary message with the real one
      setChatHistories(prev => {
        const pharmacyId = selectedPharmacy._id;
        const existingHistory = prev[pharmacyId] || [];
        
        // Replace temporary message with real one
        const updatedHistory = existingHistory.map(msg => 
          msg._id === tempMessage._id ? { ...sentMessage, status: 'sent' } : msg
        );
        
        return {
          ...prev,
          [pharmacyId]: updatedHistory
        };
      });
      
      // Emit message through socket if connected
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('sendMessage', {
          ...sentMessage,
          receiverId: selectedPharmacy._id
        });
      } else {
        console.warn('Socket not connected, message sent via HTTP only');
      }

    } catch (error) {
      console.error('Send message error:', error);
      setError('Failed to send message: ' + error.message);
      
      // Mark message as failed
      setChatHistories(prev => {
        const pharmacyId = selectedPharmacy._id;
        const existingHistory = prev[pharmacyId] || [];
        
        const updatedHistory = existingHistory.map(msg => 
          msg._id === tempMessage._id ? { ...msg, status: 'failed' } : msg
        );
        
        return {
          ...prev,
          [pharmacyId]: updatedHistory
        };
      });
    }
  };

  return (
    <>
    <Header/>
   
    <div className="max-w-7xl mx-auto p-3 lg:p-6 bg-white shadow-lg rounded-lg min-h-[calc(100vh-120px)]">
      <h1 className="text-2xl lg:text-3xl font-bold mb-4 lg:mb-6 text-green-600">Chat with Pharmacy</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
          <button 
            className="absolute top-0 right-0 p-2"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Pharmacy List - Mobile: Full width, Desktop: 1/4 width */}
        <div className="lg:col-span-1 bg-blue-50 p-3 lg:p-4 rounded-lg">
          <h2 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4 text-blue-600">Select a Pharmacy</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading pharmacies...</span>
            </div>
          ) : pharmacies.length > 0 ? (
            <div className="space-y-2 max-h-64 lg:max-h-96 overflow-y-auto">
              {pharmacies.map(pharmacy => {
                const lastMsgArr = chatHistories[pharmacy._id] || [];
                const lastMsg = lastMsgArr.length > 0 ? lastMsgArr[lastMsgArr.length - 1] : null;
                const isOnline = onlinePharmacies.has(pharmacy._id);
                const unread = unreadMessages[pharmacy._id] || 0;
                return (
                  <div key={pharmacy._id} className="bg-white rounded-lg p-2 shadow-sm">
                    <Button 
                      onClick={() => handlePharmacySelect(pharmacy)} 
                      variant={selectedPharmacy?._id === pharmacy._id ? 'default' : 'outline'} 
                      className="w-full text-left p-3 relative"
                    >
                      <div className="flex flex-col space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm lg:text-base truncate">
                            {pharmacy.pharmacyName}
                          </span>
                          {isOnline && (
                            <span className="h-2 w-2 bg-green-500 rounded-full flex-shrink-0"></span>
                          )}
                          {unread > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                              {unread > 99 ? '99+' : unread}
                            </span>
                          )}
                        </div>
                        {lastMsg && (
                          <div className="text-xs text-gray-500 truncate">
                            {lastMsg.sender === user?.id ? 'You: ' : ''}{lastMsg.message || '[Image]'}
                          </div>
                        )}
                        {pharmacy.location && (
                          <div className="flex items-center text-xs text-gray-500">
                            <MapPin size={12} className="mr-1" />
                            <span className="truncate">{pharmacy.location}</span>
                          </div>
                        )}
                        {pharmacy.phoneNumber && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Phone size={12} className="mr-1" />
                            <span>{pharmacy.phoneNumber}</span>
                          </div>
                        )}
                      </div>
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No pharmacies found.</p>
              <Button 
                onClick={fetchPharmacies} 
                variant="outline" 
                className="mt-2 text-sm"
              >
                Refresh
              </Button>
            </div>
          )}
        </div>

        {/* Chat Area - Mobile: Full width, Desktop: 3/4 width */}
        <div className="lg:col-span-3">
          {selectedPharmacy ? (
            <div className="bg-green-50 p-3 lg:p-4 rounded-lg h-full flex flex-col">
              {/* Pharmacy Header */}
              <div className="bg-white p-3 rounded-lg mb-3 lg:mb-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {selectedPharmacy.pharmacyName?.charAt(0) || 'P'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm lg:text-base">
                        {selectedPharmacy.pharmacyName}
                      </h3>
                      <div className="flex items-center text-xs text-gray-500">
                        {onlinePharmacies.has(selectedPharmacy._id) ? (
                          <>
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                            <span>Online</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
                            <span>Offline</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedPharmacy.phoneNumber && (
                    <a 
                      href={`tel:${selectedPharmacy.phoneNumber}`}
                      className="p-2 bg-green-100 rounded-full hover:bg-green-200 transition-colors"
                    >
                      <Phone size={16} className="text-green-600" />
                    </a>
                  )}
                </div>
              </div>

              {/* Chat Messages */}
              <div 
                ref={chatContainerRef} 
                className="flex-1 overflow-y-auto border border-green-200 rounded-md p-3 lg:p-4 mb-3 lg:mb-4 bg-white min-h-[300px] lg:min-h-[400px] space-y-3"
              >
                {chatHistories[selectedPharmacy._id]?.length > 0 ? (
                  chatHistories[selectedPharmacy._id].map((msg, index) => {
                    const isOwnMessage = user ? msg.sender === user.id : msg.isAnonymous;
                    
                    // Get sender information
                    let senderName, senderAvatar;
                    if (isOwnMessage) {
                      senderName = 'You';
                      senderAvatar = user?.ownerName?.charAt(0) || user?.name?.charAt(0) || 'Y';
                    } else {
                      // Message from pharmacy
                      const pharmacy = pharmacies.find(p => p._id === msg.sender) || selectedPharmacy;
                      senderName = pharmacy?.pharmacyName || pharmacy?.name || 'Pharmacy';
                      senderAvatar = senderName.charAt(0);
                    }
                    
                    return (
                      <div key={msg._id || index} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
                        <div className={`flex items-end space-x-2 max-w-[75%] lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          {/* Avatar */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${
                            isOwnMessage ? 'bg-green-600' : 'bg-blue-500'
                          }`}>
                            {senderAvatar}
                          </div>
                          
                          <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                            {/* Sender Name */}
                            <div className={`text-xs text-gray-500 mb-1 px-1`}>
                              {senderName}
                            </div>
                            
                            {/* Message Bubble */}
                            <div className={`rounded-lg p-3 lg:p-4 shadow-sm max-w-full ${
                              isOwnMessage 
                                ? 'bg-green-500 text-white rounded-br-sm' 
                                : 'bg-gray-100 border border-gray-200 text-gray-800 rounded-bl-sm'
                            }`}>
                              {msg.message && (
                                <p className="text-sm lg:text-base break-words whitespace-pre-wrap">
                                  {msg.message}
                                </p>
                              )}
                              {msg.image && (
                                <div className={msg.message ? 'mt-2' : ''}>
                                  <img 
                                    src={msg.image} 
                                    alt="Uploaded" 
                                    className="rounded-md max-w-full h-auto cursor-pointer hover:opacity-90 border border-gray-200" 
                                    onClick={() => window.open(msg.image, '_blank')}
                                    style={{ maxWidth: '200px', maxHeight: '200px' }}
                                  />
                                </div>
                              )}
                              
                              {/* Message Footer */}
                              <div className={`flex items-center justify-between mt-2 pt-1 ${
                                isOwnMessage ? 'border-t border-green-400 border-opacity-30' : 'border-t border-gray-300 border-opacity-30'
                              }`}>
                                <span className={`text-xs ${isOwnMessage ? 'text-green-100' : 'text-gray-500'}`}>
                                  {new Date(msg.createdAt).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                                {isOwnMessage && (
                                  <span className="text-xs text-green-100 ml-2">
                                    {msg.status === 'sending' && '⏳'}
                                    {msg.status === 'sent' && '✓'}
                                    {msg.status === 'failed' && '❌'}
                                    {!msg.status && '✓✓'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Send size={24} className="text-gray-400" />
                      </div>
                      <p className="text-gray-600 text-sm lg:text-base">No messages yet. Start chatting!</p>
                      <p className="text-gray-400 text-xs mt-1">Send a message to {selectedPharmacy.pharmacyName}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-3 p-2 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded" />
                    <button 
                      onClick={() => setImagePreview(null)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div className="flex items-center space-x-2 bg-white p-2 lg:p-3 rounded-lg shadow-sm">
                <label htmlFor="image-upload" className="cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Camera className="text-green-500 hover:text-green-600" size={20} />
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    ref={fileInputRef}
                  />
                </label>
                <Input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-grow text-sm lg:text-base"
                />
                <Button 
                  onClick={sendMessage}
                  disabled={(!message.trim() && !imagePreview) || !user?.id}
                  className="p-2 lg:p-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 p-6 lg:p-8 rounded-lg text-center h-full flex items-center justify-center">
              <div>
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send size={32} className="text-blue-400" />
                </div>
                <p className="text-lg lg:text-xl text-blue-600 mb-2">Select a pharmacy to start chatting</p>
                <p className="text-sm text-blue-400">Choose a pharmacy from the list to begin your conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default Chat;