import { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { WaterIssueInsert } from '@/types/database';
import { Camera, MapPin, Image as ImageIcon, Upload } from 'lucide-react-native';

const issueTypes = ['Leakage', 'Water Quality Problem', 'Other'];
const severityLevels = ['Low', 'Medium', 'High', 'Critical'];

export default function Report() {
  const [selectedType, setSelectedType] = useState('');
  const [selectedSeverity, setSeverity] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (cameraStatus !== 'granted' || locationStatus !== 'granted') {
      Alert.alert('Permissions Required', 'Camera and location permissions are required to report issues.');
      return false;
    }
    return true;
  };

  const getCurrentLocation = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(location);
      Alert.alert('Success', 'Location captured successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `water-issue-${Date.now()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('water-issues')
        .upload(fileName, blob);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('water-issues')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const submitReport = async () => {
    if (!selectedType || !selectedSeverity || !description || !location || !user) {
      Alert.alert('Error', 'Please fill in all fields and capture your location');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = null;
      if (imageUri) {
        try {
          console.log('Uploading image with URI:', imageUri);
          imageUrl = await uploadImage(imageUri);
        } catch (imgErr) {
          console.error('Image upload failed:', imgErr);
          Alert.alert('Warning', 'Image upload failed, submitting report without image.');
        }
      }
      const issueData: WaterIssueInsert = {
        user_id: user.id,
        type: selectedType as any,
        description,
        severity: selectedSeverity as any,
        image_url: imageUrl,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      console.log('Submitting issue data:', issueData);
      const { error } = await supabase
        .from('water_issues')
        .insert([issueData]);

      if (error) throw error;

      Alert.alert('Success', 'Issue reported successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report');
      console.error('Error submitting report:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Report Water Issue</Text>
          <Text style={styles.subtitle}>Help us keep water systems running smoothly</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Issue Type</Text>
            <View style={styles.optionsContainer}>
              {issueTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.optionButton,
                    selectedType === type && styles.optionButtonSelected,
                  ]}
                  onPress={() => setSelectedType(type)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedType === type && styles.optionTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Severity Level</Text>
            <View style={styles.optionsContainer}>
              {severityLevels.map((severity) => (
                <TouchableOpacity
                  key={severity}
                  style={[
                    styles.severityButton,
                    selectedSeverity === severity && [
                      styles.severityButtonSelected,
                      { backgroundColor: getSeverityColor(severity) },
                    ],
                  ]}
                  onPress={() => setSeverity(severity)}
                >
                  <Text
                    style={[
                      styles.severityText,
                      selectedSeverity === severity && styles.severityTextSelected,
                    ]}
                  >
                    {severity}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe the water issue in detail..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photo Evidence</Text>
            {imageUri ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.changeImageButton}
                  onPress={pickImage}
                >
                  <Text style={styles.changeImageText}>Change Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoButtons}>
                <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                  <Camera size={24} color="#2563EB" />
                  <Text style={styles.photoButtonText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                  <ImageIcon size={24} color="#2563EB" />
                  <Text style={styles.photoButtonText}>Choose from Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <TouchableOpacity
              style={[
                styles.locationButton,
                location && styles.locationButtonSuccess,
              ]}
              onPress={getCurrentLocation}
            >
              <MapPin size={20} color={location ? '#10b981' : '#2563EB'} />
              <Text
                style={[
                  styles.locationButtonText,
                  location && styles.locationButtonTextSuccess,
                ]}
              >
                {location ? 'Location Captured' : 'Get Current Location'}
              </Text>
            </TouchableOpacity>
            {location && (
              <Text style={styles.locationDetails}>
                Lat: {location.coords.latitude.toFixed(6)}, 
                Lon: {location.coords.longitude.toFixed(6)}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={submitReport}
            disabled={loading}
          >
            <Upload size={20} color="#ffffff" />
            <Text style={styles.submitButtonText}>
              {loading ? 'Submitting...' : 'Submit Report'}
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
  form: {
    padding: 24,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  optionButtonSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  optionTextSelected: {
    color: '#ffffff',
  },
  severityButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  severityButtonSelected: {
    borderColor: 'transparent',
  },
  severityText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  severityTextSelected: {
    color: '#ffffff',
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1f2937',
    minHeight: 100,
  },
  imageContainer: {
    alignItems: 'center',
    gap: 12,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  changeImageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  changeImageText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
    backgroundColor: '#ffffff',
  },
  photoButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
    backgroundColor: '#ffffff',
  },
  locationButtonSuccess: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  locationButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
  },
  locationButtonTextSuccess: {
    color: '#10b981',
  },
  locationDetails: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});