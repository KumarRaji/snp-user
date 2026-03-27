import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BookScreen from './BookScreen';
import TripsScreen from './TripsScreen';
import ProfileScreen from './ProfileScreen';
import CompleteProfileModal from './CompleteProfileModal';
import { getProfile } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

const HomeScreen = ({ navigation }: any) => {
  const { logout } = useAuth();
  const [tab, setTab] = useState<'BOOK' | 'TRIPS' | 'PROFILE'>('BOOK');
  const [profile, setProfile] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const data = await getProfile();
    
    // Safely extract the user object depending on how your API nests it
    const userData = data?.user || data?.data || data;
    setProfile(userData);

    if (userData && (!userData.email || !userData.address)) {
      setShowModal(true);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* TOP ROW: PROFILE & LOGOUT */}
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>SNP</Text>

          <View style={{ zIndex: 100, elevation: 10 }}>
            <TouchableOpacity style={styles.profileSection} onPress={() => setShowLogoutMenu(!showLogoutMenu)}>
              <Text style={styles.greetingText}>{profile?.name || 'User'}</Text>
              <View style={styles.avatarMini}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarMiniText}>{profile?.name?.[0]?.toUpperCase() || 'U'}</Text>
                </View>
              </View>
            </TouchableOpacity>

            {showLogoutMenu && (
              <TouchableOpacity style={styles.logoutMenu} onPress={handleLogout}>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <View style={styles.content}>
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

        {tab === 'BOOK' && <BookScreen onBookingSuccess={() => setTab('TRIPS')} />}
        {tab === 'TRIPS' && <TripsScreen />}
        {tab === 'PROFILE' && <ProfileScreen profile={profile} navigation={navigation} />}
      </View>

      <CompleteProfileModal 
        visible={showModal} 
        onClose={() => setShowModal(false)}
        onComplete={loadProfile}
        profile={profile}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { 
    paddingTop: 10, 
    backgroundColor: '#000', 
    zIndex: 100,
  },
  headerTop: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 100,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  profileSection: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greetingText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  avatarMini: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  avatarMiniText: { color: '#000', fontWeight: 'bold', fontSize: 16 },

  logoutMenu: {
    position: 'absolute',
    top: 50,
    right: -5,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 1000,
    minWidth: 120,
    alignItems: 'center',
  },
  logoutText: { color: 'red', fontWeight: 'bold', fontSize: 14 },
  topTabBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
  content: { flex: 1 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f5f5f5' },
  activeTab: { backgroundColor: '#000' },
  tabText: { color: '#666', fontWeight: 'bold', fontSize: 12 },
  activeTabText: { color: '#fff' }
});

export default HomeScreen;