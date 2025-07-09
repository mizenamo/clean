import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TruckIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';

const Tracking = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    fetchVehicleTracking();
    const interval = setInterval(fetchVehicleTracking, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchVehicleTracking = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/waste/tracking');
      setVehicles(response.data);
    } catch (error) {
      console.error('Error fetching vehicle tracking:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'on route':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'collecting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'on route':
        return '🚛';
      case 'collecting':
        return '🗑️';
      case 'completed':
        return '✅';
      case 'maintenance':
        return '🔧';
      default:
        return '📍';
    }
  };

  const mockVehicleDetails = {
    driver: 'John Smith',
    route: 'Ward 12 - Residential',
    startTime: '7:00 AM',
    estimatedCompletion: '12:45 PM',
    collectionsCompleted: 24,
    totalCollections: 30,
    lastUpdate: '2 minutes ago'
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
        <div className="flex items-center space-x-3 mb-6">
          <TruckIcon className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vehicle Tracking</h1>
            <p className="text-gray-600">Real-time location and status of collection vehicles</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicle List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Active Vehicles</h2>
            {vehicles.map((vehicle, index) => (
              <div
                key={index}
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
                        <span className="text-sm">Lat: {vehicle.lat}, Lng: {vehicle.lng}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(vehicle.status)}`}>
                    {vehicle.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Driver:</span> {mockVehicleDetails.driver}
                  </div>
                  <div>
                    <span className="font-medium">Route:</span> {mockVehicleDetails.route}
                  </div>
                </div>
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
                      <p className="text-sm text-gray-900">{vehicles[selectedVehicle]?.status}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Driver</label>
                      <p className="text-sm text-gray-900">{mockVehicleDetails.driver}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Route</label>
                    <p className="text-sm text-gray-900">{mockVehicleDetails.route}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Start Time</label>
                      <p className="text-sm text-gray-900">{mockVehicleDetails.startTime}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Est. Completion</label>
                      <p className="text-sm text-gray-900">{mockVehicleDetails.estimatedCompletion}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Progress</label>
                    <div className="mt-1">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>Collections: {mockVehicleDetails.collectionsCompleted}/{mockVehicleDetails.totalCollections}</span>
                        <span>{Math.round((mockVehicleDetails.collectionsCompleted / mockVehicleDetails.totalCollections) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(mockVehicleDetails.collectionsCompleted / mockVehicleDetails.totalCollections) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4" />
                      <span>Last updated: {mockVehicleDetails.lastUpdate}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a vehicle to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Collection Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Estimated Arrival</h3>
            <p className="text-2xl font-bold text-blue-600">10:30 AM</p>
            <p className="text-sm text-blue-700">Based on current route progress</p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">Collections Today</h3>
            <p className="text-2xl font-bold text-green-600">24/30</p>
            <p className="text-sm text-green-700">80% completion rate</p>
          </div>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">Next Collection</h3>
            <p className="text-2xl font-bold text-yellow-600">Wed</p>
            <p className="text-sm text-yellow-700">Recyclables pickup</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tracking;