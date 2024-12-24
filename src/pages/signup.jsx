import React, { useState } from "react";
import image2 from '../assets/pexels-karolina-grabowska-4021773.jpg';
import { Link } from "react-router-dom";

const SignUp = () => {
  const [formData, setFormData] = useState({
    pharmacyName: '',
    location: '',
    phoneNumber: '',
    ownerName: '',
    licenseNumber: '',
    email: '',
    password: '',
    latitude: '',
    longitude: '',
  });
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [signupMessage, setSignupMessage] = useState('');
  const [isLicenseValid, setIsLicenseValid] = useState(true);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setFormErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
  };

  const handleLocationToggle = () => {
    setUseCurrentLocation((prev) => !prev);
    if (!useCurrentLocation) {
      getCurrentLocation();
    } else {
      setFormData((prevData) => ({
        ...prevData,
        latitude: '',
        longitude: '',
      }));
    }
  };

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prevData) => ({
            ...prevData,
            latitude: position.coords.latitude.toFixed(4),
            longitude: position.coords.longitude.toFixed(4),
          }));
          setLocationError('');
        },
        (error) => {
          setLocationError("Error accessing location. Please enter coordinates manually.");
          setUseCurrentLocation(false);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser. Please enter coordinates manually.");
      setUseCurrentLocation(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

    if (!emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!passwordRegex.test(formData.password)) {
      errors.password = "Password must be at least 8 characters long and contain both letters and numbers";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateLicense = async () => {
    const validationUrl = `https://licensing.moh.gov.rw:8443/client/download/application/${formData.licenseNumber}/details`;
  
    try {
      const response = await fetch(validationUrl, {
        method: 'GET',
      });
  
      // Check if the response status is OK (200-299)
      if (!response.ok) {
        if (response.status === 404) {
          setSignupMessage('License not found (404). Please check the license number.');
        } else {
          setSignupMessage(`An error occurred: ${response.status}`);
        }
        setIsLicenseValid(false);
        return false;
      }
  
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('application')) {
        // If the license data is returned in a downloadable format (PDF, etc.)
        const data = await response.text(); // Or response.blob() depending on the type

  
        if (data) {

          setIsLicenseValid(true); 
          return true;
        } else {
          setSignupMessage('Invalid license number. Please check the license number and try again.');
          setIsLicenseValid(false);
          return false;
        }
      } else {
        setSignupMessage('Unexpected response format from the license validation server.');
        setIsLicenseValid(false);
        return false;
      }
  
    } catch (error) {
      setSignupMessage('An error occurred while validating the license. Please try again later.');
      console.error('License validation error:', error);
      return false;
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setIsLoading(true);

      
      const isLicenseValid = await validateLicense();
      if (!isLicenseValid) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/users/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();
        if (response.ok) {
          setSignupMessage('Registration successful! Please log in.');
          console.log('Registration successful:', data);
        } else {
          setSignupMessage(data.message || 'Registration failed. Please try again.');
        }
      } catch (error) {
        setSignupMessage('An error occurred. Please try again later.');
        console.error('Registration error:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log('Form has errors');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/2 bg-green-600 flex items-center justify-center">
        <img 
          src={image2} 
          alt="Pharmacy illustration" 
          className="max-w-full w-full max-h-full object-cover"
        />
      </div>
      <div className="w-1/2 flex items-center justify-center overflow-y-auto">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-xl">
          <h2 className="text-3xl font-bold mb-6 text-center text-green-600">Pharmacy Sign Up</h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <input
                type="text"
                name="pharmacyName"
                value={formData.pharmacyName}
                onChange={handleInputChange}
                placeholder="Pharmacy Name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Location"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Phone Number"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleInputChange}
                placeholder="Owner Name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleInputChange}
                placeholder="License Number"
                required
                className={`w-full px-3 py-2 border ${isLicenseValid ? 'border-gray-300' : 'border-red-500'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
              />
              {!isLicenseValid && <p className="text-red-500 text-sm">Invalid License Number</p>}
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="Latitude"
                  disabled={useCurrentLocation}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="text"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="Longitude"
                  disabled={useCurrentLocation}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={handleLocationToggle}
                  className={`p-2 rounded-md ${useCurrentLocation ? 'bg-green-500 text-white' : 'bg-gray-300'}`}
                >
                  📍
                </button>
              </div>
              {locationError && (
                <p className="text-red-500 text-sm mt-1">{locationError}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-2 px-4 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>
            {signupMessage && (
              <p className={`mt-4 text-sm ${signupMessage.includes('successfully') ? 'text-green-500' : 'text-red-500'}`}>
                {signupMessage}
              </p>
            )}
          </form>
          <button className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-300">
            <Link to="/login">
              Login
            </Link>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
