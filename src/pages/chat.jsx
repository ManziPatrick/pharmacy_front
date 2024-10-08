import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Send } from 'lucide-react';
import io from 'socket.io-client';
import { getUserFromToken } from '../utils/auth';
const API_BASE_URL = 'https://pharmacies-management.onrender.com';

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

  const initializeSocket = useCallback(() => {
    const token = localStorage.getItem('token');
    const newSocket = io(API_BASE_URL, {
      auth: { token },
      query: { userId: user?.id || 'anonymous' }
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
    });

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

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.off('message', handleNewMessage);
      newSocket.close();
    };
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = getUserFromToken(token)
    if (userData) {

      setUser({ token, id:userData._id});
    }
    // console.log("JJJJJJJ",userData._id)
    
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

  const handleNewMessage = useCallback((message) => {
    setChatHistories(prev => {
      const relevantId = message.sender === user?.id ? message.receiver : message.sender;
      const existingHistory = prev[relevantId] || [];
      return {
        ...prev,
        [relevantId]: [...existingHistory, message]
      };
    });
  }, [user]);

  const fetchPharmacies = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/users`);
      if (!response.ok) throw new Error('Failed to fetch pharmacies');
      const data = await response.json();
      setPharmacies(data);
    } catch (error) {
      setError('Error fetching pharmacies: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePharmacySelect = async (pharmacy) => {
    try {
      setSelectedPharmacy(pharmacy);
      navigate(`/chat/${pharmacy._id}`);
      
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
      const headers = {};
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
      
      const response = await fetch(
        `${API_BASE_URL}/api/chat/history/${pharmacyId}`,
        { headers }
      );
      if (!response.ok) throw new Error('Failed to fetch chat history');
      const data = await response.json();
      
      setChatHistories(prev => ({
        ...prev,
        [pharmacyId]: data
      }));
    } catch (error) {
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
    if ((!message.trim() && !imagePreview) || !selectedPharmacy) return;

    const messageData = {
      pharmacyId: selectedPharmacy._id,
      message: message.trim(),
      image: imagePreview
    };

    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/chat/send`, {
        method: 'POST',
        headers,
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }
      

      const sentMessage = await response.json();
      console.log("JJJJJJJ",sentMessage )
      if (socketRef.current) {
        socketRef.current.emit('sendMessage', sentMessage);
      }

      handleNewMessage(sentMessage);
      setMessage('');
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      setError('Failed to send message: ' + error.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-green-600">Chat with Pharmacy</h1>

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 bg-blue-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">Select a Pharmacy</h2>
          {isLoading ? (
            <p className="text-gray-600">Loading pharmacies...</p>
          ) : pharmacies.length > 0 ? (
            <ul className="space-y-2">
              {pharmacies.map(pharmacy => (
                <li key={pharmacy._id}>
                  <Button 
                    onClick={() => handlePharmacySelect(pharmacy)} 
                    variant={selectedPharmacy?._id === pharmacy._id ? 'default' : 'outline'} 
                    className="w-full text-left"
                  >
                    <span className="flex justify-between items-center">
                      {pharmacy.pharmacyName}
                      {onlinePharmacies.has(pharmacy._id) && (
                        <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                      )}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No pharmacies found.</p>
          )}
        </div>

        <div className="md:col-span-3">
          {selectedPharmacy ? (
            <div className="bg-green-50 p-4 rounded-lg">
              <div ref={chatContainerRef} className="h-96 overflow-y-auto border border-green-200 rounded-md p-4 mb-4 bg-white">
                {chatHistories[selectedPharmacy._id]?.length > 0 ? (
                  chatHistories[selectedPharmacy._id].map((msg, index) => {
                    const isOwnMessage = user ? msg.sender === user.id : msg.isAnonymous;
                    return (
                      <div key={index} className={`mb-4 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                        <div className={`inline-block rounded-lg p-3 max-w-xs lg:max-w-md ${
                          isOwnMessage ? 'bg-green-500 text-white' : 'bg-blue-100 text-gray-800'
                        }`}>
                          {msg.message && <p className="mb-1">{msg.message}</p>}
                          {msg.image && (
                            <img src={msg.image} alt="Uploaded" className="mt-2 rounded-md max-w-full" />
                          )}
                          <span className="text-xs opacity-75 block mt-1">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-600 text-center">No messages yet. Start chatting!</p>
                )}
              </div>

              <div className="flex items-center space-x-2 bg-white p-2 rounded-lg">
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Camera className="text-green-500 hover:text-green-600" />
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
                    if (e.key === 'Enter') sendMessage();
                  }}
                  className="flex-grow"
                />
                <Button onClick={sendMessage}>
                  <Send size={20} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 p-8 rounded-lg text-center">
              <p className="text-xl text-blue-600">Select a pharmacy to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;