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
import { WaterIssue } from '@/types/database';
import { Clock, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, MapPin, Calendar } from 'lucide-react-native';

export default function MyReports() {
  const [issues, setIssues] = useState<WaterIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('water_issues')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchIssues();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Low': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'High': return '#f97316';
      case 'Critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock size={16} color="#f59e0b" />;
      case 'In Progress': return <AlertTriangle size={16} color="#3b82f6" />;
      case 'Resolved': return <CheckCircle size={16} color="#10b981" />;
      default: return <Clock size={16} color="#6b7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#fef3c7';
      case 'In Progress': return '#dbeafe';
      case 'Resolved': return '#d1fae5';
      default: return '#f3f4f6';
    }
  };

  const renderIssueItem = ({ item }: { item: WaterIssue }) => (
    <View style={styles.issueCard}>
      <View style={styles.issueHeader}>
        <View style={styles.issueInfo}>
          <Text style={styles.issueType}>{item.type}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            {getStatusIcon(item.status)}
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
          <Text style={styles.severityText}>{item.severity}</Text>
        </View>
      </View>

      {item.image_url && (
        <Image source={{ uri: item.image_url }} style={styles.issueImage} />
      )}

      <Text style={styles.issueDescription}>{item.description}</Text>

      <View style={styles.issueFooter}>
        <View style={styles.footerItem}>
          <MapPin size={14} color="#6b7280" />
          <Text style={styles.footerText}>
            {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Calendar size={14} color="#6b7280" />
          <Text style={styles.footerText}>
            {new Date(item.timestamp).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Clock size={64} color="#d1d5db" />
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
        data={issues}
        keyExtractor={(item) => item.id}
        renderItem={renderIssueItem}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContainer,
          issues.length === 0 && styles.emptyListContainer,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
  issueCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  issueInfo: {
    flex: 1,
    gap: 8,
  },
  issueType: {
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
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  issueImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  issueDescription: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 22,
  },
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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