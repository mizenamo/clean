import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarIcon, ClockIcon, TrashIcon } from '@heroicons/react/24/outline';

const Schedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/waste/schedules');
      setSchedules(response.data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      // Fallback to mock data if server is not available
      setSchedules([
        { day: 'Monday', time: '7:00 AM - 12:45 PM', type: 'Organic Waste' },
        { day: 'Wednesday', time: '7:00 AM - 12:45 PM', type: 'Recyclables' },
        { day: 'Friday', time: '7:00 AM - 12:00 PM', type: 'Hazardous Waste' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getWasteTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case 'organic waste':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'recyclables':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'hazardous waste':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWasteTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'organic waste':
        return '🌱';
      case 'recyclables':
        return '♻️';
      case 'hazardous waste':
        return '⚠️';
      default:
        return '🗑️';
    }
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
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
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
          <CalendarIcon className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Collection Schedule</h1>
            <p className="text-gray-600">Your weekly waste collection timetable</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((schedule, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getWasteTypeIcon(schedule.type)}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{schedule.day}</h3>
                    <div className="flex items-center space-x-1 text-gray-600">
                      <ClockIcon className="h-4 w-4" />
                      <span className="text-sm">{schedule.time}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getWasteTypeColor(schedule.type)}`}>
                  <TrashIcon className="h-4 w-4 mr-1" />
                  {schedule.type}
                </span>
              </div>

              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Preparation Tips:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  {schedule.type.toLowerCase() === 'organic waste' && (
                    <>
                      <li>Use biodegradable bags</li>
                      <li>Keep food waste separate</li>
                      <li>No plastic containers</li>
                    </>
                  )}
                  {schedule.type.toLowerCase() === 'recyclables' && (
                    <>
                      <li>Clean containers before disposal</li>
                      <li>Separate paper, plastic, and metal</li>
                      <li>Remove caps from bottles</li>
                    </>
                  )}
                  {schedule.type.toLowerCase() === 'hazardous waste' && (
                    <>
                      <li>Use original containers</li>
                      <li>Label clearly</li>
                      <li>Keep away from children</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Important Reminders</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Collection Guidelines</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Place bins outside by 6:00 AM on collection day</li>
              <li>• Ensure bins are accessible to collection vehicles</li>
              <li>• Don't overfill containers</li>
            </ul>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">Missed Collection?</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Report missed collections immediately</li>
              <li>• Keep waste secure until next collection</li>
              <li>• Check for holiday schedule changes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;