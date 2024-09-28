// src/utils/avatar.jsx
import React from 'react';

/**
 * Generates initials from a given name.
 * @param {string} name - The full name of the user.
 * @returns {string} - The initials.
 */
export const generateAvatar = (name) => {
  if (!name) return 'U'; // U for Unknown
  const names = name.split(' ');
  const initials = names.map((n) => n[0]).join('');
  return initials.slice(0, 2).toUpperCase();
};
