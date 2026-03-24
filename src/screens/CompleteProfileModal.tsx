import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { updateProfile } from '../api/authApi';
import { uploadFile } from '../api/uploadApi';

const CompleteProfileModal = ({ visible, onClose, onComplete }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [fileId, setFileId] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async () => {
    if (!name || !email || !address) {
      Alert.alert('Required', 'Please fill all details');
      return;
    }

    setLoading(true);

    const res = await updateProfile({
      name,
      email,
      address,
      idProof: fileId, // ✅ IMPORTANT
    });

    setLoading(false);

    if (res.success) {
      onComplete();
      onClose();
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

          <TouchableOpacity style={styles.uploadBtn} onPress={handlePickFile}>
            <Text style={styles.uploadText}>
              {fileName ? fileName : 'Choose File'}
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