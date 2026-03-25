import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { updateProfile } from '../api/authApi';
import { uploadFile } from '../api/uploadApi';

const ProfileScreen = ({ profile, navigation }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    idProof: profile?.idProof || '',
  });

  const [fileName, setFileName] = useState('');

  // Keep form in sync when the profile prop updates
  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        idProof: profile.idProof || '',
      });
    }
  }, [profile]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.replace('Login');
  };

  // 📁 Upload ID Proof
  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({});

    if (!result.canceled) {
      const file = result.assets[0];

      try {
        setLoading(true);

        const res = await uploadFile(file);

        setForm(prev => ({
          ...prev,
          idProof: res.fileId || res.url,
        }));

        setFileName(file.name);
      } catch (error) {
        Alert.alert('Error', 'File upload failed');
      } finally {
        setLoading(false);
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

        setForm(prev => ({
          ...prev,
          idProof: res.fileId || res.url,
        }));

        setFileName(file.name);
      } catch (error) {
        Alert.alert('Error', 'File upload failed');
      } finally {
        setLoading(false);
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

  //  Save Profile
  const handleSave = async () => {
    try {
      setLoading(true);

      const res = await updateProfile(form);

      if (res.success) {
        Alert.alert('Success', 'Profile updated');
        setIsEditing(false);
      } else {
        Alert.alert('Error', res.message);
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <Text style={styles.loading}>Loading profile...</Text>;

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>
          {form.name?.[0]?.toUpperCase() || 'U'}
        </Text>
      </View>

      {/* NAME / PHONE / EMAIL */}
      {!isEditing ? (
        <>
          <Text style={styles.name}>{form.name}</Text>
          <Text style={styles.info}>{form.phone}</Text>
          <Text style={styles.info}>{form.email}</Text>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(t) =>
              setForm((prev) => ({ ...prev, name: t }))
            }
            placeholder="Name"
          />

          <TextInput
            style={styles.input}
            value={form.email}
            onChangeText={(t) =>
              setForm((prev) => ({ ...prev, email: t }))
            }
            placeholder="Email"
          />

          <TextInput
            style={styles.input}
            value={form.phone}
            editable={false}
          />
        </>
      )}

      {/* ADDRESS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Address</Text>

        {!isEditing ? (
          <Text style={styles.sectionContent}>
            {form.address || 'No address provided'}
          </Text>
        ) : (
          <TextInput
            style={styles.input}
            value={form.address}
            onChangeText={(t) =>
              setForm((prev) => ({ ...prev, address: t }))
            }
            placeholder="Enter address"
          />
        )}
      </View>

      {/* ID PROOF */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ID Proof</Text>

        {!isEditing ? (
          form.idProof ? (
            <Image source={{ uri: form.idProof }} style={styles.idProofImage} resizeMode="contain" />
          ) : (
            <Text style={styles.sectionContent}>No ID proof provided</Text>
          )
        ) : (
          <>
            <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadChoice}>
              <Text>{fileName ? fileName : (form.idProof ? 'Replace Uploaded File' : 'Choose File')}</Text>
            </TouchableOpacity>

            <Text style={styles.helper}>
              Aadhaar / Voter ID / Passport
            </Text>
          </>
        )}
      </View>

      {/* BUTTONS */}
      {!isEditing ? (
        <>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setIsEditing(false)}
          >
            <Text>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff' }}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ProfileScreen;
const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },

  loading: { textAlign: 'center', marginTop: 50 },

  avatarContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#000',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  avatarText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },

  name: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },

  info: { fontSize: 14, color: '#666', marginBottom: 5 },

  section: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 5,
  },

  sectionContent: { fontSize: 14, color: '#333' },

  idProofImage: {
    width: '100%',
    height: 200,
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },

  input: {
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    width: '100%',
  },

  uploadBtn: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },

  helper: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },

  editBtn: {
    marginTop: 20,
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },

  editText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  logoutBtn: {
    marginTop: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: 'red',
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },

  logoutText: { color: 'red', fontWeight: 'bold' },

  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    width: '100%',
  },

  cancelBtn: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
  },

  saveBtn: {
    flex: 1,
    padding: 15,
    backgroundColor: '#000',
    borderRadius: 10,
    alignItems: 'center',
  },
});