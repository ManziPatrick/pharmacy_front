import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../utils/leafletConfig'; // Ensure this file is configured correctly for leaflet

const SkeletonMap = () => (
  <div className="animate-pulse bg-gray-200 h-full w-full rounded-md"></div>
);

const PharmacyMap = () => {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Rwanda's approximate center coordinates
  const rwandaCenter = [-1.9403, 29.8739]; // [latitude, longitude]
  const zoomLevel = 10; // Adjust zoom level as needed

  useEffect(() => {
    const fetchPharmacies = async () => {
      setLoading(true); // Set loading to true while fetching
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('No token found. Please log in.');
          setLoading(false);
          return;
        }

        const response = await fetch(`https://pharmacies-management.onrender.com/api/users`, { 
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // Include token
          },
        });

        if (response.status === 401) {
          setError('Unauthorized. Please log in again.');
          setLoading(false);
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.message || 'Error fetching pharmacy data.');
          setLoading(false);
          return;
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          setError('Invalid data format received.');
          setLoading(false);
          return;
        }

        setPharmacies(data);
        setError(null); // Clear any previous errors
      } catch (err) {
        console.error('Error fetching pharmacy data:', err);
        setError('Error fetching pharmacy data.');
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    fetchPharmacies();
  }, []);

  return (
    <div style={{ height: '600px', width: '100%' }}>
      {loading ? (
        <SkeletonMap />
      ) : error ? (
        <div className="text-red-500 text-center mt-4">{error}</div>
      ) : (
        <MapContainer center={rwandaCenter} zoom={zoomLevel} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {pharmacies.map((pharmacy) => (
            <Marker key={pharmacy.id} position={[pharmacy.latitude, pharmacy.longitude]}>
              <Popup>
                <strong>{pharmacy.pharmacyName}</strong>
                <br />
                {pharmacy.location}
                <br />
                Phone: {pharmacy.phoneNumber || 'N/A'}
                <br />
                Owner: {pharmacy.ownerName || 'N/A'}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
};

export default PharmacyMap;
