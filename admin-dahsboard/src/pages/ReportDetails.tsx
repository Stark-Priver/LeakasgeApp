import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  User, 
  Camera,
  Phone,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { WaterReport } from '../lib/supabase';

export function ReportDetails() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<WaterReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  useEffect(() => {
    if (id) {
      fetchReportDetails(id);
    }
  }, [id]);

  const fetchReportDetails = async (reportId: string) => {
    try {
      const { data, error } = await supabase
        .from('water_reports')
        .select(`
          *,
          user:users(email, full_name)
        `)
        .eq('id', reportId)
        .single();

      if (error) throw error;
      setReport(data);
      setAssignedTo(data.assigned_to || '');
    } catch (error) {
      console.error('Error fetching report details:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (newStatus: string) => {
    if (!report) return;

    try {
      const { error } = await supabase
        .from('water_reports')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString(),
          assigned_to: assignedTo || null
        })
        .eq('id', report.id);

      if (error) throw error;
      
      setReport({
        ...report,
        status: newStatus as any,
        updated_at: new Date().toISOString(),
        assigned_to: assignedTo || null
      });
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return CheckCircle;
      case 'in_progress': return Clock;
      case 'pending': return AlertTriangle;
      default: return Clock;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Report Not Found</h2>
        <Link
          to="/reports"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Link>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(report.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/reports"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Report Details</h1>
            <p className="text-gray-600">Report ID: {report.id.slice(0, 8)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${getSeverityColor(report.severity)}`}>
            {report.severity.toUpperCase()}
          </span>
          <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(report.status)}`}>
            <StatusIcon className="h-4 w-4 mr-1" />
            {report.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Issue Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Type
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 rounded-lg px-3 py-2">
                  {report.issue_type.charAt(0).toUpperCase() + report.issue_type.slice(1).replace('_', ' ')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 rounded-lg px-3 py-2 whitespace-pre-wrap">
                  {report.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <div className="flex items-center space-x-2 text-sm text-gray-900 bg-gray-50 rounded-lg px-3 py-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{report.location}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-lg px-3 py-2">
                    {report.latitude}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-lg px-3 py-2">
                    {report.longitude}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Photo Evidence */}
          {report.photo_url && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Photo Evidence
              </h2>
              <div className="rounded-lg overflow-hidden">
                <img
                  src={report.photo_url}
                  alt="Report evidence"
                  className="w-full h-64 object-cover"
                />
              </div>
            </div>
          )}

          {/* Map */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location Map</h2>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Map integration would be implemented here
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Coordinates: {report.latitude}, {report.longitude}
                </p>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Comments & Updates
            </h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">S</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">System</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(report.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">Report created and submitted for review.</p>
              </div>

              {report.status !== 'pending' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-green-600">A</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">Admin</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(report.updated_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Status updated to {report.status.replace('_', ' ')}.
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment or update..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
                <div className="mt-2 flex justify-end">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                    Add Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reporter Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Reporter Details
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {report.user?.full_name?.charAt(0) || report.user?.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {report.user?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">Reporter</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{report.user?.email}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Reported on {new Date(report.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Status Management */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Management</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Status
                </label>
                <select
                  value={report.status}
                  onChange={(e) => updateReportStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To
                </label>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Technician name or ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={() => updateReportStatus(report.status)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Update Assignment
              </button>
            </div>
          </div>

          {/* Priority Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            
            <div className="space-y-2">
              {report.status === 'pending' && (
                <button
                  onClick={() => updateReportStatus('in_progress')}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200"
                >
                  Start Working
                </button>
              )}
              
              {report.status === 'in_progress' && (
                <button
                  onClick={() => updateReportStatus('resolved')}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  Mark as Resolved
                </button>
              )}
              
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                Contact Reporter
              </button>
              
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                Print Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}