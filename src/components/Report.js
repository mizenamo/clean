import React, { useState } from 'react';
import axios from 'axios';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const Report = () => {
  const [report, setReport] = useState({
    type: 'missed_collection',
    details: '',
    location: '',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const reportTypes = [
    { value: 'missed_collection', label: 'Missed Collection', icon: '📅' },
    { value: 'damaged_bin', label: 'Damaged Bin', icon: '🗑️' },
    { value: 'overflowing', label: 'Overflowing Bin', icon: '📦' },
    { value: 'illegal_dumping', label: 'Illegal Dumping', icon: '🚫' },
    { value: 'vehicle_issue', label: 'Vehicle Issue', icon: '🚛' },
    { value: 'other', label: 'Other', icon: '❓' }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-red-600' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('http://localhost:3000/api/waste/report', report);
      setSuccess(true);
      setReport({
        type: 'missed_collection',
        details: '',
        location: '',
        priority: 'medium'
      });
    } catch (error) {
      setError('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setReport({
      ...report,
      [e.target.name]: e.target.value
    });
  };

  if (success) {
    return (
      <div className="animate-fade-in">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Submitted Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your report. We'll investigate and respond within 24-48 hours.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <ExclamationTriangleIcon className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Report an Issue</h1>
            <p className="text-gray-600">Help us improve our waste management services</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Issue Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {reportTypes.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                    report.type === type.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    checked={report.type === type.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="text-2xl">{type.icon}</span>
                  <span className="font-medium text-gray-900">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location (Optional)
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={report.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Near Main Street, House #123"
            />
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Priority Level
            </label>
            <select
              id="priority"
              name="priority"
              value={report.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {priorityLevels.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-2">
              Details
            </label>
            <textarea
              id="details"
              name="details"
              rows={4}
              value={report.details}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Please provide detailed information about the issue..."
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-gray-600">
              <p>Reports are typically resolved within 24-48 hours.</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contacts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-medium text-red-900 mb-2">Emergency Waste Issues</h3>
            <p className="text-sm text-red-800 mb-2">For hazardous spills or urgent health concerns</p>
            <p className="text-lg font-bold text-red-600">📞 Emergency: 911</p>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Customer Service</h3>
            <p className="text-sm text-blue-800 mb-2">For general inquiries and non-urgent issues</p>
            <p className="text-lg font-bold text-blue-600">📞 Support: (555) 123-4567</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;