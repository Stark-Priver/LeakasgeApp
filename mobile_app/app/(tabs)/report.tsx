import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { WaterReportInsert } from '@/types/database'; // Updated type
import { Camera, MapPin, Image as ImageIcon, Upload, AlertCircle } from 'lucide-react-native';

// Standardized issue types and severity levels
const issueTypes = [
  { label: 'Leakage', value: 'leakage' },
  { label: 'Water Quality Problem', value: 'water_quality_problem' },
  { label: 'Other', value: 'other' },
];
const severityLevels = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
];

export default function Report() {
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [selectedSeverity, setSelectedSeverity] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<Location.LocationObject | null>(null);
  const [manualLocationAddress, setManualLocationAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Request permissions on component mount or specific actions
    (async () => {
      if (Platform.OS !== 'web') {
        const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
        const locationPerm = await Location.requestForegroundPermissionsAsync();
        if (cameraPerm.status !== 'granted' || locationPerm.status !== 'granted') {
          Alert.alert(
            'Permissions Required',
            'Camera and location permissions are needed for full functionality. You can grant them in settings.'
          );
        }
      }
    })();
  }, []);

  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required to get current location.');
      return;
    }

    try {
      setIsSubmitting(true); // Show loading indicator
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setGpsLocation(location);
      setManualLocationAddress(''); // Clear manual address if GPS is fetched
      Alert.alert('Success', 'Location captured successfully!');
    } catch (error) {
      console.error('Failed to get current location:', error);
      Alert.alert('Error', 'Failed to get current location. Please try again or enter manually.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Media library permission is required to pick an image.');
        return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7, // Slightly reduced quality for faster uploads
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setUploadError(null); // Clear previous upload error
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
     if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take a photo.');
        return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setUploadError(null); // Clear previous upload error
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    if (!uri) return null;
    setUploadError(null);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop();
      const fileName = `report-${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`; // Organize by user ID

      const { data, error: uploadError } = await supabase.storage
        .from('issuesimages') // Corrected bucket name
        .upload(filePath, blob, {
            contentType: blob.type, // Important for correct file handling
            upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('issuesimages')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setUploadError(`Image upload failed: ${error.message}. Report will be submitted without image.`);
      return null; // Return null on failure
    }
  };

  const submitReport = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to submit a report.');
      return;
    }
    if (!selectedType || !selectedSeverity || !description.trim()) {
      Alert.alert('Error', 'Please fill in Issue Type, Severity, and Description.');
      return;
    }
    if (!gpsLocation && !manualLocationAddress.trim()) {
      Alert.alert('Error', 'Please provide your location (either GPS or manual address).');
      return;
    }

    setIsSubmitting(true);
    setUploadError(null);
    let imageUrl: string | null = null;

    if (imageUri) {
      imageUrl = await uploadImage(imageUri);
      // If uploadError state was set by uploadImage, it will be displayed.
      // No need to Alert here again, proceed with submission.
    }

    const reportData: WaterReportInsert = {
      user_id: user.id,
      issue_type: selectedType as WaterReportInsert['issue_type'],
      description: description.trim(),
      severity: selectedSeverity as WaterReportInsert['severity'],
      image_url: imageUrl,
      latitude: gpsLocation?.coords.latitude,
      longitude: gpsLocation?.coords.longitude,
      location_address: manualLocationAddress.trim() || null,
      // status is usually set by backend/db default to 'pending'
    };

    try {
      const { error } = await supabase
        .from('water_reports') // Corrected table name
        .insert([reportData]);

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Report submitted successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
      // Reset form
      setSelectedType(undefined);
      setSelectedSeverity(undefined);
      setDescription('');
      setImageUri(null);
      setGpsLocation(null);
      setManualLocationAddress('');

    } catch (error: any) {
      console.error('Error submitting report:', error);
      Alert.alert('Submission Error', `Failed to submit report: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityColor = (severityValue: string | undefined) => {
    switch (severityValue) {
      case 'low': return '#10b981'; // Green
      case 'medium': return '#f59e0b'; // Yellow
      case 'high': return '#f97316'; // Orange
      case 'critical': return '#ef4444'; // Red
      default: return '#d1d5db'; // Default gray for border
    }
  };

  const getSeverityBackgroundColor = (severityValue: string | undefined) => {
     return selectedSeverity === severityValue ? getSeverityColor(severityValue) : '#ffffff';
  }

  const getSeverityTextColor = (severityValue: string | undefined) => {
    return selectedSeverity === severityValue ? '#ffffff' : '#374151';
  }


  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Report Water Issue</Text>
          <Text style={styles.subtitle}>Help us improve water system management.</Text>
        </View>

        <View style={styles.form}>
          {/* Issue Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Issue Type *</Text>
            <View style={styles.optionsContainer}>
              {issueTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.optionButton,
                    selectedType === type.value && styles.optionButtonSelected,
                  ]}
                  onPress={() => setSelectedType(type.value)}
                >
                  <Text style={[styles.optionText, selectedType === type.value && styles.optionTextSelected]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Severity Level */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Severity Level *</Text>
            <View style={styles.optionsContainer}>
              {severityLevels.map((severity) => (
                <TouchableOpacity
                  key={severity.value}
                  style={[
                    styles.severityButton,
                    {
                      backgroundColor: getSeverityBackgroundColor(severity.value),
                      borderColor: getSeverityColor(severity.value)
                    },
                  ]}
                  onPress={() => setSelectedSeverity(severity.value)}
                >
                  <Text style={[styles.severityText, { color: getSeverityTextColor(severity.value) }]}>
                    {severity.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Provide a detailed description of the issue..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Photo Evidence */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photo Evidence</Text>
            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <View style={styles.imageActions}>
                    <TouchableOpacity style={styles.changeImageButton} onPress={pickImage}>
                        <ImageIcon size={18} color="#2563EB" />
                        <Text style={styles.changeImageText}>Change</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.removeImageButton} onPress={() => {setImageUri(null); setUploadError(null)}}>
                        <Text style={styles.removeImageText}>Remove</Text>
                    </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.photoButtonsContainer}>
                <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                  <Camera size={22} color="#2563EB" />
                  <Text style={styles.photoButtonText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                  <ImageIcon size={22} color="#2563EB" />
                  <Text style={styles.photoButtonText}>From Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
            {uploadError && (
              <View style={styles.uploadErrorContainer}>
                <AlertCircle size={16} color="#ef4444" />
                <Text style={styles.uploadErrorText}>{uploadError}</Text>
              </View>
            )}
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location *</Text>
            <TouchableOpacity
              style={[
                styles.locationButton,
                gpsLocation && styles.locationButtonSuccess,
              ]}
              onPress={getCurrentLocation}
              disabled={isSubmitting}
            >
              <MapPin size={20} color={gpsLocation ? '#10b981' : '#2563EB'} />
              <Text style={[styles.locationButtonText, gpsLocation && styles.locationButtonTextSuccess]}>
                {gpsLocation ? 'GPS Location Captured' : 'Get Current GPS Location'}
              </Text>
            </TouchableOpacity>
            {gpsLocation && (
              <Text style={styles.locationDetailsText}>
                Lat: {gpsLocation.coords.latitude.toFixed(5)}, Lon: {gpsLocation.coords.longitude.toFixed(5)}
              </Text>
            )}
            <Text style={styles.orText}>Or enter address manually:</Text>
            <TextInput
              style={styles.inputField}
              placeholder="e.g., 123 Main St, Anytown"
              value={manualLocationAddress}
              onChangeText={(text) => {
                setManualLocationAddress(text);
                if (text.trim().length > 0) setGpsLocation(null); // Clear GPS if manual is typed
              }}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, (isSubmitting) && styles.submitButtonDisabled]}
            onPress={submitReport}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Upload size={20} color="#ffffff" />
            )}
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb', // Lighter gray
  },
  scrollContent: {
    paddingBottom: 30, // Ensure scroll content doesn't hide behind nav
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Inter-Bold', // Make sure this font is loaded
    color: '#111827', // Darker text
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Regular', // Make sure this font is loaded
    color: '#4b5563', // Softer gray
  },
  form: {
    paddingHorizontal: 20,
    gap: 22, // Consistent gap
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold', // Make sure this font is loaded
    color: '#374151',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  optionButtonSelected: {
    backgroundColor: '#2563EB', // Tailwind blue-600
    borderColor: '#2563EB',
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium', // Make sure this font is loaded
    color: '#374151',
  },
  optionTextSelected: {
    color: '#ffffff',
  },
  severityButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5, // Slightly thicker border for emphasis
    // backgroundColor is dynamic
  },
  severityText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    // color is dynamic
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#1f2937',
    minHeight: 120, // Increased height
    textAlignVertical: 'top',
  },
  imagePreviewContainer: {
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  imagePreview: {
    width: '100%',
    height: 220, // Larger preview
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#e0e7ff', // Lighter blue for less emphasis than main action
  },
  changeImageText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
  },
  removeImageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#fee2e2', // Lighter red
  },
  removeImageText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#ef4444', // Red color for remove
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14, // Slightly more padding
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
    backgroundColor: '#eff6ff', // Very light blue
  },
  photoButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
  },
  uploadErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fee2e2', // Light red background for error
    borderRadius: 6,
  },
  uploadErrorText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#b91c1c', // Darker red text
    flexShrink: 1, // Allow text to wrap
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
    backgroundColor: '#eff6ff',
  },
  locationButtonSuccess: {
    borderColor: '#10b981', // Green border for success
    backgroundColor: '#f0fdf4', // Light green background
  },
  locationButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
  },
  locationButtonTextSuccess: {
    color: '#059669', // Darker green text
  },
  locationDetailsText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 4,
  },
  orText: {
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  inputField: { // General purpose input field style
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#1f2937',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2563EB',
    borderRadius: 10, // Slightly more rounded
    paddingVertical: 16, // More padding
    marginTop: 10, // Margin from last element
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  submitButtonDisabled: {
    backgroundColor: '#93c5fd', // Lighter blue when disabled
    opacity: 0.8,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});