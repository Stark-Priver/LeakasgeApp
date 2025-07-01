import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  MapPin,
  Calendar
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../lib/supabase';
import type { WaterReport } from '../lib/supabase';

interface DashboardStats {
  totalReports: number;
  pendingReports: number;
  inProgressReports: number;
  resolvedReports: number;
  totalUsers: number;
  criticalIssues: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    pendingReports: 0,
    inProgressReports: 0,
    resolvedReports: 0,
    totalUsers: 0,
    criticalIssues: 0,
  });
  const [recentReports, setRecentReports] = useState<WaterReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch reports with user data
      const { data: reports, error: reportsError } = await supabase
        .from('water_reports')
        .select(`
          *,
          user:users(email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      // Fetch users count
      const { count: usersCount, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      const reportsData = reports || [];
      
      setStats({
        totalReports: reportsData.length,
        pendingReports: reportsData.filter(r => r.status === 'pending').length,
        inProgressReports: reportsData.filter(r => r.status === 'in_progress').length,
        resolvedReports: reportsData.filter(r => r.status === 'resolved').length,
        totalUsers: usersCount || 0,
        criticalIssues: reportsData.filter(r => r.severity === 'critical').length,
      });

      setRecentReports(reportsData.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Reports',
      value: stats.totalReports,
      icon: FileText,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      title: 'Pending',
      value: stats.pendingReports,
      icon: Clock,
      color: 'bg-yellow-500',
      change: '+5%',
    },
    {
      title: 'In Progress',
      value: stats.inProgressReports,
      icon: TrendingUp,
      color: 'bg-orange-500',
      change: '+8%',
    },
    {
      title: 'Resolved',
      value: stats.resolvedReports,
      icon: CheckCircle,
      color: 'bg-green-500',
      change: '+15%',
    },
  ];

  const chartData = [
    { name: 'Jan', reports: 65 },
    { name: 'Feb', reports: 78 },
    { name: 'Mar', reports: 90 },
    { name: 'Apr', reports: 81 },
    { name: 'May', reports: 95 },
    { name: 'Jun', reports: 88 },
  ];

  const pieData = [
    { name: 'Leakage', value: 45, color: '#3B82F6' },
    { name: 'Water Quality', value: 30, color: '#10B981' },
    { name: 'Other', value: 25, color: '#F59E0B' },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 px-2 md:px-6 py-6 md:py-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with water reports.</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 mt-2 md:mt-0">
          <Calendar className="h-4 w-4" />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {statsCards.map((card, index) => (
          <div key={index} className="bg-white rounded-2xl shadow border border-gray-200 p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                <p className="text-xs text-green-600 mt-1">{card.change} from last month</p>
              </div>
              <div className={`p-3 rounded-full ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Reports Over Time */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="reports" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Issue Types Distribution */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Issue Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: entry.color }}></div>
                  <span className="text-sm text-gray-600">{entry.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-2xl shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Reports</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentReports.map((report) => (
            <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {report.issue_type.charAt(0).toUpperCase() + report.issue_type.slice(1).replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{report.location}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        by {report.user?.full_name || report.user?.email} • {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(report.severity)}`}>
                    {report.severity}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                    {report.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Issues Alert */}
      {stats.criticalIssues > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mt-8">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Critical Issues Require Attention</h4>
              <p className="text-sm text-red-600 mt-1">
                {stats.criticalIssues} critical issue{stats.criticalIssues > 1 ? 's' : ''} need immediate attention.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}