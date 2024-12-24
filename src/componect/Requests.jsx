import React, { useEffect, useState } from 'react';
import { getUserFromToken } from '../utils/auth';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

const StatusIcon = ({ status }) => {
  const icons = {
    Pending: <Clock className="h-5 w-5 text-yellow-500" />,
    Fulfilled: <CheckCircle className="h-5 w-5 text-green-500" />,
    Rejected: <XCircle className="h-5 w-5 text-red-500" />
  };
  return icons[status] || null;
};

const RequestCard = ({ request, onStatusUpdate, isReceived }) => {
  return (
    <div className="bg-white p-4 shadow-md rounded-lg mb-4">
      <div className="flex justify-between">
        <div>
          <div className="flex items-center gap-2">
            <StatusIcon status={request.status} />
            <p className="font-bold text-gray-800">
              Medicine: {request.medicine_id.name}
            </p>
          </div>
          <p className="text-gray-600">Quantity: {request.medicine_id.quantity}</p>
          <p className="text-gray-600">Price: ${request.medicine_id.price}</p>
          <p className="text-gray-600">Status: {request.status}</p>
        </div>
        <div className="text-right">
          <p className={`font-semibold ${isReceived ? 'text-blue-600' : 'text-green-600'}`}>
            Commission: ${request.commission}
          </p>
          <p className="text-gray-500">
            Created At: {new Date(request.createdAt).toLocaleString()}
          </p>
          {isReceived && request.status === 'Pending' && (
            <div className="mt-2">
              <button
                className="text-green-500 hover:text-green-700"
                onClick={() => onStatusUpdate(request._id, 'Fulfilled')}
              >
                Fulfill
              </button>
              <button
                className="text-red-500 ml-2 hover:text-red-700"
                onClick={() => onStatusUpdate(request._id, 'Rejected')}
              >
                Reject
              </button>
            </div>
          )}
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

  const fetchPharmacyData = async (id) => {
    try {
      console.log('Fetching data for pharmacyId:', id);
      const response = await fetch(`http://localhost:5000/api/users/${id}`);
      if (!response.ok) throw new Error('Failed to fetch pharmacy data');
      const data = await response.json();
      console.log('Pharmacy data:', data);
      setPharmacy(data);
      setIsLoading(false);
    } catch (error) {
      setError('Error fetching pharmacy data.');
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
      const response = await fetch(`http://localhost:5000/api/requests/${pharmacyId}/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update request status');

      const updatedRequest = await response.json();
      console.log('Updated Request:', updatedRequest);

  
      fetchPharmacyData(pharmacyId);
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  if (error) {
    return <div className="text-center text-red-600">{error}</div>;
  }

  return (
    <div className="flex">
      <aside className="w-1/4 bg-gray-200 p-4 h-screen fixed left-0">
        <h2 className="text-lg font-semibold">Navigation</h2>
        <ul className="mt-4">
          <li>
            <button
              className={`w-full text-left p-2 ${
                activeTab === 'initiated' ? 'bg-green-600 text-white' : 'text-blue-600'
              }`}
              onClick={() => setActiveTab('initiated')}
            >
              Requests Initiated
            </button>
          </li>
          <li>
            <button
              className={`w-full text-left p-2 ${
                activeTab === 'received' ? 'bg-green-600 text-white' : 'text-green-600'
              }`}
              onClick={() => setActiveTab('received')}
            >
              Requests Received
            </button>
          </li>
        </ul>
      </aside>

      <main className="p-8 bg-gray-100 w-3/4 ml-1/4 h-screen fixed right-0 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-white p-4 shadow-md rounded-lg animate-pulse">
                <div className="flex justify-between">
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="text-right">
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
              <div className="mb-8">
                {pharmacy?.requestsInitiated?.length > 0 ? (
                  pharmacy.requestsInitiated.map((request) => (
                    <RequestCard
                      key={request._id}
                      request={request}
                      isReceived={false}
                    />
                  ))
                ) : (
                  <p className="text-gray-600">No requests initiated yet.</p>
                )}
              </div>
            )}

            {activeTab === 'received' && (
              <div>
                {pharmacy?.requestsReceived?.length > 0 ? (
                  pharmacy.requestsReceived.map((request) => (
                    <RequestCard
                      key={request._id}
                      request={request}
                      onStatusUpdate={updateRequestStatus}
                      isReceived={true}
                    />
                  ))
                ) : (
                  <p className="text-gray-600">No requests received yet.</p>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}