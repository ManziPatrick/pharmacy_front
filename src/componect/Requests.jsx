import React, { useEffect, useState } from 'react';
import { getUserFromToken } from '../utils/auth';
import { Clock, CheckCircle, XCircle, RefreshCw, MessageCircle } from 'lucide-react';
import ApiService from '../utils/api';

const StatusIcon = ({ status }) => {
  const icons = {
    Pending: <Clock className="h-5 w-5 text-yellow-500" />,
    Fulfilled: <CheckCircle className="h-5 w-5 text-green-500" />,
    Rejected: <XCircle className="h-5 w-5 text-red-500" />
  };
  return icons[status] || null;
};

const RequestCard = ({ request, onStatusUpdate, isReceived, onChatClick }) => {
  return (
    <div className="bg-white p-4 shadow-md rounded-lg mb-4 hover:shadow-lg transition-shadow">
      <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <StatusIcon status={request.status} />
            <p className="font-bold text-gray-800 text-sm lg:text-base">
              Medicine: {request.medicine_id?.name || 'Unknown Medicine'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
            <p>Quantity: {request.medicine_id?.quantity || 'N/A'}</p>
            <p>Price: ${request.medicine_id?.price || '0'}</p>
            <p className="flex items-center gap-1">
              Status: 
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                request.status === 'Fulfilled' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {request.status}
              </span>
            </p>
          </div>
        </div>
        
        <div className="flex flex-col lg:text-right gap-2">
          <p className={`font-semibold text-sm lg:text-base ${isReceived ? 'text-blue-600' : 'text-green-600'}`}>
            Commission: ${request.commission}
          </p>
          <p className="text-gray-500 text-xs">
            {new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {/* Chat button for both initiated and received requests */}
            <button
              className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors text-xs"
              onClick={() => onChatClick(isReceived ? request.requester_id : request.pharmacy_id)}
            >
              <MessageCircle size={14} />
              Chat
            </button>
            
            {isReceived && request.status === 'Pending' && (
              <>
                <button
                  className="px-3 py-1 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors text-xs"
                  onClick={() => onStatusUpdate(request._id, 'Fulfilled')}
                >
                  Fulfill
                </button>
                <button
                  className="px-3 py-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors text-xs"
                  onClick={() => onStatusUpdate(request._id, 'Rejected')}
                >
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Requests() {
  const [pharmacy, setPharmacy] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('initiated');
  const [pharmacyId, setPharmacyId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchPharmacyData = async (id) => {
    try {
      console.log('Fetching data for pharmacyId:', id);
      setError(null);
      const data = await ApiService.get(`/api/users/${id}`);
      console.log('Pharmacy data:', data);
      setPharmacy(data);
      setIsLoading(false);
    } catch (error) {
      setError('Error fetching pharmacy data: ' + error.message);
      console.error('Error fetching pharmacy data:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      const userData = getUserFromToken(token);
      console.log('Decoded User Data:', userData);
      if (userData && userData._id) {
        setPharmacyId(userData._id);
        fetchPharmacyData(userData._id);
      }
    }
  }, []);

  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      console.log(`Attempting to update request ${requestId} to status ${newStatus}`);
      
      // Validate inputs before making the API call
      if (!requestId) {
        throw new Error('Request ID is missing');
      }
      if (!newStatus) {
        throw new Error('New status is missing');
      }
      if (!pharmacyId) {
        throw new Error('Pharmacy ID is missing. Please refresh the page and try again.');
      }
      
      const updatedRequest = await ApiService.updateRequestStatus(requestId, newStatus);
      console.log('Updated Request:', updatedRequest);
      
      // Show success message
      setError(null);
      
      // Refresh pharmacy data to show updated status
      await fetchPharmacyData(pharmacyId);
      
    } catch (error) {
      console.error('Error updating request status:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      setError(`Failed to update request status: ${errorMessage}`);
    }
  };

  const handleChatClick = (targetPharmacyId) => {
    // Navigate to chat with the specific pharmacy
    window.location.href = `/chat/${targetPharmacyId}`;
  };

  const handleRefresh = () => {
    if (pharmacyId) {
      setIsLoading(true);
      fetchPharmacyData(pharmacyId);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900">Medicine Requests</h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="bg-white w-64 h-full shadow-lg p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Navigation</h2>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="space-y-2">
              <button
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  activeTab === 'initiated' ? 'bg-green-600 text-white' : 'text-blue-600 hover:bg-blue-50'
                }`}
                onClick={() => {
                  setActiveTab('initiated');
                  setIsMobileMenuOpen(false);
                }}
              >
                Requests Initiated
              </button>
              <button
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  activeTab === 'received' ? 'bg-green-600 text-white' : 'text-green-600 hover:bg-green-50'
                }`}
                onClick={() => {
                  setActiveTab('received');
                  setIsMobileMenuOpen(false);
                }}
              >
                Requests Received
              </button>
            </nav>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-1/4 bg-white shadow-sm p-6 min-h-screen">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Navigation</h2>
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
          </div>
          <nav className="space-y-2">
            <button
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                activeTab === 'initiated' ? 'bg-green-600 text-white' : 'text-blue-600 hover:bg-blue-50'
              }`}
              onClick={() => setActiveTab('initiated')}
            >
              Requests Initiated
            </button>
            <button
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                activeTab === 'received' ? 'bg-green-600 text-white' : 'text-green-600 hover:bg-green-50'
              }`}
              onClick={() => setActiveTab('received')}
            >
              Requests Received
            </button>
          </nav>
        </aside>

        <main className="flex-1 lg:w-3/4 p-4 lg:p-8 overflow-y-auto">
          {/* Mobile Tab Selector */}
          <div className="lg:hidden mb-4">
            <div className="flex bg-white rounded-lg shadow-sm p-1">
              <button
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'initiated' ? 'bg-green-600 text-white' : 'text-blue-600 hover:bg-blue-50'
                }`}
                onClick={() => setActiveTab('initiated')}
              >
                Initiated
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'received' ? 'bg-green-600 text-white' : 'text-green-600 hover:bg-green-50'
                }`}
                onClick={() => setActiveTab('received')}
              >
                Received
              </button>
            </div>
          </div>

          {/* Content Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 hidden lg:block">
              {activeTab === 'initiated' ? 'Requests Initiated' : 'Requests Received'}
            </h1>
            <button
              onClick={handleRefresh}
              className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              disabled={isLoading}
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              <span className="text-sm">Refresh</span>
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(n => (
                <div key={n} className="bg-white p-4 shadow-md rounded-lg animate-pulse">
                  <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    </div>
                    <div className="lg:text-right">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {activeTab === 'initiated' && (
                <div className="space-y-4">
                  {pharmacy?.requestsInitiated?.length > 0 ? (
                    pharmacy.requestsInitiated.map((request) => (
                      <RequestCard
                        key={request._id}
                        request={request}
                        isReceived={false}
                        onChatClick={handleChatClick}
                      />
                    ))
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Requests Initiated</h3>
                      <p className="text-gray-600">You haven't initiated any medicine requests yet.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'received' && (
                <div className="space-y-4">
                  {pharmacy?.requestsReceived?.length > 0 ? (
                    pharmacy.requestsReceived.map((request) => (
                      <RequestCard
                        key={request._id}
                        request={request}
                        onStatusUpdate={updateRequestStatus}
                        isReceived={true}
                        onChatClick={handleChatClick}
                      />
                    ))
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                      <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Requests Received</h3>
                      <p className="text-gray-600">You haven't received any medicine requests yet.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}