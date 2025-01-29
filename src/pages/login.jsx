import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import image from '../assets/pexels-fr3nks-287227.jpg'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const navigate = useNavigate();
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setFormErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      try {
        const response = await fetch(`https://pharmacies-management.onrender.com/api/users/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        const data = await response.json();
        
        if (response.ok) {
    
          const { token } = data;
  
          // Save the token in local storage
          localStorage.setItem('authToken', token);
  
          // Set login message and navigate to home
          setLoginMessage('Login successful!');
          console.log('Login successful:', data);
          navigate("/");
        } else {
          setLoginMessage(data.message || 'Login failed. Please try again.');
        }
      } catch (error) {
        setLoginMessage('An error occurred. Please try again later.');
        console.error('Login error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  

  // const handleForgotPassword = async () => {
  //   if (!formData.email) {
  //     setFormErrors({ email: "Please enter your email address" });
  //     return;
  //   }
  //   setIsLoading(true);
  //   try {
  //     const response = await fetch(`https://pharmacies-management.onrender.com/api/users/forgot-password', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ email: formData.email }),
  //     });
  //     const data = await response.json();
  //     if (response.ok) {
  //       setLoginMessage('Password reset instructions sent to your email.');
  //     } else {
  //       setLoginMessage(data.message || 'Failed to send reset instructions. Please try again.');
  //     }
  //   } catch (error) {
  //     setLoginMessage('An error occurred. Please try again later.');
  //     console.error('Forgot password error:', error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/2 bg-green-600 flex items-center justify-center">
        <img 
          src={image} 
          alt="Pharmacy illustration" 
          className="max-w-full  h-screen object-cover"
        />
      </div>
      <div className="w-1/2 flex items-center justify-center">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-xl">
          <h2 className="text-3xl font-bold mb-6 text-center text-green-600">Pharmacy Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
              </div>
              <div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
              </div>
            </div>
            {loginMessage && <p className="text-green-600 text-sm mt-4">{loginMessage}</p>}
            <button 
              type="submit" 
              className="w-full mt-6 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 transition duration-300"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
          <button className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-300">
          <Link
          to="/register"
            
           
            >
             
                  signup
              
          
            </Link>
            </button>
        </div>
      </div>
    </div>
  );
};

export default Login;