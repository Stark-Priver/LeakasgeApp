import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  MapPin, 
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Download
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { supabase } from '../lib/supabase';

export function Analytics() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      // Fetch analytics data based on time range
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  const reportsByWeek = [
    { week: 'Week 1', reports: 45, resolved: 38 },
    { week: 'Week 2', reports: 52, resolved: 45 },
    { week: 'Week 3', reports: 48, resolved: 42 },
    { week: 'Week 4', reports: 61, resolved: 55 },
    { week: 'Week 5', reports: 55, resolved: 48 },
    { week: 'Week 6', reports: 67, resolved: 60 },
  ];

  const issueTypes = [
    { name: 'Leakage', value: 45, color: '#3B82F6' },
    { name: 'Water Quality', value: 30, color: '#10B981' },
    { name: 'Pressure Issues', value: 15, color: '#F59E0B' },
    { name: 'Other', value: 10, color: '#EF4444' },
  ];

  const severityData = [
    { name: 'Critical', value: 15, color: '#EF4444' },
    { name: 'High', value: 25, color: '#F97316' },
    { name: 'Medium', value: 35, color: '#EAB308' },
    { name: 'Low', value: 25, color: '#22C55E' },
  ];

  const responseTimeData = [
    { month: 'Jan', avgTime: 2.5 },
    { month: 'Feb', avgTime: 3.2 },
    { month: 'Mar', avgTime: 2.8 },
    { month: 'Apr', avgTime: 2.1 },
    { month: 'May', avgTime: 1.9 },
    { month: 'Jun', avgTime: 2.3 },
  ];

  const locationData = [
    { area: 'Downtown', reports: 45, resolved: 38 },
    { area: 'Riverside', reports: 32, resolved: 28 },
    { area: 'Industrial', reports: 28, resolved: 25 },
    { area: 'Residential', reports: 52, resolved: 47 },
    { area: 'Commercial', reports: 38, resolved: 35 },
  ];

  const kpiCards = [
    {
      title: 'Total Reports',
      value: '1,234',
      change: '+12.5%',
      icon: BarChart3,
      color: 'bg-blue-500',
      trend: 'up'
    },
    {
      title: 'Resolution Rate',
      value: '87.3%',
      change: '+3.2%',
      icon: TrendingUp,
      color: 'bg-green-500',
      trend: 'up'
    },
    {
      title: 'Avg Response Time',
      value: '2.3 hrs',
      change: '-15.4%',
      icon: Clock,
      color: 'bg-orange-500',
      trend: 'down'
    },
    {
      title: 'Active Issues',
      value: '42',
      change: '-8.1%',
      icon: Activity,
      color: 'bg-red-500',
      trend: 'down'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Track performance metrics and trends</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${
                    card.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {card.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className={`p-3 rounded-full ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports Over Time */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Reports vs Resolutions</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Reports</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Resolved</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportsByWeek}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="reports" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Issue Types */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Issue Types Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={issueTypes}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {issueTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {issueTypes.map((entry, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-sm text-gray-600">{entry.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Average Response Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} hours`, 'Response Time']} />
              <Area 
                type="monotone" 
                dataKey="avgTime" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.1}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Issues by Severity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={severityData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={70} />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8">
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Location Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Performance by Location</h3>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Geographic Distribution</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Area</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Total Reports</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Resolved</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Resolution Rate</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Performance</th>
              </tr>
            </thead>
            <tbody>
              {locationData.map((area, index) => {
                const resolutionRate = ((area.resolved / area.reports) * 100).toFixed(1);
                return (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{area.area}</td>
                    <td className="py-3 px-4 text-gray-600">{area.reports}</td>
                    <td className="py-3 px-4 text-gray-600">{area.resolved}</td>
                    <td className="py-3 px-4 text-gray-600">{resolutionRate}%</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${resolutionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{resolutionRate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}