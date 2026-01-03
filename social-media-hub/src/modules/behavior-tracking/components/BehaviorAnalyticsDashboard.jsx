/**
 * React Dashboard Component for Behavior Analytics
 * Real-time user behavior monitoring and analytics visualization
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const BehaviorAnalyticsDashboard = ({ apiUrl = '/api/analytics', authToken }) => {
  // State
  const [overview, setOverview] = useState(null);
  const [events, setEvents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [topPages, setTopPages] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState(null);

  // API Config
  const apiConfig = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };

  /**
   * Fetch overview data
   */
  const fetchOverview = useCallback(async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/overview?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        apiConfig
      );
      setOverview(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch overview');
      console.error('Overview error:', err);
    }
  }, [apiUrl, dateRange, apiConfig]);

  /**
   * Fetch events
   */
  const fetchEvents = useCallback(async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/events?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&limit=20`,
        apiConfig
      );
      setEvents(response.data.data.events);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch events');
      console.error('Events error:', err);
    }
  }, [apiUrl, dateRange, apiConfig]);

  /**
   * Fetch metrics
   */
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/metrics?interval=1day`,
        apiConfig
      );
      setMetrics(response.data.data.metrics);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch metrics');
      console.error('Metrics error:', err);
    }
  }, [apiUrl, apiConfig]);

  /**
   * Fetch top pages
   */
  const fetchTopPages = useCallback(async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/top-pages?limit=10&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        apiConfig
      );
      setTopPages(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch top pages');
      console.error('Top pages error:', err);
    }
  }, [apiUrl, dateRange, apiConfig]);

  /**
   * Fetch devices
   */
  const fetchDevices = useCallback(async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/devices?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        apiConfig
      );
      setDevices(response.data.data.devices);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch devices');
      console.error('Devices error:', err);
    }
  }, [apiUrl, dateRange, apiConfig]);

  /**
   * Load all data
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOverview(),
        fetchEvents(),
        fetchMetrics(),
        fetchTopPages(),
        fetchDevices()
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchOverview, fetchEvents, fetchMetrics, fetchTopPages, fetchDevices]);

  // Initial load and date range changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle date range change
  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="behavior-analytics-dashboard p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          User Behavior Analytics
        </h1>
        <p className="text-gray-600">
          Real-time user interaction monitoring and analytics
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Date Range Picker */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadData}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-1">Total Events</p>
            <p className="text-2xl font-bold text-gray-800">
              {overview.totalEvents?.toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-1">Unique Users</p>
            <p className="text-2xl font-bold text-gray-800">
              {overview.uniqueUsers?.toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-1">Sessions</p>
            <p className="text-2xl font-bold text-gray-800">
              {overview.uniqueSessions?.toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-1">Avg Session Duration</p>
            <p className="text-2xl font-bold text-gray-800">
              {overview.avgSessionDuration ? `${(overview.avgSessionDuration / 1000 / 60).toFixed(1)}m` : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Metrics Line Chart */}
        {metrics.length > 0 && (
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Event Trends
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="eventCount"
                  stroke="#8884d8"
                  dot={false}
                  name="Events"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Pages Bar Chart */}
        {topPages.length > 0 && (
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Top Pages
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topPages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="viewCount" fill="#82ca9d" name="Views" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Event Types Pie Chart */}
        {overview?.eventsByType && overview.eventsByType.length > 0 && (
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Events by Type
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={overview.eventsByType}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {overview.eventsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Devices Pie Chart */}
        {devices.length > 0 && (
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Devices
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={devices}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {devices.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Events Table */}
      {events.length > 0 && (
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Recent Events
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Time</th>
                  <th className="px-4 py-2 text-left">Event Type</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-left">URL</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.eventId} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {event.eventType}
                      </span>
                    </td>
                    <td className="px-4 py-2">{event.eventCategory}</td>
                    <td className="px-4 py-2 truncate max-w-xs text-gray-600">
                      {event.url}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        event.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : event.status === 'warning'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {event.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BehaviorAnalyticsDashboard;
