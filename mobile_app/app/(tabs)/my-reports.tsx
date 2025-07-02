import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { WaterReport } from '@/types/database'; // Changed from WaterIssue to WaterReport
import { Clock, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, MapPin, Calendar, Image as ImageIcon, Images } from 'lucide-react-native'; // Added ImageIcon

export default function MyReports() {
  const [reports, setReports] = useState<WaterReport[]>([]); // Changed from issues to reports
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) { // Ensure user is available before fetching
      fetchReports();
    }
  }, [user]); // Add user as a dependency

  const fetchReports = async () => { // Renamed from fetchIssues
    if (!user) return;
    setLoading(true); // Ensure loading is true at the start of a fetch
    try {
      const { data, error } = await supabase
        .from('water_reports') // Changed from water_issues to water_reports
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }); // Changed from timestamp to created_at

      if (error) throw error;
      setReports(data || []); // Changed from setIssues to setReports
    } catch (error) {
      console.error('Error fetching reports:', error);
      // Consider setting an error state here to display to the user
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
    return str.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };

  const getSeverityColor = (severity: WaterReport['severity'] | undefined) => {
    switch (severity) {
      case 'low': return '#10b981';      // Green-500
      case 'medium': return '#f59e0b';   // Amber-500
      case 'high': return '#f97316';     // Orange-500
      case 'critical': return '#ef4444'; // Red-500
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: WaterReport['status'] | undefined) => {
    switch (status) {
      case 'pending': return <Clock size={16} color="#d97706" />;        // Amber-600
      case 'in_progress': return <AlertTriangle size={16} color="#2563eb" />; // Blue-600
      case 'resolved': return <CheckCircle size={16} color="#059669" />;  // Green-600
      default: return <Clock size={16} color="#4b5563" />;        // Gray-600
    }
  };

  const getStatusBackgroundColor = (status: WaterReport['status'] | undefined) => {
    switch (status) {
      case 'pending': return '#fef3c7';    // Amber-100
      case 'in_progress': return '#dbeafe'; // Blue-100
      case 'resolved': return '#d1fae5';   // Green-100
      default: return '#f3f4f6';       // Gray-100
    }
  };

  const renderReportItem = ({ item }: { item: WaterReport }) => {
    const displayLocation = item.location_address
      ? item.location_address
      : (item.latitude && item.longitude)
        ? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`
        : 'Location not specified';

    return (
      <View style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <View style={styles.reportInfo}>
            <Text style={styles.reportIssueType}>{formatTitleCase(item.issue_type)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusBackgroundColor(item.status) }]}>
              {getStatusIcon(item.status)}
              <Text style={styles.statusText}>{formatTitleCase(item.status)}</Text>
            </View>
          </View>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
            <Text style={styles.severityText}>{formatTitleCase(item.severity)}</Text>
          </View>
        </View>

        {item.description && <Text style={styles.reportDescription}>{item.description}</Text>}

        {(item.image_urls && item.image_urls.length > 0) ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScrollView}>
            {item.image_urls.map((url, index) => (
              <Image key={index} source={{ uri: url }} style={styles.reportImage} />
            ))}
          </ScrollView>
        ) : item.image_url ? ( // Fallback for single image_url
          <Image source={{ uri: item.image_url }} style={[styles.reportImage, styles.singleReportImage]} />
        ) : null}


        <View style={styles.reportFooter}>
          <View style={styles.footerItem}>
            <MapPin size={14} color="#6b7280" />
            <Text style={styles.footerText} numberOfLines={1} ellipsizeMode="tail">{displayLocation}</Text>
          </View>
          <View style={styles.footerItem}>
            <Calendar size={14} color="#6b7280" />
            <Text style={styles.footerText}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Images size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No reports yet</Text>
      <Text style={styles.emptyText}>
        Your reported water issues will appear here
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Reports</Text>
        <Text style={styles.subtitle}>Track your submitted water issues</Text>
      </View>

      <FlatList
        data={reports} // Changed from issues to reports
        keyExtractor={(item) => item.id}
        renderItem={renderReportItem} // Changed from renderIssueItem
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContainer,
          reports.length === 0 && styles.emptyListContainer, // Changed from issues to reports
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} tintColor={'#2563eb'}/>
        }
      />
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
  reportCard: { // Renamed from issueCard
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12, // Applied gap here for overall spacing within card
  },
  reportHeader: { // Renamed from issueHeader
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reportInfo: { // Renamed from issueInfo
    flex: 1, // Takes available space
    gap: 8,
  },
  reportIssueType: { // Renamed from issueType
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
  reportImage: { // Renamed from issueImage
    width: 100, // Smaller width for scrolled images
    height: 100, // Smaller height for scrolled images
    borderRadius: 8,
    marginRight: 10, // Space between images in scroll view
    backgroundColor: '#f3f4f6', // Placeholder color
  },
  singleReportImage: { // Style for when there's only one image (fallback)
    width: '100%',
    height: 200, // Larger for single image
    marginRight: 0, // No margin if it's the only one
  },
  reportDescription: { // Renamed from issueDescription
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 22,
  },
  reportFooter: { // Renamed from issueFooter
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
});