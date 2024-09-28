// Ensure correct export
export const getUserFromToken = () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.log('No token found');
    return null;
  }

  try {
    const decodedToken = JSON.parse(atob(token.split('.')[1]));
    return decodedToken.id;
  } catch (error) {
    console.error('Token decoding error:', error);
    return null;
  }
};
