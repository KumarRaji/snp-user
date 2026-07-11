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
  ScrollView,
} from 'react-native';
import CustomAlert from '../components/CustomAlert';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { updateProfile, deleteAccount } from '../api/authApi';
import { uploadFile } from '../api/uploadApi';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = ({ profile, navigation, onProfileUpdate }: any) => {
  const { logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', type: 'error' as 'success' | 'error' | 'warning' | 'info' });
  const [deleteVisible, setDeleteVisible] = useState(false);

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'error') =>
    setAlert({ visible: true, title, message, type });

  const [form, setForm] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    idProof: profile?.idProof || '',
  });

  const [fileName, setFileName] = useState('');

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

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({});
    if (!result.canceled) {
      const file = result.assets[0];
      try {
        setLoading(true);
        const res = await uploadFile(file);
        setForm(prev => ({ ...prev, idProof: res.fileId || res.url }));
        setFileName(file.name);
      } catch (error) {
        showAlert('Error', 'File upload failed');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      showAlert('Permission Required', 'Camera access is needed to take photos.', 'warning');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
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
        setForm(prev => ({ ...prev, idProof: res.fileId || res.url }));
        setFileName(file.name);
      } catch (error) {
        showAlert('Error', 'File upload failed');
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

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await updateProfile(form);
      if (res.success) {
        if (onProfileUpdate) await onProfileUpdate();
        showAlert('Success', 'Profile updated', 'success');
        setIsEditing(false);
      } else {
        showAlert('Error', res.message || 'Failed to update profile');
      }
    } catch (e) {
      showAlert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <Text style={styles.loading}>Loading profile...</Text>;

  return (
    <ScrollView contentContainerStyle={styles.container}>

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

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => setDeleteVisible(true)}
          >
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(t) => setForm((prev) => ({ ...prev, name: t }))}
            placeholder="Name"
          />
          <TextInput
            style={styles.input}
            value={form.email}
            onChangeText={(t) => setForm((prev) => ({ ...prev, email: t }))}
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
            onChangeText={(t) => setForm((prev) => ({ ...prev, address: t }))}
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
            <Text style={styles.helper}>Aadhaar / Voter ID / Passport</Text>
          </>
        )}
      </View>

      {/* SAVE / CANCEL */}
      {!isEditing ? (
        <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
          <Text style={styles.editText}>Edit Profile</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.row}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)}>
            <Text>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff' }}>Save</Text>}
          </TouchableOpacity>
        </View>
      )}

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onConfirm={() => setAlert(prev => ({ ...prev, visible: false }))}
      />

      <CustomAlert
        visible={deleteVisible}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone."
        type="warning"
        showCancel
        cancelText="Cancel"
        confirmText="Delete"
        onCancel={() => setDeleteVisible(false)}
        onConfirm={async () => {
          setDeleteVisible(false);
          const res = await deleteAccount();
          if (res.success) {
            await logout();
          } else {
            showAlert('Error', 'Failed to delete account');
          }
        }}
      />
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },

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

  name: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },

  info: { fontSize: 14, color: '#666', marginBottom: 5 },

  deleteBtn: {
    marginTop: 12,
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#e53935',
    shadowColor: '#e53935',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  deleteText: {
    color: '#e53935',
    fontSize: 12,
  },

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
