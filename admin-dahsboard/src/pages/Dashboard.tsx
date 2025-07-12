import React, { useEffect, useState } from "react";
import {
  FileText,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Calendar,
  Navigation,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ApiWaterReport } from "./Reports"; // Use the API report type
import { supabase } from "../lib/supabase"; // Still needed for auth session

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
  const [recentReports, setRecentReports] = useState<ApiWaterReport[]>([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data.session?.access_token;

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      // Fetch all reports
      const reportsResponse = await fetch(`${API_BASE_URL}/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!reportsResponse.ok) {
        const errorData = await reportsResponse.json();
        throw new Error(
          errorData.error ||
            `Failed to fetch reports: ${reportsResponse.statusText}`
        );
      }
      const reportsData: ApiWaterReport[] = await reportsResponse.json();

      // Fetch user count
      const usersCountResponse = await fetch(`${API_BASE_URL}/users/count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!usersCountResponse.ok) {
        const errorData = await usersCountResponse.json();
        throw new Error(
          errorData.error ||
            `Failed to fetch user count: ${usersCountResponse.statusText}`
        );
      }
      const usersCountData: { count: number } = await usersCountResponse.json();

      setStats({
        totalReports: reportsData.length,
        pendingReports: reportsData.filter((r) => r.status === "PENDING")
          .length,
        inProgressReports: reportsData.filter((r) => r.status === "IN_PROGRESS")
          .length,
        resolvedReports: reportsData.filter((r) => r.status === "RESOLVED")
          .length,
        totalUsers: usersCountData.count || 0,
        criticalIssues: reportsData.filter((r) => r.severity === "CRITICAL")
          .length,
      });

      setRecentReports(reportsData.slice(0, 5));
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error.message || error);
      // Optionally set an error state here to display to the user
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: "Total Reports",
      value: stats.totalReports,
      icon: FileText,
      color: "bg-blue-500",
    },
    {
      title: "Pending",
      value: stats.pendingReports,
      icon: Clock,
      color: "bg-yellow-500",
    },
    {
      title: "In Progress",
      value: stats.inProgressReports,
      icon: TrendingUp,
      color: "bg-orange-500",
    },
    {
      title: "Resolved",
      value: stats.resolvedReports,
      icon: CheckCircle,
      color: "bg-green-500",
    },
  ];

  // Note: chartData and pieData are currently static. They would also need to be populated from API if dynamic.
  const chartData = [
    { name: "Jan", reports: 65 },
    { name: "Feb", reports: 78 },
    { name: "Mar", reports: 90 },
    { name: "Apr", reports: 81 },
    { name: "May", reports: 95 },
    { name: "Jun", reports: 88 },
  ];

  const pieData = [
    { name: "Leakage", value: 45, color: "#3B82F6" },
    { name: "Water Quality", value: 30, color: "#10B981" },
    { name: "Other", value: 25, color: "#F59E0B" },
  ];

  const formatText = (text: string | null | undefined, defaultText = "N/A") => {
    if (!text) return defaultText;
    return text
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getSeverityColor = (severity?: ApiWaterReport["severity"]) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status?: ApiWaterReport["status"]) => {
    switch (status) {
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
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
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening with water reports.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 mt-2 md:mt-0">
          <Calendar className="h-4 w-4" />
          <span>
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {statsCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col justify-between h-full hover:shadow-xl transition-shadow duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {card.value}
                </p>
              </div>
              <div className={`p-3.5 rounded-full ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
        <div className="lg:col-span-3 bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-xl font-semibold text-gray-800 mb-1">
            Reports Trend
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Monthly report submissions
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
              <Tooltip wrapperStyle={{ fontSize: "14px" }} />
              <Bar
                dataKey="reports"
                fill="#3B82F6"
                radius={[6, 6, 0, 0]}
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-xl font-semibold text-gray-800 mb-1">
            Issue Types
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Distribution of reported issues
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke={entry.color}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-6 space-y-3">
            {pieData.map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-3 h-3 rounded-full`}
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-gray-600">{entry.name}</span>
                </div>
                <span className="font-medium text-gray-700">
                  {entry.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">
            Recent Reports
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Latest issues submitted by users.
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {recentReports.length === 0 && (
            <p className="p-6 text-gray-500">No recent reports found.</p>
          )}
          {recentReports.map((report) => (
            <div
              key={report.id}
              className="p-5 md:p-6 hover:bg-gray-50 transition-colors duration-150"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 pt-0.5">
                      {report.location_address ? (
                        <Navigation className="h-5 w-5 text-blue-500" />
                      ) : (
                        <MapPin className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-base font-semibold text-gray-800 truncate"
                        title={formatText(report.issue_type)}
                      >
                        {formatText(report.issue_type)}
                      </p>
                      {report.location_address ? (
                        <p
                          className="text-sm text-gray-600 mt-0.5"
                          title={report.location_address}
                        >
                          <span className="font-medium">Address:</span>{" "}
                          {report.location_address}
                        </p>
                      ) : report.latitude && report.longitude ? (
                        <p className="text-sm text-gray-500 mt-0.5">
                          <span className="font-medium">Coords:</span>{" "}
                          {report.latitude.toFixed(4)},{" "}
                          {report.longitude.toFixed(4)}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 mt-0.5 italic">
                          Location not specified
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1.5">
                        By:{" "}
                        {report.user?.full_name ||
                          report.user?.email ||
                          "Anonymous"}{" "}
                        • Submitted:{" "}
                        {new Date(report.createdAt).toLocaleDateString(
                          "en-US",
                          { day: "2-digit", month: "short", year: "numeric" }
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex sm:flex-col items-end sm:items-end gap-2 mt-2 sm:mt-0 flex-shrink-0">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${getSeverityColor(
                      report.severity
                    )} capitalize`}
                    title={`Severity: ${formatText(report.severity)}`}
                  >
                    {formatText(report.severity)}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      report.status
                    )}`}
                    title={`Status: ${formatText(report.status)}`}
                  >
                    {formatText(report.status)}
                  </span>
                </div>
              </div>
              {report.description && (
                <p className="text-sm text-gray-600 mt-2 pl-8 leading-relaxed">
                  <span className="font-medium text-gray-700">
                    Description:
                  </span>{" "}
                  {report.description}
                </p>
              )}
              {/* Removed image_url link as it's replaced by image_base64_data, not suitable for a simple link here */}
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
              <h4 className="text-sm font-medium text-red-800">
                Critical Issues Require Attention
              </h4>
              <p className="text-sm text-red-600 mt-1">
                {stats.criticalIssues} critical issue
                {stats.criticalIssues > 1 ? "s" : ""} need immediate attention.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
