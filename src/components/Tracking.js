import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TruckIcon, MapPinIcon, ClockIcon, SignalIcon } from '@heroicons/react/24/outline';
import io from 'socket.io-client';

const Tracking = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnectionStatus('connected');
      console.log('Connected to real-time tracking');
    });

    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    // Listen for real-time location updates
    newSocket.on('vehicleLocationUpdate', (data) => {
      setVehicles(prevVehicles => 
        prevVehicles.map(vehicle => 
          vehicle.vehicleId === data.vehicleId 
            ? { 
                ...vehicle, 
                lat: data.latitude, 
                lng: data.longitude,
                lastUpdate: data.timestamp,
                speed: data.speed 
              }
            : vehicle
        )
      );
    });

    // Listen for status updates
    newSocket.on('statusUpdate', (data) => {
      setVehicles(prevVehicles => 
        prevVehicles.map(vehicle => 
          vehicle.vehicleId === data.vehicleId 
            ? { 
                ...vehicle, 
                status: data.status,
                route: { ...vehicle.route, completedStops: data.completedStops }
              }
            : vehicle
        )
      );
    });

    fetchVehicleTracking();
    const interval = setInterval(fetchVehicleTracking, 30000); // Update every 30 seconds

    return () => {
      clearInterval(interval);
      newSocket.close();
    };
  }, []);

  const fetchVehicleTracking = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/waste/tracking');
      setVehicles(response.data);
    } catch (error) {
      console.error('Error fetching vehicle tracking:', error);
      // Fallback to mock data if server is not available
      setVehicles([
        { 
          vehicleId: 'KA01AB1234', 
          driverName: 'John Smith',
          lat: 12.9716, 
          lng: 77.5946, 
          status: 'on_route',
          wasteType: 'organic',
          route: { ward: 'Ward 12', area: 'Residential', completedStops: 24, totalStops: 30 },
          capacity: { current: 65, maximum: 100 },
          lastUpdate: new Date()
        },
        { 
          vehicleId: 'KA01CD5678', 
          driverName: 'Mike Johnson',
          lat: 12.9716, 
          lng: 77.5946, 
          status: 'collecting',
          wasteType: 'recyclable',
          route: { ward: 'Ward 8', area: 'Commercial', completedStops: 12, totalStops: 20 },
          capacity: { current: 40, maximum: 100 },
          lastUpdate: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'on_route':
      case 'on route':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'collecting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'idle':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'on_route':
      case 'on route':
        return '🚛';
      case 'collecting':
        return '🗑️';
      case 'completed':
        return '✅';
      case 'maintenance':
        return '🔧';
      case 'idle':
        return '⏸️';
      default:
        return '📍';
    }
  };

  const getWasteTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'organic':
        return '🌱';
      case 'recyclable':
        return '♻️';
      case 'hazardous':
        return '⚠️';
      default:
        return '🗑️';
    }
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const update = new Date(timestamp);
    const diffMs = now - update;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return update.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <TruckIcon className="h-8 w-8 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Real-Time Vehicle Tracking</h1>
              <p className="text-gray-600">Live GPS tracking and status monitoring</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <SignalIcon className={`h-5 w-5 ${connectionStatus === 'connected' ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-sm font-medium ${connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
              {connectionStatus === 'connected' ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicle List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Active Vehicles ({vehicles.length})</h2>
            {vehicles.map((vehicle, index) => (
              <div
                key={vehicle.vehicleId}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  selectedVehicle === index ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedVehicle(index)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getStatusIcon(vehicle.status)}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{vehicle.vehicleId}</h3>
                      <div className="flex items-center space-x-1 text-gray-600">
                        <MapPinIcon className="h-4 w-4" />
                        <span className="text-sm">{vehicle.lat?.toFixed(4)}, {vehicle.lng?.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(vehicle.status)}`}>
                      {vehicle.status?.replace('_', ' ')}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{formatLastUpdate(vehicle.lastUpdate)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Driver:</span> {vehicle.driverName || 'Unknown'}
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">Type:</span> 
                    <span>{getWasteTypeIcon(vehicle.wasteType)} {vehicle.wasteType}</span>
                  </div>
                </div>

                {vehicle.route && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{vehicle.route.ward} - {vehicle.route.area}</span>
                      <span className="font-medium text-primary-600">
                        {vehicle.route.completedStops}/{vehicle.route.totalStops} stops
                      </span>
                    </div>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(vehicle.route.completedStops / vehicle.route.totalStops) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Vehicle Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Vehicle Details</h2>
            {selectedVehicle !== null ? (
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <TruckIcon className="h-6 w-6 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {vehicles[selectedVehicle]?.vehicleId}
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <p className="text-sm text-gray-900 capitalize">{vehicles[selectedVehicle]?.status?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Driver</label>
                      <p className="text-sm text-gray-900">{vehicles[selectedVehicle]?.driverName || 'Unknown'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Current Location</label>
                    <p className="text-sm text-gray-900">
                      Lat: {vehicles[selectedVehicle]?.lat?.toFixed(6)}, 
                      Lng: {vehicles[selectedVehicle]?.lng?.toFixed(6)}
                    </p>
                  </div>

                  {vehicles[selectedVehicle]?.route && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Route</label>
                      <p className="text-sm text-gray-900">
                        {vehicles[selectedVehicle].route.ward} - {vehicles[selectedVehicle].route.area}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Waste Type</label>
                      <p className="text-sm text-gray-900 flex items-center space-x-1">
                        <span>{getWasteTypeIcon(vehicles[selectedVehicle]?.wasteType)}</span>
                        <span className="capitalize">{vehicles[selectedVehicle]?.wasteType}</span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Speed</label>
                      <p className="text-sm text-gray-900">{vehicles[selectedVehicle]?.speed || 0} km/h</p>
                    </div>
                  </div>

                  {vehicles[selectedVehicle]?.capacity && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Capacity</label>
                      <div className="mt-1">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>{vehicles[selectedVehicle].capacity.current}% full</span>
                          <span>{vehicles[selectedVehicle].capacity.current}/{vehicles[selectedVehicle].capacity.maximum}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              vehicles[selectedVehicle].capacity.current > 80 ? 'bg-red-500' :
                              vehicles[selectedVehicle].capacity.current > 60 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${vehicles[selectedVehicle].capacity.current}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4" />
                      <span>Last updated: {formatLastUpdate(vehicles[selectedVehicle]?.lastUpdate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a vehicle to view detailed information</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Active Vehicles</h3>
            <p className="text-2xl font-bold text-blue-600">{vehicles.filter(v => v.status !== 'maintenance').length}</p>
            <p className="text-sm text-blue-700">Currently operational</p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">On Route</h3>
            <p className="text-2xl font-bold text-green-600">
              {vehicles.filter(v => v.status === 'on_route' || v.status === 'on route').length}
            </p>
            <p className="text-sm text-green-700">Vehicles en route</p>
          </div>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">Collecting</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {vehicles.filter(v => v.status === 'collecting').length}
            </p>
            <p className="text-sm text-yellow-700">Active collections</p>
          </div>
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="font-medium text-purple-900 mb-2">Avg Efficiency</h3>
            <p className="text-2xl font-bold text-purple-600">
              {vehicles.length > 0 ? Math.round(
                vehicles.reduce((acc, v) => acc + (v.route ? (v.route.completedStops / v.route.totalStops) * 100 : 0), 0) / vehicles.length
              ) : 0}%
            </p>
            <p className="text-sm text-purple-700">Collection completion</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tracking;