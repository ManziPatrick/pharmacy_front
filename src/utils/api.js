const API_BASE_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:5000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  // POST request
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }

  // Pharmacy-specific methods
  async getAllPharmacies() {
    return this.get('/api/users');
  }

  async getNearbyPharmacies(lat, lng, maxDistance = 100) {
    return this.get(`/api/users/nearby?lat=${lat}&lng=${lng}&maxDistance=${maxDistance}`);
  }

  // Chat-specific methods
  async sendMessage(pharmacyId, message, image = null) {
    return this.post('/api/chat/send', {
      pharmacyId,
      message,
      image,
    });
  }

  async getChatHistory(pharmacyId) {
    return this.get(`/api/chat/history/${pharmacyId}`);
  }

  async getPharmacyChats(pharmacyId) {
    return this.get(`/api/chat/pharmacy/${pharmacyId}`);
  }

  // Medicine-specific methods
  async getAllMedicines() {
    return this.get('/api/medicines');
  }

  async getMedicineById(id) {
    return this.get(`/api/medicines/${id}`);
  }

  async searchMedicines(query) {
    return this.get(`/api/medicines/search?q=${encodeURIComponent(query)}`);
  }

  // Request-specific methods
  async createRequest(data) {
    return this.post('/api/requests', data);
  }

  async getRequests() {
    return this.get('/api/requests');
  }

  async updateRequestStatus(requestId, status) {
    // Import getUserFromToken function
    const { getUserFromToken } = await import('./auth.js');
    
    // Validate inputs
    if (!requestId) {
      throw new Error('Request ID is required');
    }
    if (!status) {
      throw new Error('Status is required');
    }
    
    // Get current user ID for the request
    const userData = getUserFromToken();
    
    if (!userData) {
      throw new Error('User not authenticated - no user data found. Please log in again.');
    }
    
    // Check different possible field names for user ID (now both _id and id should be available)
    const pharmacyId = userData._id || userData.id;
    
    if (!pharmacyId) {
      // Clear invalid token and ask user to log in again
      localStorage.removeItem('authToken');
      throw new Error('Invalid authentication token. Please log in again.');
    }
    
    // Validate that pharmacyId is a valid ObjectId format (24 hex characters)
    if (!/^[0-9a-fA-F]{24}$/.test(pharmacyId)) {
      throw new Error(`Invalid pharmacy ID format: ${pharmacyId}`);
    }
    
    // Validate that requestId is a valid ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(requestId)) {
      throw new Error(`Invalid request ID format: ${requestId}`);
    }
    
    return this.put(`/api/requests/${pharmacyId}/${requestId}/status`, { status });
  }
}

export default new ApiService();