import React, { useEffect, useState } from 'react';
import { getUserFromToken } from '../utils/auth';
const Requests = () => {
  const [pharmacy, setPharmacy] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('initiated');
  const [pharmacyId, setPharmacyId] = useState(''); 

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      const userData = getUserFromToken(token);
      console.log('Decoded User Data:', userData);
      if (userData && userData._id) {
        setPharmacyId(userData._id);  
      }
    }
  
    if (pharmacyId) {
      const fetchPharmacyData = async () => {
        try {
          console.log('Fetching data for pharmacyId:', pharmacyId);
          const response = await fetch(`https://pharmacies-management.onrender.com/api/users/${pharmacyId}`);
          const data = await response.json();
          console.log('Pharmacy data:', data);
          setPharmacy(data);
        } catch (error) {
          setError('Error fetching pharmacy data.');
          console.error('Error fetching pharmacy data:', error);
        }
      };
  
      fetchPharmacyData();
    }
  }, [pharmacyId]); 
  
  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      const response = await fetch(`https://pharmacies-management.onrender.com/api/requests/${pharmacyId}/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update request status');

      const updatedRequest = await response.json();
      console.log('Updated Request:', updatedRequest);

      
      fetchPharmacyData(); 

    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  if (error) {
    return <div className="text-center text-red-600">{error}</div>;
  }

  if (!pharmacy) {
    return <div className="text-center text-gray-700">Loading...</div>;
  }

  return (
    <div className="flex">
      <aside className="w-1/4 bg-gray-200 p-4 h-screen fixed left-0">
        <h2 className="text-lg font-semibold">Navigation</h2>
        <ul className="mt-4">
          <li>
            <button
              className={`w-full text-left p-2 ${activeTab === 'initiated' ? 'bg-green-600 text-white' : 'text-blue-600'}`}
              onClick={() => setActiveTab('initiated')}
            >
              Requests Initiated
            </button>
          </li>
          <li>
            <button
              className={`w-full text-left p-2 ${activeTab === 'received' ? 'bg-green-600  text-white' : 'text-green-600'}`}
              onClick={() => setActiveTab('received')}
            >
              Requests Received
            </button>
          </li>
        </ul>
      </aside>

      <main className="p-8 bg-gray-100 w-3/4 ml-1/4 h-screen fixed right-0 overflow-y-auto">
        {/* <h1 className="text-3xl font-bold text-center mb-6">Requests Overview</h1> */}

        {activeTab === 'initiated' && (
          <div className="mb-8">
            {/* <h2 className="text-2xl font-semibold text-blue-600 mb-4">Requests Initiated</h2> */}
            {pharmacy.requestsInitiated.length > 0 ? (
              pharmacy.requestsInitiated.map((request) => (
                <div key={request._id} className="bg-white p-4 shadow-md rounded-lg mb-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-bold text-gray-800">Medicine: {request.medicine_id.name}</p>
                      <p className="text-gray-600">Quantity: {request.medicine_id.quantity}</p>
                      <p className="text-gray-600">Price: ${request.medicine_id.price}</p>
                      <p className="text-gray-600">Status: {request.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">Commission: ${request.commission}</p>
                      <p className="text-gray-500">Created At: {new Date(request.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600">No requests initiated yet.</p>
            )}
          </div>
        )}

        {activeTab === 'received' && (
          <div>
            <h2 className="text-2xl font-semibold text-green-600 mb-4">Requests Received</h2>
            {pharmacy.requestsReceived.length > 0 ? (
              pharmacy.requestsReceived.map((request) => (
                <div key={request._id} className="bg-white p-4 shadow-md rounded-lg mb-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-bold text-gray-800">Medicine: {request.medicine_id.name}</p>
                      <p className="text-gray-600">Quantity: {request.medicine_id.quantity}</p>
                      <p className="text-gray-600">Price: ${request.medicine_id.price}</p>
                      <p className="text-gray-600">Status: {request.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">Commission: ${request.commission}</p>
                      <p className="text-gray-500">Created At: {new Date(request.createdAt).toLocaleString()}</p>
                      <div className="mt-2">
                        <button
                          className="text-green-500"
                          onClick={() => updateRequestStatus(request._id, 'Fulfilled')}
                        >
                          Fulfill
                        </button>
                        <button
                          className="text-red-500 ml-2"
                          onClick={() => updateRequestStatus(request._id, 'Rejected')}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600">No requests received yet.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Requests;
