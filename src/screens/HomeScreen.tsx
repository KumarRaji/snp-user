import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import BookScreen from './BookScreen';
import TripsScreen from './TripsScreen';
import ProfileScreen from './ProfileScreen';
import CompleteProfileModal from './CompleteProfileModal';
import { getProfile } from '../api/authApi';

const HomeScreen = ({ navigation }: any) => {
  const [tab, setTab] = useState<'BOOK' | 'TRIPS' | 'PROFILE'>('BOOK');
  const [profile, setProfile] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const data = await getProfile();
    setProfile(data);

    if (data && (!data.email || !data.address || !data.idProof)) {
      setShowModal(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SNP</Text>
        <View style={styles.topTabBar}>
          <TouchableOpacity style={[styles.tab, tab === 'BOOK' && styles.activeTab]} onPress={() => setTab('BOOK')}>
            <Text style={[styles.tabText, tab === 'BOOK' && styles.activeTabText]}>Book</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'TRIPS' && styles.activeTab]} onPress={() => setTab('TRIPS')}>
            <Text style={[styles.tabText, tab === 'TRIPS' && styles.activeTabText]}>Trips</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'PROFILE' && styles.activeTab]} onPress={() => setTab('PROFILE')}>
            <Text style={[styles.tabText, tab === 'PROFILE' && styles.activeTabText]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {tab === 'BOOK' && <BookScreen />}
        {tab === 'TRIPS' && <TripsScreen />}
        {tab === 'PROFILE' && <ProfileScreen profile={profile} navigation={navigation} />}
      </View>

      <CompleteProfileModal 
        visible={showModal} 
        onClose={() => setShowModal(false)}
        onComplete={loadProfile}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { 
    paddingTop: Platform.OS === 'android' ? 45 : 16, 
    paddingHorizontal: 16, 
    paddingBottom: 16, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  topTabBar: { flexDirection: 'row', gap: 8 },
  content: { flex: 1 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f5f5f5' },
  activeTab: { backgroundColor: '#000' },
  tabText: { color: '#666', fontWeight: 'bold', fontSize: 12 },
  activeTabText: { color: '#fff' }
});

export default HomeScreen;