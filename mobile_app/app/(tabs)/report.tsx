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
import { supabase } from '@/lib/supabase'; // Keep for image uploads for now
import { useAuth } from '@/hooks/useAuth';
// WaterReportInsert might not be fully compatible, define specific payload type
// import { WaterReportInsert } from '@/types/database';
import { Camera, MapPin, Image as ImageIcon, Upload, AlertCircle } from 'lucide-react-native';

// API base URL - replace with your actual API URL, possibly from .env
const API_BASE_URL = 'https://leakasge-app.vercel.app/api';

// Interface for the data payload to the API
interface ApiReportPayload {
  issue_type: string; // e.g., LEAKAGE
  severity: string;   // e.g., HIGH
  description: string;
  location_address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image_urls?: string[] | null;
  // user_id is added by the backend using the token
}


// Standardized issue types and severity levels for UI
// Values will be converted to UPPERCASE for API
const issueTypes = [
  { label: 'Leakage', value: 'leakage' }, // API expects LEAKAGE
  { label: 'Water Quality Problem', value: 'water_quality_problem' }, // API expects WATER_QUALITY_PROBLEM
  { label: 'Other', value: 'other' }, // API expects OTHER
];
const severityLevels = [
  { label: 'Low', value: 'low' }, // API expects LOW
  { label: 'Medium', value: 'medium' }, // API expects MEDIUM
  { label: 'High', value: 'high' }, // API expects HIGH
  { label: 'Critical', value: 'critical' }, // API expects CRITICAL
];

export default function Report() {
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [selectedSeverity, setSelectedSeverity] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]); // Changed from imageUri to imageUris
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
      //setImageUri(result.assets[0].uri);
      setImageUris(prevUris => [...prevUris, result.assets[0].uri]);
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
      //setImageUri(result.assets[0].uri);
      setImageUris(prevUris => [...prevUris, result.assets[0].uri]);
      setUploadError(null); // Clear previous upload error
    }
  };

  const removeImage = (uriToRemove: string) => {
    setImageUris(prevUris => prevUris.filter(uri => uri !== uriToRemove));
  };

  const uploadImages = async (uris: string[]): Promise<string[]> => {
    if (!uris || uris.length === 0) return [];
    setUploadError(null);
    const uploadedUrls: string[] = [];
    let anyUploadFailed = false;

    for (const uri of uris) {
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const fileExt = uri.split('.').pop();
        const fileName = `report-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user?.id || 'anonymous'}/${fileName}`; // Organize by user ID

        const { error: uploadError } = await supabase.storage
          .from('issuesimages')
          .upload(filePath, blob, {
              contentType: blob.type,
              upsert: false
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('issuesimages')
          .getPublicUrl(filePath);

        if (publicUrl) {
          uploadedUrls.push(publicUrl);
        } else {
          console.warn('Successfully uploaded image but failed to get public URL for:', uri);
          // anyUploadFailed = true; // Decide if this constitutes a failure
        }
      } catch (error: any) {
        console.error('Error uploading image:', error);
        anyUploadFailed = true;
        // Continue trying to upload other images
      }
    }
    if (anyUploadFailed) {
        setUploadError(`One or more images failed to upload. Report will be submitted with successfully uploaded images.`);
    }
    return uploadedUrls;
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
    let uploadedImageUrls: string[] = [];

    if (imageUris.length > 0) {
      uploadedImageUrls = await uploadImages(imageUris);
      // uploadImages function sets uploadError state if any image fails.
    }

    // Prepare data for the API
    // Ensure selectedType and selectedSeverity are defined before using them
    if (!selectedType || !selectedSeverity) {
      Alert.alert('Error', 'Issue Type and Severity must be selected.');
      setIsSubmitting(false);
      return;
    }

    const reportData: ApiReportPayload = {
      issue_type: selectedType.toUpperCase(), // Convert to UPPERCASE
      severity: selectedSeverity.toUpperCase(), // Convert to UPPERCASE
      description: description.trim(),
      image_urls: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined, // API expects array or undefined
      latitude: gpsLocation?.coords.latitude,
      longitude: gpsLocation?.coords.longitude,
      location_address: manualLocationAddress.trim() || undefined, // API expects string or undefined
    };

    try {
      // Retrieve session for auth token
      const session = await supabase.auth.getSession();
      const token = session?.data.session?.access_token;

      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(reportData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Use error message from API if available, otherwise default
        throw new Error(responseData.error || `Server responded with ${response.status}`);
      }

      Alert.alert('Success', 'Report submitted successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
      // Reset form
      setSelectedType(undefined);
      setSelectedSeverity(undefined);
      setDescription('');
      setImageUris([]);
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
            <Text style={styles.sectionTitle}>Photo Evidence ({imageUris.length} image{imageUris.length === 1 ? '' : 's'})</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewsScrollView}>
              {imageUris.map((uri, index) => (
                <View key={index} style={styles.imagePreviewItem}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(uri)}>
                    <Text style={styles.removeImageButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            {imageUris.length < 5 && ( // Limit to 5 images for example
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
            {imageUris.length > 0 && imageUris.length >= 5 && (
                <Text style={styles.maxImagesText}>Maximum 5 images allowed.</Text>
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
  imagePreviewsScrollView: {
    paddingVertical: 10,
  },
  imagePreviewItem: {
    position: 'relative',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden', // Ensures the remove button corners are clipped if it overlaps
  },
  imagePreview: {
    width: 120, // Fixed width for horizontal scroll items
    height: 120, // Fixed height for horizontal scroll items
    borderRadius: 8, // Match item container
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 20, // Adjust for better vertical centering of '✕'
  },
  maxImagesText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
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