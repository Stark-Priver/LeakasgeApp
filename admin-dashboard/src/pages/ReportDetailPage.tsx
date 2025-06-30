import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet'; // Import L for custom marker icons if needed

// Fix for default marker icon issue with webpack/vite
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});


interface WaterIssueReport {
  id: string;
  user_id: string;
  type: string;
  description: string;
  severity: string;
  image_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  timestamp: string;
  // user_email?: string; // If joining with a user table for email
}

const availableStatuses = ["Pending", "In Progress", "On Hold", "Resolved", "Closed", "Cannot Reproduce"];


const ReportDetailPage: React.FC = () => {
  const { id: reportId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<WaterIssueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);


  useEffect(() => {
    const fetchReportDetails = async () => {
      if (!reportId) {
        setError("Report ID is missing.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('water_issues')
          .select('*')
          .eq('id', reportId)
          .single(); // Expecting a single report

        if (fetchError) {
          console.error('Error fetching report details:', fetchError.message);
          setError(fetchError.message);
        } else if (data) {
          setReport(data as WaterIssueReport);
          setNewStatus(data.status); // Initialize dropdown with current status
        } else {
          setError('Report not found.');
        }
      } catch (e: any) {
        console.error('Fetch report detail exception:', e.message);
        setError(e.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchReportDetails();
  }, [reportId]);

  const handleStatusUpdate = async () => {
    if (!report || !newStatus || newStatus === report.status) {
      setUpdateMessage({type: 'error', text: 'No status change detected or new status is invalid.'});
      return;
    }
    setIsUpdating(true);
    setUpdateMessage(null);
    try {
      const { error: updateError } = await supabase
        .from('water_issues')
        .update({ status: newStatus })
        .eq('id', report.id);

      if (updateError) {
        console.error('Error updating status:', updateError.message);
        setUpdateMessage({ type: 'error', text: `Failed to update status: ${updateError.message}` });
      } else {
        setReport(prev => prev ? { ...prev, status: newStatus } : null);
        setUpdateMessage({ type: 'success', text: 'Status updated successfully!' });
      }
    } catch (e: any) {
      console.error('Update status exception:', e.message);
      setUpdateMessage({ type: 'error', text: `An unexpected error occurred: ${e.message}`});
    } finally {
      setIsUpdating(false);
    }
  };

  const getSupabaseImageUrl = (path: string) => {
    // Construct full URL for image from Supabase Storage
    // Assumes path is like "userid/image.jpg" and bucket is "water_issues_images"
    // VITE_SUPABASE_URL/storage/v1/object/public/water_issues_images/IMAGE_PATH
    if (!import.meta.env.VITE_SUPABASE_URL) return ''; // Should not happen if env is set
    // The path from DB should be relative to the bucket root.
    // Example: "059992bf-c898-400f-813e-89992920a41a/fa79aa18-9983-4015-85dc-69ada6bb5806.jpg"
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/water_issues_images/${path}`;
  }


  if (loading) return <div className="p-6 text-center">Loading report details...</div>;
  if (error) return <div className="p-6 text-center text-red-600">Error: {error}</div>;
  if (!report) return <div className="p-6 text-center text-gray-500">Report not found.</div>;

  const position: [number, number] | null =
    report.latitude != null && report.longitude != null ? [report.latitude, report.longitude] : null;

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <button
        onClick={() => navigate(-1)} // Go back to previous page
        className="mb-6 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        &larr; Back to Dashboard
      </button>

      <div className="bg-white shadow-lg rounded-lg p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-2">Report Details</h1>
        <p className="text-sm text-gray-500 mb-6">ID: {report.id}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">Issue Information</h3>
            <p><strong>Type:</strong> {report.type}</p>
            <p><strong>Severity:</strong> {report.severity}</p>
            <p><strong>Description:</strong> {report.description}</p>
            <p><strong>Reported At:</strong> {new Date(report.timestamp).toLocaleString()}</p>
            <p><strong>User ID:</strong> {report.user_id}</p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Status Management</h3>
            <div className="flex items-center space-x-3">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isUpdating}
              >
                {availableStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={isUpdating || newStatus === report.status}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isUpdating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
            {updateMessage && (
              <p className={`mt-2 text-sm ${updateMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {updateMessage.text}
              </p>
            )}
             <p className="mt-2"><strong>Current Status:</strong> <span className="font-semibold">{report.status}</span></p>
          </div>
        </div>

        {report.image_url && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Uploaded Image</h3>
            <img
              src={getSupabaseImageUrl(report.image_url)}
              alt={`Report ${report.id}`}
              className="max-w-full md:max-w-lg h-auto rounded-md shadow-sm border"
            />
          </div>
        )}

        {position && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Location Map</h3>
            <MapContainer center={position} zoom={15} scrollWheelZoom={false} style={{ height: '400px', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={position}>
                <Popup>
                  Reported Location <br /> Lat: {report.latitude}, Lng: {report.longitude}
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportDetailPage;
