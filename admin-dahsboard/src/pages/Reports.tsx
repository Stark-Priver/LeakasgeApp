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
import { supabase } from "../lib/supabase";
import type { WaterReport } from "../lib/supabase";

export function Reports() {
  const [reports, setReports] = useState<WaterReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<WaterReport[]>([]);
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
      const { data, error } = await supabase
        .from("water_reports")
        .select(
          `
          *,
          user:users(email, full_name, is_banned)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Process reports to extract location from coordinates if needed
      const processedReports = await Promise.all(
        (data || []).map(async (report) => {
          // If location_address is empty but we have coordinates, try to get address
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
    } catch (error) {
      console.error("Error fetching reports:", error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  // Reverse geocoding function to get address from coordinates
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      // Using OpenStreetMap Nominatim API (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      
      // Format the address nicely
      const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      return address;
    } catch (error) {
      // Fallback to coordinates if geocoding fails
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const applyFilters = () => {
    let filtered = [...reports];

    // Search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (report) =>
          report.description.toLowerCase().includes(lowerSearchTerm) ||
          (report.location_address || "")
            .toLowerCase()
            .includes(lowerSearchTerm) ||
          (report.location || "")
            .toLowerCase()
            .includes(lowerSearchTerm) ||
          (report.user?.email || "").toLowerCase().includes(lowerSearchTerm) ||
          (report.user?.full_name || "")
            .toLowerCase()
            .includes(lowerSearchTerm) ||
          report.id.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((report) => report.status === statusFilter);
    }

    // Severity filter
    if (severityFilter !== "all") {
      filtered = filtered.filter(
        (report) => report.severity === severityFilter
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((report) => report.issue_type === typeFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "created_at":
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case "severity":
          // Define order for severity
          const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
          aValue = severityOrder[a.severity] || 0;
          bValue = severityOrder[b.severity] || 0;
          break;
        default:
          aValue = a[sortBy as keyof WaterReport];
          bValue = b[sortBy as keyof WaterReport];
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
    newStatus: WaterReport["status"]
  ) => {
    try {
      const { error } = await supabase
        .from("water_reports")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", reportId)
        .select() // Important to get the updated row back for single row updates
        .single();

      if (error) throw error;

      // Update local state
      setReports(
        reports.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status: newStatus,
                updated_at: new Date().toISOString(),
              }
            : report
        )
      );
    } catch (error) {
      console.error("Error updating report status:", error);
      // Optionally, show an error to the user
    }
  };

  // CSV Export functionality
  const exportToCSV = async () => {
    setExporting(true);
    
    try {
      // Prepare data for CSV
      const csvData = filteredReports.map(report => ({
        'Report ID': report.id,
        'Issue Type': formatText(report.issue_type),
        'Description': report.description,
        'Location': report.location_address || report.location || 'N/A',
        'Coordinates': report.latitude && report.longitude 
          ? `${report.latitude}, ${report.longitude}` 
          : 'N/A',
        'Severity': formatText(report.severity),
        'Status': formatText(report.status),
        'Reported By': report.user?.full_name || report.user?.email || 'Anonymous',
        'Created Date': new Date(report.created_at).toLocaleDateString(),
        'Updated Date': new Date(report.updated_at).toLocaleDateString(),
      }));

      // Convert to CSV string
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
    return text
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getSeverityBadgeStyle = (severity: WaterReport["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusSelectStyle = (status: WaterReport["status"]) => {
    switch (status) {
      case "resolved":
        return "bg-green-50 text-green-700 border-green-300 focus:ring-green-500";
      case "in_progress":
        return "bg-blue-50 text-blue-700 border-blue-300 focus:ring-blue-500";
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-300 focus:ring-yellow-500";
      default:
        return "bg-gray-50 text-gray-700 border-gray-300 focus:ring-gray-500";
    }
  };

  const getDisplayLocation = (report: WaterReport) => {
    if (report.location_address) {
      return report.location_address;
    }
    if (report.location) {
      return report.location;
    }
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
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
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
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
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
              <option value="leakage">Leakage</option>
              <option value="water_quality">Water Quality</option>
              <option value="other">Other</option>
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
                      value={report.status}
                      onChange={(e) =>
                        updateReportStatus(report.id, e.target.value)
                      }
                      className={`text-xs font-medium rounded-lg border px-3 py-1.5 focus:outline-none focus:ring-2 appearance-none ${getStatusSelectStyle(
                        report.status
                      )}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                      {new Date(report.created_at).toLocaleDateString()}
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