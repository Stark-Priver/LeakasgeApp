import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import emailjs from '@emailjs/browser';
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
import { supabase } from '../lib/supabase'; // Keep for auth session
// import type { WaterReport } from '../lib/supabase'; // Will use ApiWaterReport
import { ApiWaterReport } from './Reports'; // Import the API report type

// API base URL - should ideally come from .env or a config file
const API_BASE_URL = "http://192.168.8.126:3001/api";


// Leaflet Map Component
const LeafletMap = ({ latitude, longitude, address }: { latitude?: number | null, longitude?: number | null, address?: string | null }) => {
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);

  useEffect(() => {
    // Load Leaflet CSS and JS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
      document.head.appendChild(link);
    }

    const loadLeaflet = async () => {
      if (window.L) {
        initializeMap();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
      script.onload = initializeMap;
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current || !window.L || mapInstanceRef.current) return;

      // Initialize map
      const map = window.L.map(mapRef.current).setView([latitude, longitude], 15);
      mapInstanceRef.current = map;

      // Add tile layer
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Add marker
      const marker = window.L.marker([latitude, longitude]).addTo(map);
      
      // Add popup with address or coordinates
      const popupContent = address || `Coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      marker.bindPopup(popupContent).openPopup();
    };

    if (latitude && longitude) {
      loadLeaflet();
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, address]);

  if (!latitude || !longitude) {
    return null;
  }

  return (
    <div 
      ref={mapRef} 
      className="h-72 w-full rounded-lg border border-gray-200"
      style={{ minHeight: '288px' }}
    />
  );
};

export function ReportDetails() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ApiWaterReport | null>(null); // Use ApiWaterReport
  const [loading, setLoading] = useState(true);
  // const [comment, setComment] = useState(''); // Placeholder for future comment feature - remove if not used
  const [currentAssignedTo, setCurrentAssignedTo] = useState(''); // For assignment input field
  const [currentStatus, setCurrentStatus] = useState<ApiWaterReport['status'] | undefined>(undefined);


  useEffect(() => {
    if (id) {
      fetchReportDetails(id);
    }
  }, [id]);

  const fetchReportDetails = async (reportId: string) => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data.session?.access_token;
      if (!token) throw new Error("Authentication token not found.");

      const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch report: ${response.statusText}`);
      }
      const data: ApiWaterReport = await response.json();
      setReport(data);
      setCurrentAssignedTo(data.assigned_to || '');
      setCurrentStatus(data.status);
    } catch (error: any) {
      console.error('Error fetching report details:', error.message || error);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!report || !id) return;

    const payload: { status?: ApiWaterReport['status']; assigned_to?: string | null } = {};

    if (currentStatus && currentStatus !== report.status) {
      payload.status = currentStatus;
    }
    if (currentAssignedTo !== (report.assigned_to || '')) { // Compare with original or empty string
      payload.assigned_to = currentAssignedTo.trim() || null;
    }

    if (Object.keys(payload).length === 0) {
      alert('No changes to save.');
      return;
    }

    setLoading(true); // Indicate loading state for save operation

    try {
      const session = await supabase.auth.getSession();
      const token = session?.data.session?.access_token;
      if (!token) throw new Error("Authentication token not found.");

      const response = await fetch(`${API_BASE_URL}/reports/${id}`, { // Use PUT /api/reports/:id
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update report: ${response.statusText}`);
      }
      
      const updatedReportFromServer: ApiWaterReport = await response.json();
      setReport(updatedReportFromServer); // Update report state with the fresh data from DB
      setCurrentAssignedTo(updatedReportFromServer.assigned_to || '');
      setCurrentStatus(updatedReportFromServer.status);
      alert('Report updated successfully!');

    } catch (error: any) {
      console.error('Error updating report:', error.message || error);
      alert(`Failed to update report: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Quick status update handler, e.g. for "Mark as Resolved" button
  const handleQuickStatusUpdate = async (newStatus: ApiWaterReport['status']) => {
    if (!report || !id || newStatus === report.status) return;

    setCurrentStatus(newStatus); // Set current status for UI consistency
                                 // then immediately call save.
    setLoading(true);

    try {
      const session = await supabase.auth.getSession();
      const token = session?.data.session?.access_token;
      if (!token) throw new Error("Authentication token not found.");

      const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, assigned_to: report.assigned_to }), // Send current assigned_to as well
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update report: ${response.statusText}`);
      }

      const updatedReportFromServer: ApiWaterReport = await response.json();
      setReport(updatedReportFromServer);
      setCurrentAssignedTo(updatedReportFromServer.assigned_to || '');
      setCurrentStatus(updatedReportFromServer.status);
      // alert(`Report status updated to ${formatText(newStatus)}!`); // Optional: specific feedback

      // Send email notification
      if (updatedReportFromServer.user?.email) {
        const templateParams = {
          to_name: updatedReportFromServer.user.full_name || 'User',
          to_email: updatedReportFromServer.user.email,
          report_id: updatedReportFromServer.id,
          report_status: newStatus,
        };

        emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          templateParams,
          import.meta.env.VITE_EMAILJS_USER_ID
        ).then((response) => {
          console.log('SUCCESS!', response.status, response.text);
        }, (err) => {
          console.log('FAILED...', err);
        });
      }

    } catch (error: any) {
      console.error('Error updating report status:', error.message || error);
      alert(`Failed to update status: ${error.message || 'Unknown error'}`);
      setCurrentStatus(report.status); // Revert UI on error
    } finally {
      setLoading(false);
    }
  };


  // formatText needs to handle uppercase enums from API if it's to be used for display
  const formatText = (text: string | null | undefined, defaultText = 'N/A') => {
    if (!text) return defaultText;
    // Example: PENDING -> Pending, WATER_QUALITY_PROBLEM -> Water Quality Problem
    return text
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getSeverityBadgeStyle = (severity?: ApiWaterReport['severity']) => {
    // API sends uppercase: CRITICAL, HIGH, MEDIUM, LOW
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-300';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'LOW': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusBadgeStyle = (status?: ApiWaterReport['status']) => {
    // API sends uppercase: RESOLVED, IN_PROGRESS, PENDING
    switch (status) {
      case 'RESOLVED': return 'bg-green-100 text-green-700 border-green-300';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = (status?: ApiWaterReport['status']) => {
    // API sends uppercase
    switch (status) {
      case 'RESOLVED': return CheckCircle;
      case 'IN_PROGRESS': return Clock;
      case 'PENDING': return AlertTriangle;
      default: return Clock; // Default icon
    }
  };

  if (loading && !report) { // Show full page loader only on initial load
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

  const StatusIcon = getStatusIcon(report.status); // This should now use report.status which is uppercase
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
            <p className="text-gray-500 text-sm">
              ID: <span className="font-mono">{report.id}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3 flex-shrink-0">
          <span
            className={`inline-flex items-center px-3.5 py-1.5 text-sm font-semibold rounded-full border ${getSeverityBadgeStyle(
              report.severity
            )} capitalize`}
          >
            {formatText(report.severity)}
          </span>
          <span
            className={`inline-flex items-center px-3.5 py-1.5 text-sm font-semibold rounded-full border ${getStatusBadgeStyle(
              report.status
            )}`}
          >
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
            <h2 className="text-xl font-semibold text-gray-800 mb-5">
              Issue Details
            </h2>

            <div className="space-y-5">
              <div>
                <label className={labelClassName}>Issue Type</label>
                <p className={valueLargeClassName}>
                  {formatText(report.issue_type)}
                </p>
              </div>

              <div>
                <label className={labelClassName}>Description</label>
                <p
                  className={`${valueLargeClassName} whitespace-pre-wrap min-h-[60px]`}
                >
                  {report.description || (
                    <span className="italic text-gray-500">
                      No description provided.
                    </span>
                  )}
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
                  ) : report.latitude && report.longitude ? (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                      <span>
                        Lat: {report.latitude.toFixed(5)}, Lon:{" "}
                        {report.longitude.toFixed(5)}
                      </span>
                    </div>
                  ) : (
                    <p className="italic text-gray-500">
                      No specific location provided.
                    </p>
                  )}
                </div>
              </div>

              {report.latitude &&
                report.longitude &&
                (!report.location_address ||
                  (report.location_address &&
                    report.latitude &&
                    report.longitude)) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
                    {report.latitude && (
                      <div>
                        <label className={labelClassName}>Latitude</label>
                        <p className={valueClassName}>
                          {report.latitude.toFixed(5)}
                        </p>
                      </div>
                    )}
                    {report.longitude && (
                      <div>
                        <label className={labelClassName}>Longitude</label>
                        <p className={valueClassName}>
                          {report.longitude.toFixed(5)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
            </div>
          </div>
          {/* Photo Evidence */}
          {/* Ensure image_urls is checked (it's optional in ApiWaterReport) */}
          {report.image_urls && report.image_urls.length > 0 ? (
            <div className={cardClassName}>
              <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
                <Camera className="h-5 w-5 mr-2.5 text-gray-600" />
                Photo Evidence ({report.image_urls.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {report.image_urls.map((url, index) => (
                  <div
                    key={index}
                    className="rounded-lg overflow-hidden border border-gray-200 aspect-w-1 aspect-h-1"
                  >
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`View full image ${index + 1}`}
                    >
                      <img
                        src={url}
                        alt={`Report evidence ${index + 1}`}
                        className="w-full h-full object-cover bg-gray-100 hover:opacity-90 transition-opacity"
                      />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ) : null}{" "}
          {/* Removed old image_url fallback as it's not in ApiWaterReport defined in Reports.tsx */}
          {/* Interactive Leaflet Map */}
          {report.latitude && report.longitude && (
            <div className={cardClassName}>
              <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
                <MapPin className="h-5 w-5 mr-2.5 text-gray-600" />
                Location Map
              </h2>
              <LeafletMap
                latitude={report.latitude}
                longitude={report.longitude}
                address={report.location_address}
              />
              <div className="mt-3 text-sm text-gray-600 flex items-center justify-between">
                <span>
                  Coordinates: {report.latitude.toFixed(5)},{" "}
                  {report.longitude.toFixed(5)}
                </span>
                <a
                  href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  View in Google Maps
                </a>
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
                    <span className="text-sm font-semibold text-gray-800">
                      System
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(report.createdAt).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  Report created and submitted for review.
                </p>
              </div>

              {/* Display last update information */}
              {report.updatedAt &&
                new Date(report.updatedAt).getTime() !==
                  new Date(report.createdAt).getTime() && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium text-green-600">
                          ADM
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                          Admin/System
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(report.updatedAt).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      Report details last updated. Status:{" "}
                      {formatText(report.status)}. Assigned to:{" "}
                      {formatText(report.assigned_to, "Unassigned")}.
                    </p>
                  </div>
                )}
              {/* Comment input - future enhancement */}
              {/* <div className="border-t pt-4 mt-4"> ... </div> */}
              <p className="text-sm text-gray-500 italic text-center pt-2">
                Comment history and input form can be added here.
              </p>
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
                    {/* User details are now directly from report.user */}
                    {report.user?.full_name?.charAt(0).toUpperCase() ||
                      report.user?.email?.charAt(0).toUpperCase() ||
                      "?"}
                  </span>
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-800">
                    {report.user?.full_name ||
                      formatText(report.user?.email, "Anonymous User")}
                  </p>
                  <p className="text-xs text-gray-500">Reporter</p>
                </div>
              </div>
              {report.user?.email && (
                <div className="flex items-center space-x-2.5 text-sm text-gray-700 pt-1">
                  <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <a
                    href={`mailto:${report.user.email}`}
                    className="hover:underline truncate"
                    title={report.user.email}
                  >
                    {report.user.email}
                  </a>
                </div>
              )}
              <div className="flex items-center space-x-2.5 text-sm text-gray-700">
                <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span>
                  Reported on:{" "}
                  {new Date(report.createdAt).toLocaleDateString([], {
                    dateStyle: "long",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Status Management */}
          <div className={cardClassName}>
            <h2 className="text-xl font-semibold text-gray-800 mb-5">
              Manage Report
            </h2>
            <div className="space-y-5">
              <div>
                <label htmlFor="statusSelect" className={labelClassName}>
                  Update Status
                </label>
                <select
                  id="statusSelect"
                  value={currentStatus || ""} // Use currentStatus state
                  onChange={(e) =>
                    setCurrentStatus(e.target.value as ApiWaterReport["status"])
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
                >
                  {/* Ensure option values are uppercase to match ApiWaterReport status type */}
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>

              <div>
                <label htmlFor="assignToInput" className={labelClassName}>
                  Assign To
                </label>
                <input
                  id="assignToInput"
                  type="text"
                  value={currentAssignedTo} // Use currentAssignedTo state
                  onChange={(e) => setCurrentAssignedTo(e.target.value)}
                  placeholder="Technician name or ID"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <button
                onClick={handleSaveChanges} // Use the new combined save handler
                disabled={loading} // Disable button when loading
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {loading && report ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Quick Actions - simplified */}
          <div className={cardClassName}>
            <h2 className="text-xl font-semibold text-gray-800 mb-5">
              Quick Actions
            </h2>
            <div className="space-y-2.5">
              {report.status === "PENDING" && (
                <button
                  onClick={() => handleQuickStatusUpdate("IN_PROGRESS")}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  Start Investigation
                </button>
              )}
              {report.status === "IN_PROGRESS" && (
                <button
                  onClick={() => handleQuickStatusUpdate("RESOLVED")}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  Mark as Resolved
                </button>
              )}
              <button
                onClick={() => handleBanUser(report.user?.id)}
                disabled={loading}
                className="w-full px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Ban User {report.user?.email}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}