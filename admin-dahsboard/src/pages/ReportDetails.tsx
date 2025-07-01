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
  const [comment, setComment] = useState(''); // Placeholder for future comment feature
  const [assignedTo, setAssignedTo] = useState(''); // For assignment input

  useEffect(() => {
    if (id) {
      fetchReportDetails(id);
    }
  }, [id]);

  const fetchReportDetails = async (reportId: string) => {
    setLoading(true);
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
      setAssignedTo(data?.assigned_to || '');
    } catch (error) {
      console.error('Error fetching report details:', error);
      setReport(null); // Ensure report is null on error
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentOrStatusUpdate = async (newStatus?: WaterReport['status']) => {
    if (!report) return;

    const statusToUpdate = newStatus || report.status;

    try {
      const { data: updatedReport, error } = await supabase
        .from('water_reports')
        .update({ 
          status: statusToUpdate,
          updated_at: new Date().toISOString(),
          assigned_to: assignedTo.trim() || null // Use trimmed assignedTo or null
        })
        .eq('id', report.id)
        .select(`
          *,
          user:users(email, full_name)
        `)
        .single();

      if (error) throw error;
      
      setReport(updatedReport); // Update report state with the fresh data from DB
      // Optionally, give user feedback on successful update
      alert('Report updated successfully!');

    } catch (error) {
      console.error('Error updating report:', error);
      alert('Failed to update report.');
    }
  };

  const formatText = (text: string | null | undefined, defaultText = 'N/A') => {
    if (!text) return defaultText;
    return text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getSeverityBadgeStyle = (severity?: WaterReport['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusBadgeStyle = (status?: WaterReport['status']) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-700 border-green-300';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = (status?: WaterReport['status']) => {
    switch (status) {
      case 'resolved': return CheckCircle;
      case 'in_progress': return Clock;
      case 'pending': return AlertTriangle;
      default: return Clock; // Default icon
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
        <p className="text-gray-600 mb-6">The report you are looking for does not exist or could not be loaded.</p>
        <Link
          to="/reports"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-base font-medium"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to All Reports
        </Link>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(report.status);
  const cardClassName = "bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300";
  const labelClassName = "block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1";
  const valueClassName = "text-sm text-gray-800 bg-gray-50 rounded-md px-3 py-2";
  const valueLargeClassName = "text-base text-gray-800 bg-gray-50 rounded-md px-4 py-3";


  return (
    <div className="space-y-8 max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/reports"
            className="p-2.5 rounded-full hover:bg-gray-200 transition-colors"
            title="Back to reports"
          >
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Report Details</h1>
            <p className="text-gray-500 text-sm">ID: <span className="font-mono">{report.id}</span></p>
          </div>
        </div>
        <div className="flex items-center space-x-3 flex-shrink-0">
          <span className={`inline-flex items-center px-3.5 py-1.5 text-sm font-semibold rounded-full border ${getSeverityBadgeStyle(report.severity)} capitalize`}>
            {formatText(report.severity)}
          </span>
          <span className={`inline-flex items-center px-3.5 py-1.5 text-sm font-semibold rounded-full border ${getStatusBadgeStyle(report.status)}`}>
            <StatusIcon className="h-4 w-4 mr-1.5" />
            {formatText(report.status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Report Information */}
          <div className={cardClassName}>
            <h2 className="text-xl font-semibold text-gray-800 mb-5">Issue Details</h2>
            
            <div className="space-y-5">
              <div>
                <label className={labelClassName}>Issue Type</label>
                <p className={valueLargeClassName}>{formatText(report.issue_type)}</p>
              </div>

              <div>
                <label className={labelClassName}>Description</label>
                <p className={`${valueLargeClassName} whitespace-pre-wrap min-h-[60px]`}>
                  {report.description || <span className="italic text-gray-500">No description provided.</span>}
                </p>
              </div>

              <div>
                <label className={labelClassName}>Location Details</label>
                <div className={`${valueLargeClassName} space-y-1.5`}>
                  {report.location_address ? (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                      <span>{report.location_address}</span>
                    </div>
                  ) : (report.latitude && report.longitude) ? (
                     <div className="flex items-center">
                       <MapPin className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                       <span>Lat: {report.latitude.toFixed(5)}, Lon: {report.longitude.toFixed(5)}</span>
                     </div>
                  ) : (
                    <p className="italic text-gray-500">No specific location provided.</p>
                  )}
                </div>
              </div>

              {(report.latitude || report.longitude) && (!report.location_address || (report.location_address && (report.latitude || report.longitude))) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
                  {report.latitude && (
                    <div>
                      <label className={labelClassName}>Latitude</label>
                      <p className={valueClassName}>{report.latitude.toFixed(5)}</p>
                    </div>
                  )}
                  {report.longitude && (
                    <div>
                      <label className={labelClassName}>Longitude</label>
                      <p className={valueClassName}>{report.longitude.toFixed(5)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Photo Evidence */}
          {report.image_url && (
            <div className={cardClassName}>
              <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
                <Camera className="h-5 w-5 mr-2.5 text-gray-600" />
                Photo Evidence
              </h2>
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <a href={report.image_url} target="_blank" rel="noopener noreferrer" title="View full image">
                  <img
                    src={report.image_url}
                    alt="Report evidence"
                    className="w-full h-auto max-h-[400px] object-contain bg-gray-100"
                  />
                </a>
              </div>
            </div>
          )}

          {/* Potential Map Placeholder - Only if coordinates exist */}
          {(report.latitude && report.longitude) && (
            <div className={cardClassName}>
              <h2 className="text-xl font-semibold text-gray-800 mb-5">Location Map</h2>
              <div className="h-72 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                <div className="text-center p-4">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Map integration (e.g., Leaflet, Google Maps) would show here.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Using Coordinates: {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Comments Section (Placeholder) */}
          <div className={cardClassName}>
            <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2.5 text-gray-600" />
              Internal Comments & History
            </h2>
            <div className="space-y-4">
              {/* Example Comment */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                      SYS
                    </div>
                    <span className="text-sm font-semibold text-gray-800">System</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(report.created_at).toLocaleString([], {dateStyle: 'medium', timeStyle: 'short'})}
                  </span>
                </div>
                <p className="text-sm text-gray-700">Report created and submitted for review.</p>
              </div>

              {report.updated_at && new Date(report.updated_at).getTime() !== new Date(report.created_at).getTime() && (
                 <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                       <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium text-green-600">
                        ADM
                      </div>
                      <span className="text-sm font-semibold text-gray-800">Admin/System</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(report.updated_at).toLocaleString([], {dateStyle: 'medium', timeStyle: 'short'})}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Report details last updated. Status: {formatText(report.status)}. Assigned to: {formatText(report.assigned_to, 'Unassigned')}.
                  </p>
                </div>
              )}
              {/* Comment input - future enhancement */}
              {/* <div className="border-t pt-4 mt-4"> ... </div> */}
               <p className="text-sm text-gray-500 italic text-center pt-2">Comment history and input form can be added here.</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Reporter Information */}
          <div className={cardClassName}>
            <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
              <User className="h-5 w-5 mr-2.5 text-gray-600" />
              Reporter Details
            </h2>
            <div className="space-y-3.5">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200">
                  <span className="text-lg font-medium text-blue-600">
                    {report.user?.full_name?.charAt(0).toUpperCase() || report.user?.email?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-800">
                    {report.user?.full_name || formatText(report.user?.email, 'Anonymous User')}
                  </p>
                  <p className="text-xs text-gray-500">Reporter</p>
                </div>
              </div>
              {report.user?.email && (
                <div className="flex items-center space-x-2.5 text-sm text-gray-700 pt-1">
                  <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <a href={`mailto:${report.user.email}`} className="hover:underline truncate" title={report.user.email}>{report.user.email}</a>
                </div>
              )}
              <div className="flex items-center space-x-2.5 text-sm text-gray-700">
                <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span>Reported on: {new Date(report.created_at).toLocaleDateString([], {dateStyle: 'long'})}</span>
              </div>
            </div>
          </div>

          {/* Status Management */}
          <div className={cardClassName}>
            <h2 className="text-xl font-semibold text-gray-800 mb-5">Manage Report</h2>
            <div className="space-y-5">
              <div>
                <label htmlFor="statusSelect" className={labelClassName}>Update Status</label>
                <select
                  id="statusSelect"
                  value={report.status}
                  onChange={(e) => handleAssignmentOrStatusUpdate(e.target.value as WaterReport['status'])}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label htmlFor="assignToInput" className={labelClassName}>Assign To</label>
                <input
                  id="assignToInput"
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Technician name or ID"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <button
                onClick={() => handleAssignmentOrStatusUpdate()} // Updates assignment with current status, or just assignment if status not changed via select
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors text-sm font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>

          {/* Quick Actions - simplified */}
          <div className={cardClassName}>
            <h2 className="text-xl font-semibold text-gray-800 mb-5">Quick Actions</h2>
            <div className="space-y-2.5">
              {report.status === 'pending' && (
                <button
                  onClick={() => handleAssignmentOrStatusUpdate('in_progress')}
                  className="w-full px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors text-sm font-medium"
                >
                  Start Investigation
                </button>
              )}
              {report.status === 'in_progress' && (
                <button
                  onClick={() => handleAssignmentOrStatusUpdate('resolved')}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  Mark as Resolved
                </button>
              )}
               <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium">
                Log Internal Note (Future)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}