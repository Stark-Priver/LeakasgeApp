import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  Download,
  Eye,
  MapPin,
  Calendar,
  User,
  ChevronDown,
  RefreshCw,
  FileText,
} from "lucide-react";
import { supabase } from "../lib/supabase"; // Keep for auth and potentially geocoding fallback
import type { WaterReport as SupabaseWaterReport } from "../lib/supabase"; // Keep original type for reference or specific Supabase interactions if any remain
import { useAuth } from "../contexts/AuthContext"; // To get user session/token easily if exposed, otherwise use supabase.auth.getSession()

// Define a type for the report structure expected from the new API
// This should align with what Prisma returns, including the nested user.
// For now, it's similar to SupabaseWaterReport but good to define separately.
export interface ApiWaterReport {
  id: string;
  user_id: string;
  issue_type: 'LEAKAGE' | 'WATER_QUALITY_PROBLEM' | 'OTHER'; // Note: Enums from Prisma are uppercase
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; // Note: Enums from Prisma are uppercase
  description: string;
  location_address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image_urls?: string[] | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'; // Note: Enums from Prisma are uppercase
  assigned_to?: string;
  createdAt: string; // Prisma uses ISO string
  updatedAt: string; // Prisma uses ISO string
  user?: { // User object structure from API
    email: string;
    full_name?: string | null;
    // is_banned is not directly in the API response for reports, but might be in a /users API
  };
  // Supabase specific fields like 'location' are not in the Prisma model unless added.
  // For now, assuming 'location' was derived or an alias.
}


const API_BASE_URL = "https://leakasge-app.vercel.app/api"; // Should be in .env ideally

export function Reports() {
  const [reports, setReports] = useState<ApiWaterReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<ApiWaterReport[]>([]); // Changed type
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    reports,
    searchTerm,
    statusFilter,
    severityFilter,
    typeFilter,
    sortBy,
    sortOrder,
  ]);

  const fetchReports = async () => {
    const isRefresh = !loading;
    if (isRefresh) setRefreshing(true);
    
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data.session?.access_token;

      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const response = await fetch(`${API_BASE_URL}/reports`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch reports: ${response.statusText}`);
      }

      const data: ApiWaterReport[] = await response.json();
      
      // Process reports to extract location from coordinates if needed (client-side geocoding)
      // Note: Prisma enums are uppercase, Supabase might have been lowercase. Adjust UI if needed.
      const processedReports = await Promise.all(
        (data || []).map(async (report) => {
          if (!report.location_address && report.latitude && report.longitude) {
            try {
              const address = await reverseGeocode(report.latitude, report.longitude);
              return { ...report, location_address: address };
            } catch (error) {
              console.warn("Failed to reverse geocode:", error);
              return report;
            }
          }
          return report;
        })
      );
      
      setReports(processedReports);
    } catch (error: any) {
      console.error("Error fetching reports:", error.message || error);
      // You might want to show a toast notification here using error.message
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  // Reverse geocoding function to get address from coordinates - this remains client-side for now
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      if (!response.ok) throw new Error('Geocoding failed');
      const data = await response.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.warn("Geocoding fallback:", error); // Log warning instead of error for fallback
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`; // Fallback to coordinates
    }
  };

  const applyFilters = () => {
    let filtered: ApiWaterReport[] = [...reports];

    // Search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (report) =>
          report.description.toLowerCase().includes(lowerSearchTerm) ||
          (report.location_address || "").toLowerCase().includes(lowerSearchTerm) ||
          (report.user?.email || "").toLowerCase().includes(lowerSearchTerm) ||
          (report.user?.full_name || "").toLowerCase().includes(lowerSearchTerm) ||
          report.id.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Status, Severity, Type filters
    // Assumes filter values from select dropdowns are now uppercase (e.g. "PENDING", "LOW", "LEAKAGE")
    if (statusFilter !== "all") {
      filtered = filtered.filter((report) => report.status === statusFilter);
    }
    if (severityFilter !== "all") {
      filtered = filtered.filter((report) => report.severity === severityFilter);
    }
    if (typeFilter !== "all") {
      filtered = filtered.filter((report) => report.issue_type === typeFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "created_at": // Field in ApiWaterReport is 'createdAt'
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "severity": // Severity values in ApiWaterReport are 'LOW', 'MEDIUM', etc.
          const severityOrder: { [key in ApiWaterReport["severity"]]: number } = {
            LOW: 1,
            MEDIUM: 2,
            HIGH: 3,
            CRITICAL: 4,
          };
          aValue = severityOrder[a.severity] || 0;
          bValue = severityOrder[b.severity] || 0;
          break;
        default:
           // Check if sortBy is a valid key of ApiWaterReport
          if (sortBy in a && sortBy in b) {
            aValue = (a as any)[sortBy];
            bValue = (b as any)[sortBy];
          } else {
            aValue = 0; bValue = 0; // Default or handle error
          }
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    setFilteredReports(filtered);
  };

  const updateReportStatus = async (
    reportId: string,
    newStatus: ApiWaterReport["status"] // Expects 'PENDING', 'IN_PROGRESS', or 'RESOLVED'
  ) => {
    try {
      const session = await supabase.auth.getSession(); // Still use supabase for auth token
      const token = session?.data.session?.access_token;
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      // Ensure this points to the general update endpoint, not /status specifically
      const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }), // API expects uppercase status
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update report status: ${response.statusText}`);
      }

      const updatedReportFromServer: ApiWaterReport = await response.json();

      // Update local state
      setReports(
        reports.map((report) =>
          report.id === reportId ? updatedReportFromServer : report
        )
      );
      // Also update filteredReports to reflect the change immediately if it's displayed
      setFilteredReports(
        filteredReports.map((report) =>
          report.id === reportId ? updatedReportFromServer : report
        )
      );

    } catch (error: any) {
      console.error("Error updating report status:", error.message || error);
      // Optionally, show an error to the user (e.g., using a toast notification)
    }
  };

  // CSV Export functionality
  const exportToCSV = async () => {
    setExporting(true);
    try {
      // Prepare data for CSV using ApiWaterReport structure
      const csvData = filteredReports.map(report => ({
        'Report ID': report.id,
        'Issue Type': formatText(report.issue_type), // formatText needs to handle uppercase enums
        'Description': report.description,
        'Location': report.location_address || 'N/A', // No 'location' field in ApiWaterReport
        'Coordinates': report.latitude && report.longitude 
          ? `${report.latitude}, ${report.longitude}` 
          : 'N/A',
        'Severity': formatText(report.severity), // formatText needs to handle uppercase enums
        'Status': formatText(report.status),     // formatText needs to handle uppercase enums
        'Reported By': report.user?.full_name || report.user?.email || 'Anonymous',
        'Created Date': new Date(report.createdAt).toLocaleDateString(), // Use createdAt
        'Updated Date': new Date(report.updatedAt).toLocaleDateString(), // Use updatedAt
      }));

      // Convert to CSV string (logic remains the same)
      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            return /[",\n]/.test(value) 
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `water_reports_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting CSV:', error);
      // You might want to show an error notification here
    } finally {
      setExporting(false);
    }
  };

  const handleRefresh = () => {
    fetchReports();
  };

  const formatText = (text: string | null | undefined) => {
    if (!text) return "N/A";
    // Handles uppercase enums like 'WATER_QUALITY_PROBLEM' or 'IN_PROGRESS'
    return text
      .toLowerCase() // Convert to lowercase first for consistent splitting
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getSeverityBadgeStyle = (severity: ApiWaterReport["severity"]) => {
    // Severity is already uppercase from API: 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-700 border-red-300";
      case "HIGH":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "LOW":
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusSelectStyle = (status: ApiWaterReport["status"]) => {
    // Status is already uppercase from API: 'PENDING', 'IN_PROGRESS', 'RESOLVED'
    switch (status) {
      case "RESOLVED":
        return "bg-green-50 text-green-700 border-green-300 focus:ring-green-500";
      case "IN_PROGRESS":
        return "bg-blue-50 text-blue-700 border-blue-300 focus:ring-blue-500";
      case "PENDING":
        return "bg-yellow-50 text-yellow-700 border-yellow-300 focus:ring-yellow-500";
      default:
        return "bg-gray-50 text-gray-700 border-gray-300 focus:ring-gray-500";
    }
  };

  const getDisplayLocation = (report: ApiWaterReport) => {
    if (report.location_address) {
      return report.location_address;
    }
    // No 'location' field in ApiWaterReport, remove this part
    // if (report.location) {
    //   return report.location;
    // }
    if (report.latitude && report.longitude) {
      return `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`;
    }
    return "Location not available";
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Water Reports</h1>
          <p className="text-gray-600">
            Manage and track all water issue reports
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button 
            onClick={exportToCSV}
            disabled={exporting || filteredReports.length === 0}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className={`h-4 w-4 mr-2 ${exporting ? 'animate-spin' : ''}`} />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Severity Filter */}
          <div className="relative">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Severity</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Types</option>
              <option value="LEAKAGE">Leakage</option>
              <option value="WATER_QUALITY_PROBLEM">Water Quality</option>
              <option value="OTHER">Other</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("-");
                setSortBy(field);
                setSortOrder(order as "asc" | "desc");
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="severity-desc">Severity High-Low</option>
              <option value="severity-asc">Severity Low-High</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Reports ({filteredReports.length})
            </h3>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Filtered results</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reporter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {report.issue_type.charAt(0).toUpperCase() +
                          report.issue_type.slice(1).replace("_", " ")}
                      </div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {report.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
                      <span className="max-w-xs truncate" title={getDisplayLocation(report)}>
                        {getDisplayLocation(report)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getSeverityBadgeStyle(
                        report.severity
                      )} capitalize`}
                    >
                      {formatText(report.severity)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-1.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-gray-900" title={report.user?.full_name || report.user?.email || 'Anonymous'}>
                          {report.user?.full_name || report.user?.email || 'Anonymous'}
                          {report.user?.is_banned && <span className="text-red-500 ml-1">(Banned)</span>}
                        </div>
                        {report.user?.full_name && report.user?.email && (
                          <div className="text-xs text-gray-500" title={report.user.email}>
                            {report.user.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={report.status} // This will be 'PENDING', 'IN_PROGRESS', etc.
                      onChange={(e) =>
                        updateReportStatus(report.id, e.target.value as ApiWaterReport["status"])
                      }
                      className={`text-xs font-medium rounded-lg border px-3 py-1.5 focus:outline-none focus:ring-2 appearance-none ${getStatusSelectStyle(
                        report.status
                      )}`}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                      {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/reports/${report.id}`}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No reports found
              </h3>
              <p className="text-sm">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}