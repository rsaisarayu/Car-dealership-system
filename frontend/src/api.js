const API_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  async register(username, password, role) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    return data;
  },

  async login(username, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
  },

  async getVehicles() {
    const res = await fetch(`${API_URL}/vehicles`, {
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch vehicles');
    return data;
  },

  async searchVehicles(params) {
    const query = new URLSearchParams();
    if (params.make) query.append('make', params.make);
    if (params.model) query.append('model', params.model);
    if (params.category) query.append('category', params.category);
    if (params.minPrice) query.append('minPrice', params.minPrice);
    if (params.maxPrice) query.append('maxPrice', params.maxPrice);

    const res = await fetch(`${API_URL}/vehicles/search?${query.toString()}`, {
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Search failed');
    return data;
  },

  async addVehicle(vehicle) {
    const res = await fetch(`${API_URL}/vehicles`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(vehicle)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to add vehicle');
    return data;
  },

  async updateVehicle(id, vehicle) {
    const res = await fetch(`${API_URL}/vehicles/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(vehicle)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update vehicle');
    return data;
  },

  async deleteVehicle(id) {
    const res = await fetch(`${API_URL}/vehicles/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete vehicle');
    return data;
  },

  async purchaseVehicle(id) {
    const res = await fetch(`${API_URL}/vehicles/${id}/purchase`, {
      method: 'POST',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Purchase failed');
    return data;
  },

  async restockVehicle(id, quantity) {
    const res = await fetch(`${API_URL}/vehicles/${id}/restock`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ quantity })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Restock failed');
    return data;
  }
};
