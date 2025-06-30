import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Link } from 'react-router-dom';

// Define the structure of a water issue report, similar to mobile app's WaterIssueItem
interface WaterIssueReport {
  id: string; // UUID
  user_id: string; // UUID
  type: string;
  description: string;
  severity: string;
  image_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  timestamp: string; // ISO string timestamp
  // Potentially add user email if joining with users table
  // user_email?: string;
}

const DashboardPage: React.FC = () => {
  const [reports, setReports] = useState<WaterIssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters - basic examples
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  // const [filterDate, setFilterDate] = useState(''); // Date filtering is more complex

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        let query = supabase.from('water_issues').select('*').order('timestamp', { ascending: false });

        if (filterSeverity) {
          query = query.eq('severity', filterSeverity);
        }
        if (filterStatus) {
          query = query.eq('status', filterStatus);
        }
        // Add more filters as needed (e.g., date range)

        const { data, error: fetchError } = await query;

        if (fetchError) {
          console.error('Error fetching reports:', fetchError.message);
          setError(fetchError.message);
        } else {
          setReports(data as WaterIssueReport[]);
        }
      } catch (e: any) {
        console.error('Fetch reports exception:', e.message);
        setError(e.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [filterSeverity, filterStatus]); // Re-fetch when filters change

  if (loading) {
    return <div className="p-4 text-center">Loading reports...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">Error fetching reports: {error}</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Water Issue Reports Dashboard</h1>

      {/* Filter Controls */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg shadow">
        <div>
          <label htmlFor="filterSeverity" className="block text-sm font-medium text-gray-700 mb-1">Filter by Severity:</label>
          <select
            id="filterSeverity"
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Severities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
        <div>
          <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700 mb-1">Filter by Status:</label>
          <select
            id="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        {/* Add Date filter input if needed */}
      </div>

      {/* Reports Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        {reports.length === 0 ? (
          <p className="p-4 text-center text-gray-500">No reports found matching your criteria.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      report.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                      report.severity === 'High' ? 'bg-yellow-100 text-yellow-800' :
                      report.severity === 'Medium' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800' // Low
                    }`}>
                      {report.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      report.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      report.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                      report.status === 'Closed' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800' // In Progress or other
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(report.timestamp).toLocaleDateString()} {new Date(report.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link to={`/report/${report.id}`} className="text-indigo-600 hover:text-indigo-900">
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
