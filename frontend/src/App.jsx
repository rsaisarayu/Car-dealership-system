import React, { useState, useEffect } from 'react';
import { api } from './api';
import { 
  Car, 
  ShieldCheck, 
  User, 
  LogOut, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  ShoppingCart, 
  PackagePlus, 
  RefreshCw,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authForm, setAuthForm] = useState({ username: '', password: '', role: 'user' });

  const [searchFilters, setSearchFilters] = useState({
    make: '',
    model: '',
    category: '',
    minPrice: '',
    maxPrice: ''
  });

  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({
    make: '',
    model: '',
    category: 'Sedan',
    price: '',
    quantity: ''
  });

  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockTarget, setRestockTarget] = useState(null);
  const [restockAmount, setRestockAmount] = useState('5');

  const showNotification = (text, isError = false) => {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 4000);
  };

  const loadVehicles = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await api.getVehicles();
      setVehicles(data);
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadVehicles();
    }
  }, [currentUser]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegisterMode) {
        await api.register(authForm.username, authForm.password, authForm.role);
        showNotification('Registration successful! Logging you in...');
      }
      const loginData = await api.login(authForm.username, authForm.password);
      localStorage.setItem('token', loginData.token);
      localStorage.setItem('user', JSON.stringify(loginData.user));
      setCurrentUser(loginData.user);
      setAuthForm({ username: '', password: '', role: 'user' });
      showNotification(`Welcome back, ${loginData.user.username}!`);
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setVehicles([]);
    showNotification('Logged out successfully.');
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.searchVehicles(searchFilters);
      setVehicles(data);
      showNotification(`Found ${data.length} vehicle(s).`);
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSearch = () => {
    setSearchFilters({ make: '', model: '', category: '', minPrice: '', maxPrice: '' });
    loadVehicles();
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        make: vehicleForm.make,
        model: vehicleForm.model,
        category: vehicleForm.category,
        price: Number(vehicleForm.price),
        quantity: Number(vehicleForm.quantity)
      };

      if (editingVehicle) {
        await api.updateVehicle(editingVehicle.id, payload);
        showNotification('Vehicle updated successfully!');
      } else {
        await api.addVehicle(payload);
        showNotification('Vehicle added to inventory!');
      }
      setIsVehicleModalOpen(false);
      setEditingVehicle(null);
      setVehicleForm({ make: '', model: '', category: 'Sedan', price: '', quantity: '' });
      loadVehicles();
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await api.deleteVehicle(id);
      showNotification('Vehicle deleted successfully.');
      loadVehicles();
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handlePurchase = async (id) => {
    try {
      await api.purchaseVehicle(id);
      showNotification('Vehicle purchased successfully! Stock updated.');
      loadVehicles();
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.restockVehicle(restockTarget.id, Number(restockAmount));
      showNotification(`Restocked ${restockTarget.make} ${restockTarget.model} by ${restockAmount} units!`);
      setIsRestockModalOpen(false);
      setRestockTarget(null);
      setRestockAmount('5');
      loadVehicles();
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const seedSampleVehicles = async () => {
    const samples = [
      { make: 'Tesla', model: 'Model 3', category: 'Electric', price: 38990, quantity: 4 },
      { make: 'Toyota', model: 'RAV4 Hybrid', category: 'SUV', price: 31725, quantity: 6 },
      { make: 'Ford', model: 'Mustang GT', category: 'Coupe', price: 42495, quantity: 2 },
      { make: 'Honda', model: 'Civic', category: 'Sedan', price: 23950, quantity: 8 },
      { make: 'Porsche', model: '911 Carrera', category: 'Luxury', price: 114400, quantity: 1 },
      { make: 'Chevrolet', model: 'Silverado 1500', category: 'Truck', price: 36800, quantity: 0 }
    ];

    try {
      for (const item of samples) {
        await api.addVehicle(item);
      }
      showNotification('Added sample vehicles to inventory!');
      loadVehicles();
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const openAddModal = () => {
    setEditingVehicle(null);
    setVehicleForm({ make: '', model: '', category: 'Sedan', price: '', quantity: '' });
    setIsVehicleModalOpen(true);
  };

  const openEditModal = (v) => {
    setEditingVehicle(v);
    setVehicleForm({
      make: v.make,
      model: v.model,
      category: v.category,
      price: v.price,
      quantity: v.quantity
    });
    setIsVehicleModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Toast Banner */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-xl text-white font-medium transition-all ${
          message.isError ? 'bg-red-600' : 'bg-emerald-600'
        }`}>
          {message.text}
        </div>
      )}

      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 text-white rounded-lg shadow">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Apex Motors</h1>
              <p className="text-xs text-slate-500 font-medium">Dealership Inventory System</p>
            </div>
          </div>

          {currentUser ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-full text-sm">
                <User className="w-4 h-4 text-slate-600" />
                <span className="font-semibold text-slate-700">{currentUser.username}</span>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full uppercase ${
                  currentUser.role === 'admin' 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                    : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-slate-600 hover:text-red-600 text-sm font-medium transition px-2 py-1 rounded"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <span className="text-sm font-medium text-slate-500">Guest Access</span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentUser ? (
          /* Authentication Screen */
          <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl mb-3">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                {isRegisterMode ? 'Create an Account' : 'Welcome Back'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {isRegisterMode ? 'Register to manage or purchase vehicles' : 'Log in to access vehicle inventory'}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. alex_driver"
                  value={authForm.username}
                  onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                />
              </div>

              {isRegisterMode && (
                <div className="bg-indigo-50 p-3.5 rounded-lg border border-indigo-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-indigo-900">Admin Privileges</p>
                    <p className="text-xs text-indigo-700">Allows adding, updating, restocking & deleting vehicles</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={authForm.role === 'admin'}
                    onChange={(e) => setAuthForm({ ...authForm, role: e.target.checked ? 'admin' : 'user' })}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition duration-150"
              >
                {isRegisterMode ? 'Register Account' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600 border-t border-slate-100 pt-4">
              {isRegisterMode ? 'Already have an account?' : "Don't have an account yet?"}{' '}
              <button
                type="button"
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="font-bold text-indigo-600 hover:underline ml-1"
              >
                {isRegisterMode ? 'Sign In here' : 'Register now'}
              </button>
            </div>
          </div>
        ) : (
          /* Dashboard Screen */
          <div className="space-y-6">
            {/* Dashboard Header / Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Vehicle Inventory</h2>
                <p className="text-sm text-slate-500">
                  Showing {vehicles.length} vehicle model(s) available in the system
                </p>
              </div>

              <div className="flex items-center flex-wrap gap-2.5">
                <button
                  onClick={loadVehicles}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
                  title="Reload inventory"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>

                {currentUser.role === 'admin' && (
                  <>
                    <button
                      onClick={seedSampleVehicles}
                      className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-sm font-medium transition"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Seed Sample Data</span>
                    </button>
                    <button
                      onClick={openAddModal}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Vehicle</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Make</label>
                  <input
                    type="text"
                    placeholder="e.g. Toyota"
                    value={searchFilters.make}
                    onChange={(e) => setSearchFilters({ ...searchFilters, make: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Model</label>
                  <input
                    type="text"
                    placeholder="e.g. Camry"
                    value={searchFilters.model}
                    onChange={(e) => setSearchFilters({ ...searchFilters, model: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                  <select
                    value={searchFilters.category}
                    onChange={(e) => setSearchFilters({ ...searchFilters, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">All Categories</option>
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Truck">Truck</option>
                    <option value="Coupe">Coupe</option>
                    <option value="Electric">Electric</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Min Price ($)</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={searchFilters.minPrice}
                    onChange={(e) => setSearchFilters({ ...searchFilters, minPrice: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Max Price ($)</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={searchFilters.maxPrice}
                    onChange={(e) => setSearchFilters({ ...searchFilters, maxPrice: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-end space-x-2">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center space-x-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow transition"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSearch}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-lg transition"
                    title="Reset filters"
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>

            {/* Vehicle Grid */}
            {loading ? (
              <div className="text-center py-16">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                <p className="text-slate-500 font-medium">Loading inventory...</p>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Car className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800">No Vehicles Found</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  There are no vehicles matching your search criteria or the inventory is currently empty.
                </p>
                {currentUser.role === 'admin' ? (
                  <button
                    onClick={seedSampleVehicles}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Populate Sample Inventory</span>
                  </button>
                ) : (
                  <button
                    onClick={handleResetSearch}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map((v) => {
                  const isOutOfStock = v.quantity === 0;

                  return (
                    <div
                      key={v.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md uppercase tracking-wider">
                            {v.category}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {isOutOfStock ? 'Out of Stock' : `${v.quantity} in stock`}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 mt-1">
                          {v.make} <span className="font-normal text-slate-700">{v.model}</span>
                        </h3>

                        <div className="mt-4 flex items-baseline">
                          <span className="text-2xl font-extrabold text-indigo-600">
                            ${v.price.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-500 ml-1 font-medium">MSRP</span>
                        </div>
                      </div>

                      <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-3">
                        <button
                          onClick={() => handlePurchase(v.id)}
                          disabled={isOutOfStock}
                          className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 font-semibold text-sm shadow transition duration-150 ${
                            isOutOfStock
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                          }`}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>{isOutOfStock ? 'Out of Stock' : 'Purchase Vehicle'}</span>
                        </button>

                        {currentUser.role === 'admin' && (
                          <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                            <button
                              onClick={() => {
                                setRestockTarget(v);
                                setIsRestockModalOpen(true);
                              }}
                              className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                              <PackagePlus className="w-3.5 h-3.5" />
                              <span>Restock</span>
                            </button>
                            <button
                              onClick={() => openEditModal(v)}
                              className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 font-medium"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteVehicle(v.id)}
                              className="flex items-center space-x-1 text-red-600 hover:text-red-800 font-medium"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add / Edit Vehicle Modal */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h3>

            <form onSubmit={handleSaveVehicle} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Make</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BMW"
                    value={vehicleForm.make}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Model</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. M3"
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                <select
                  value={vehicleForm.category}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Truck">Truck</option>
                  <option value="Coupe">Coupe</option>
                  <option value="Electric">Electric</option>
                  <option value="Luxury">Luxury</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="25000"
                    value={vehicleForm.price}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, price: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Initial Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="5"
                    value={vehicleForm.quantity}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow"
                >
                  {editingVehicle ? 'Update Vehicle' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Vehicle Modal */}
      {isRestockModalOpen && restockTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Restock Vehicle</h3>
            <p className="text-sm text-slate-500 mb-4">
              Add inventory units for <span className="font-semibold text-slate-700">{restockTarget.make} {restockTarget.model}</span>. Current stock: {restockTarget.quantity}.
            </p>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Units to Add</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRestockModalOpen(false);
                    setRestockTarget(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow"
                >
                  Add Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
