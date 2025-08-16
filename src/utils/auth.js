// Ensure correct export
export const getUserFromToken = (token = null) => {
  const authToken = token || localStorage.getItem('authToken');
  if (!authToken) {
    console.log('No token found');
    return null;
  }

  try {
    const decodedToken = JSON.parse(atob(authToken.split('.')[1]));
    
    // Validate that we have essential user data
    if (!decodedToken._id && !decodedToken.id) {
      console.warn('Token does not contain user ID. Token may be outdated.');
      // Clear invalid token
      if (!token) { // Only clear if we're using localStorage token
        localStorage.removeItem('authToken');
      }
      return null;
    }
    
    return decodedToken; // Return the full decoded token object
  } catch (error) {
    console.error('Token decoding error:', error);
    // Clear invalid token
    if (!token) { // Only clear if we're using localStorage token
      localStorage.removeItem('authToken');
    }
    return null;
  }
};
