import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = ({ profile, navigation }: any) => {
  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    // Ensure this string matches your Auth stack router name
    navigation.replace('Login');
  };

  if (!profile) return <Text style={styles.loading}>Loading profile...</Text>;

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{profile.name?.[0] || 'U'}</Text>
      </View>
      <Text style={styles.name}>{profile.name}</Text>
      <Text style={styles.info}>{profile.phone}</Text>
      <Text style={styles.info}>{profile.email}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Address</Text>
        <Text style={styles.sectionContent}>{profile.address || 'No address provided'}</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  loading: { textAlign: 'center', marginTop: 50 },
  avatarContainer: { width: 80, height: 80, backgroundColor: '#000', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  info: { fontSize: 14, color: '#666', marginBottom: 5 },
  section: { width: '100%', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginTop: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#999', textTransform: 'uppercase', marginBottom: 5 },
  sectionContent: { fontSize: 14, color: '#333' },
  logoutBtn: { marginTop: 40, padding: 15, borderWidth: 1, borderColor: 'red', borderRadius: 10, width: '100%', alignItems: 'center' },
  logoutText: { color: 'red', fontWeight: 'bold' }
});

export default ProfileScreen;