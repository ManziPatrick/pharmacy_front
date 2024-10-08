
import { useState, useEffect } from 'react';
import { getUserFromToken } from '../utils/auth';

let globalUser = null; 

const setGlobalUser = (user) => {
  globalUser = user;
};

export const useGlobalUser = () => {
  const [user, setUser] = useState(globalUser); // Initialize with globalUser

  useEffect(() => {
    if (!globalUser) {
      const token = localStorage.getItem('authToken');
      if (token) {
        const userData = getUserFromToken(token); // Decode token
        setGlobalUser(userData); // Set the global user state
        setUser(userData); // Sync local state with global user
      }
    } else {
      setUser(globalUser); // If globalUser exists, set it to local state
    }
  }, []);

  return user; 
};
