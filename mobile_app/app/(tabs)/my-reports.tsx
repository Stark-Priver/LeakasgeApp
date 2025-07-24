import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ScrollView,
  ActivityIndicator, // Added ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient, WaterReport, User } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import {
  Clock,
  TriangleAlert as AlertTriangle,
  CircleCheck as CheckCircle,
  MapPin,
  Calendar,
  Image as ImageIcon,
  Images,
} from 'lucide-react-native'; // Added ImageIcon

// API base URL should be available from environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export default function MyReports() {
  const [reports, setReports] = useState<WaterReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null); // For displaying API errors
  const { user } = useAuth();

  useEffect(() => {
    if (user && API_BASE_URL) {
      // Ensure user and API_BASE_URL are available
      fetchReports();
    } else if (!API_BASE_URL) {
      console.error(
        'API_BASE_URL is not defined. Check environment variables.'
      );
      setFetchError('Configuration error: API URL is missing.');
      setLoading(false);
    }
  }, [user, API_BASE_URL]);

  const fetchReports = async () => {
    if (!user || !API_BASE_URL) {
      console.log('Debug: Missing user or API_BASE_URL', { user: !!user, API_BASE_URL });
      setFetchError(
        'Cannot fetch reports: User not authenticated or API URL missing.'
      );
      setLoading(false);
      setRefreshing(false);
      return;
    }

    console.log('Debug: Fetching reports for user:', user.email);
    setLoading(true);
    setFetchError(null); // Clear previous errors

    try {
      // Use the apiClient to fetch user reports - the endpoint already filters by user
      const userReports = await apiClient.getReports();
      console.log('Debug: Received reports:', userReports.length);
      setReports(userReports || []);
    } catch (error: any) {
      console.error('Error fetching reports from API:', error);
      setFetchError(
        error.message || 'An unknown error occurred while fetching reports.'
      );
      setReports([]); // Clear reports on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports(); // Renamed from fetchIssues
  };

  const formatTitleCase = (str: string | null | undefined) => {
    if (!str) return 'N/A';
    return str
      .replace(/_/g, ' ')
      .replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
  };

  const getSeverityColor = (severity: WaterReport['severity'] | undefined) => {
    switch (severity) {
      case 'LOW':
        return '#10b981'; // Green-500
      case 'MEDIUM':
        return '#f59e0b'; // Amber-500
      case 'HIGH':
        return '#f97316'; // Orange-500
      case 'CRITICAL':
        return '#ef4444'; // Red-500
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: WaterReport['status'] | undefined) => {
    switch (status) {
      case 'PENDING':
        return <Clock size={16} color="#d97706" />; // Amber-600
      case 'IN_PROGRESS':
        return <AlertTriangle size={16} color="#2563eb" />; // Blue-600
      case 'RESOLVED':
        return <CheckCircle size={16} color="#059669" />; // Green-600
      default:
        return <Clock size={16} color="#4b5563" />; // Gray-600
    }
  };

  const getStatusBackgroundColor = (
    status: WaterReport['status'] | undefined
  ) => {
    switch (status) {
      case 'PENDING':
        return '#fef3c7'; // Amber-100
      case 'IN_PROGRESS':
        return '#dbeafe'; // Blue-100
      case 'RESOLVED':
        return '#d1fae5'; // Green-100
      default:
        return '#f3f4f6'; // Gray-100
    }
  };

  const renderReportItem = ({ item }: { item: WaterReport }) => {
    const displayLocation = item.location_address
      ? item.location_address
      : item.latitude && item.longitude
      ? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`
      : 'Location not specified';

    return (
      <View style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <View style={styles.reportInfo}>
            <Text style={styles.reportIssueType}>
              {formatTitleCase(item.issue_type)}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusBackgroundColor(item.status) },
              ]}
            >
              {getStatusIcon(item.status)}
              <Text style={styles.statusText}>
                {formatTitleCase(item.status)}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.severityBadge,
              { backgroundColor: getSeverityColor(item.severity) },
            ]}
          >
            <Text style={styles.severityText}>
              {formatTitleCase(item.severity)}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.reportDescription}>{item.description}</Text>
        )}

        {/* Display images from image_base64_data */}
        {item.image_base64_data && item.image_base64_data.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageScrollView}
          >
            {item.image_base64_data.map((base64String, index) => (
              <Image
                key={index}
                source={{ uri: base64String }} // React Native Image can handle data URIs
                style={styles.reportImage}
              />
            ))}
          </ScrollView>
        )}

        <View style={styles.reportFooter}>
          <View style={styles.footerItem}>
            <MapPin size={14} color="#6b7280" />
            <Text
              style={styles.footerText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {displayLocation}
            </Text>
          </View>
          <View style={styles.footerItem}>
            <Calendar size={14} color="#6b7280" />
            <Text style={styles.footerText}>
              {(() => {
                try {
                  const date = new Date(item.createdAt);
                  return isNaN(date.getTime())
                    ? 'Invalid date'
                    : date.toLocaleDateString();
                } catch (error) {
                  return 'Invalid date';
                }
              })()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (loading && !refreshing) {
      // Don't show empty state if it's the initial load
      return null;
    }
    if (fetchError) {
      return (
        <View style={styles.emptyContainer}>
          <AlertTriangle size={64} color="#ef4444" />
          <Text style={styles.emptyTitle}>Error Fetching Reports</Text>
          <Text style={styles.errorText}>{fetchError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchReports}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    // Only show "No reports yet" if not loading and no error
    if (!loading) {
      return (
        <View style={styles.emptyContainer}>
          <Images size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No reports yet</Text>
          <Text style={styles.emptyText}>
            Your reported water issues will appear here.
          </Text>
        </View>
      );
    }
    return null; // Should not be reached if loading is handled above, but as a fallback
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Reports</Text>
        <Text style={styles.subtitle}>Track your submitted water issues</Text>
      </View>

      {loading && !refreshing && reports.length === 0 ? (
        <View style={styles.fullScreenLoader}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item._id}
          renderItem={renderReportItem}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={[
            styles.listContainer,
            (reports.length === 0 || fetchError) && styles.emptyListContainer,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563eb']}
              tintColor={'#2563eb'}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  listContainer: {
    padding: 24,
    gap: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  reportCard: {
    // Renamed from issueCard
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12, // Applied gap here for overall spacing within card
  },
  reportHeader: {
    // Renamed from issueHeader
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reportInfo: {
    // Renamed from issueInfo
    flex: 1, // Takes available space
    gap: 8,
  },
  reportIssueType: {
    // Renamed from issueType
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start', // Important to keep badge size to its content
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#374151', // Darker text for better contrast on light badges
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  severityText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  imageScrollView: {
    marginTop: 4, // Add some space above the image scroll view
    marginBottom: 4, // Add some space below the image scroll view
  },
  reportImage: {
    // Renamed from issueImage
    width: 100, // Smaller width for scrolled images
    height: 100, // Smaller height for scrolled images
    borderRadius: 8,
    marginRight: 10, // Space between images in scroll view
    backgroundColor: '#f3f4f6', // Placeholder color
  },
  singleReportImage: {
    // Style for when there's only one image (fallback)
    width: '100%',
    height: 200, // Larger for single image
    marginRight: 0, // No margin if it's the only one
  },
  reportDescription: {
    // Renamed from issueDescription
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 22,
  },
  reportFooter: {
    // Renamed from issueFooter
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Align items vertically in the footer
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorText: {
    // Style for error messages
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#ef4444', // Red color for errors
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  retryButton: {
    // Style for retry button
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  fullScreenLoader: {
    // Style for full screen loader
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc', // Match container background
  },
});
