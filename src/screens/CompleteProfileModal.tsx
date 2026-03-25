import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { updateProfile } from '../api/authApi';
import { uploadFile } from '../api/uploadApi';

const CompleteProfileModal = ({ visible, onClose, onComplete, profile }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [fileId, setFileId] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);

  // Prefill the form if user already has partial profile data saved
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
      setAddress(profile.address || '');
      setFileId(profile.idProof || '');
    }
  }, [profile]);

  // 📁 Pick + Upload file
  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({});

    if (!result.canceled) {
      const file = result.assets[0];

      try {
        setLoading(true);

        const res = await uploadFile(file);

        // 🔥 adjust based on your API response
        setFileId(res.fileId || res.url || '');
        setFileName(file.name);

        setLoading(false);
      } catch (error) {
        setLoading(false);
        Alert.alert('Error', 'File upload failed');
      }
    }
  };

  // 📷 Take Photo using Camera
  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Camera access is needed to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const file = {
        uri: asset.uri,
        name: asset.fileName || asset.uri.split('/').pop() || 'camera_image.jpg',
        mimeType: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
      };

      try {
        setLoading(true);
        const res = await uploadFile(file);
        setFileId(res.fileId || res.url || '');
        setFileName(file.name);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        Alert.alert('Error', 'File upload failed');
      }
    }
  };

  const handleUploadChoice = () => {
    Alert.alert('Upload ID Proof', 'Choose an option', [
      { text: 'Take Photo', onPress: handleTakePhoto },
      { text: 'Choose from Gallery', onPress: handlePickFile },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSubmit = async () => {
    if (!name || !email || !address) {
      Alert.alert('Required', 'Please fill all details');
      return;
    }

    setLoading(true);

    const payload: any = {
      name,
      email,
      address,
    };

    if (fileId) {
      payload.idProof = fileId;
    }

    const res = await updateProfile(payload);

    setLoading(false);

    if (res.success) {
      onComplete();
      onClose();
    } else {
      Alert.alert('Error', res.message || 'Failed to save profile');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>Help us serve you better</Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Address"
            multiline
            value={address}
            onChangeText={setAddress}
          />

          {/* ✅ ID PROOF SECTION */}
          <Text style={styles.label}>ID Proof</Text>

          {fileId ? (
            <Image source={{ uri: fileId }} style={styles.idProofImage} resizeMode="contain" />
          ) : null}

          <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadChoice}>
            <Text style={styles.uploadText}>
              {fileName ? fileName : (fileId ? 'Replace Uploaded File' : 'Choose File')}
            </Text>
          </TouchableOpacity>

          <Text style={styles.helper}>
            Aadhaar / Voter ID / Passport (Max 5MB)
          </Text>

          {/* BUTTONS */}
          <View style={styles.row}>
            <TouchableOpacity style={styles.skipBtn} onPress={onClose}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Save Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CompleteProfileModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  subtitle: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 12,
  },

  input: {
    backgroundColor: '#eee',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },

  label: {
    fontWeight: 'bold',
    marginBottom: 5,
  },

  idProofImage: {
    width: '100%',
    height: 150,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },

  uploadBtn: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 5,
  },

  uploadText: {
    color: '#000',
  },

  helper: {
    fontSize: 12,
    color: '#999',
    marginBottom: 15,
  },

  row: {
    flexDirection: 'row',
    gap: 10,
  },

  skipBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },

  skipText: {
    color: '#666',
    fontWeight: 'bold',
  },

  submitBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#000',
    alignItems: 'center',
  },

  submitText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});