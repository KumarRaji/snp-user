import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, Linking, Image, ScrollView } from 'react-native';
import { getMyTrips } from '../api/tripApi';

const TripsScreen = () => {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    setLoading(true);
    const res = await getMyTrips();
    setTrips(res.bookings || []);
    setLoading(false);
  };

  const renderItem = ({ item }: any) => {
    const d = new Date(item.startDateTime || item.createdAt || Date.now());
    const dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const rawType = item.serviceType || item.bookingType;

    // Status checks
    const isPending = item.status === 'PENDING';
    const isCompleted = item.status === 'COMPLETED';
    const isAllocated = item.status === 'DRIVER_ALLOCATED' || item.status === 'DRIVER ALLOCATED' || item.status === 'ACCEPTED' || item.status === 'ARRIVED' || item.status === 'STARTED' || item.status === 'ON_TRIP';

    return (
      <View style={styles.card}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.date}>{dateStr}</Text>

          <View style={[
            styles.badge, 
            isPending && styles.badgePending,
            isAllocated && styles.badgeAllocated,
            isCompleted && styles.badgeCompleted
          ]}>
            <Text style={[
              styles.badgeText, 
              isPending && styles.badgeTextPending,
              isAllocated && styles.badgeTextAllocated,
              isCompleted && styles.badgeTextCompleted
            ]}>
              {item.status === 'DRIVER_ALLOCATED' ? 'DRIVER ALLOCATED' : item.status}
            </Text>
          </View>
        </View>

        {/* AMOUNT */}
        <Text style={styles.amount}>
          ₹{item.estimateAmount || item.amount || 0}
        </Text>

        {/* PAYMENT */}
        {item.paymentMethod && (
          <Text style={styles.payment}>
            Payment: {item.paymentMethod}
          </Text>
        )}

        {/* ROUTE */}
        <View style={styles.route}>
          <Text style={styles.label}>From:</Text>
          <Text style={styles.value} numberOfLines={1}>{item.pickupLocation}</Text>
          <Text style={[styles.label, {marginTop: 5}]}>To:</Text>
          <Text style={styles.value} numberOfLines={1}>
            {item.dropLocation ? item.dropLocation : 'Round trips'}
          </Text>
        </View>

        {/* DRIVER STATUS */}
        {item.status === 'PENDING' && (
          <View style={styles.findingBox}>
            <Text style={styles.findingText}>
              🔍 Finding available drivers...
            </Text>
          </View>
        )}
        {item.status === 'CONFIRMED' && (
          <View style={styles.findingBox}>
            <Text style={styles.findingText}>
              🔍 Finding available drivers...
            </Text>
            <Text style={styles.findingText}>
            Request sent to {rawType === 'OUTSTATION' ? 'OUTSTATION' : 'LOCAL'} drivers
            </Text>
          </View>
        )}

        {/* ✅ DRIVER ALLOCATED BLOCK */}
        {/* Show driver details for allocated or completed trips */}
        {(isAllocated || (isCompleted && item.driver)) && (
          <View style={styles.driverBox}>
            
            {/* ✅ THIS WAS MISSING */}
            <Text style={styles.driverHeader}>
              ✓ YOUR DRIVER
            </Text>
        
            <View style={styles.driverRow}>
              
              {/* Avatar */}
              <View style={styles.driverAvatar}>
                <Text style={styles.driverAvatarText}>
                  {item.driver?.name?.[0] || 'D'}
                </Text>
              </View>
        
              {/* Name + Phone */}
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>
                  {item.driver?.name || 'Driver'}
                </Text>
                <Text style={styles.driverPhone}>
                  {item.driver?.phone || ''}
                </Text>
              </View>
            
              {/* 📞 CALL BUTTON */}
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => Linking.openURL(`tel:${item.driver?.phone}`)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>📞</Text>
              </TouchableOpacity>
            </View>
            
            {/* 👤 SHOW DRIVER PROFILE BUTTON */}
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => {
                setSelectedDriver(item.driver);
                setShowDriverModal(true);
              }}
            >
              <Text style={styles.profileBtnText}>
                Show Driver Profile
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) return <ActivityIndicator style={{marginTop: 50}} size="large" />;

  return (
    <View style={{ flex: 1 }}>
      
      {/* 🔥 TITLE */}
      <Text style={styles.title}>Your Bookings</Text>

      <FlatList
        contentContainerStyle={{ padding: 15 }}
        data={trips}
        renderItem={renderItem}
        keyExtractor={(item) =>
          item.id?.toString() || Math.random().toString()
        }
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 50 }}>
            No bookings yet
          </Text>
        }
      />

      <Modal
        visible={showDriverModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <Text style={styles.modalTitle}>
                {selectedDriver?.name}
              </Text>
  
              {/* Phone */}
              <Text style={styles.modalLabel}>Phone</Text>
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${selectedDriver?.phone}`)}
              >
                <Text style={styles.modalValue}>
                  {selectedDriver?.phone}
                </Text>
              </TouchableOpacity>
  
              {/* Alternate numbers */}
              {selectedDriver?.alternateMobile1 && (
                <>
                  <Text style={styles.modalLabel}>Alternate</Text>
                  <Text style={styles.modalValue}>
                    {selectedDriver.alternateMobile1}
                  </Text>
                </>
              )}
  
              {/* Alternate 2 */}
              {selectedDriver?.alternateMobile2 && (
                <>
                  <Text style={styles.modalLabel}>Alternate 2</Text>
                  <Text style={styles.modalValue}>
                    {selectedDriver.alternateMobile2}
                  </Text>
                </>
              )}
  
              {/* Alternate 3 */}
              {selectedDriver?.alternateMobile3 && (
                <>
                  <Text style={styles.modalLabel}>Alternate 3</Text>
                  <Text style={styles.modalValue}>
                    {selectedDriver.alternateMobile3}
                  </Text>
                </>
              )}
  
              {/* Alternate 4 */}
              {selectedDriver?.alternateMobile4 && (
                <>
                  <Text style={styles.modalLabel}>Alternate 4</Text>
                  <Text style={styles.modalValue}>
                    {selectedDriver.alternateMobile4}
                  </Text>
                </>
              )}
  
              {/* License */}
              {selectedDriver?.licenseNo && (
                <>
                  <Text style={styles.modalLabel}>License</Text>
                  <Text style={styles.modalValue}>
                    {selectedDriver.licenseNo}
                  </Text>
                </>
              )}
  
              {/* License Image */}
              {selectedDriver?.licenseImage && (
                <Image source={{ uri: selectedDriver.licenseImage }} style={styles.licenseImage} resizeMode="contain" />
              )}
  
              {/* Close */}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowDriverModal(false)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 15
  },

  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
    alignItems: 'center'
  },

  date: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold'
  },

  badge: {
    backgroundColor: '#e6f4fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },

  badgePending: {
    backgroundColor: '#fff3cd'
  },

  badgeAllocated: {
    backgroundColor: '#dcfce7'
  },

  badgeCompleted: {
    backgroundColor: '#e2e8f0'
  },

  badgeText: {
    fontSize: 10,
    color: '#0066cc',
    fontWeight: 'bold'
  },

  badgeTextPending: {
    color: '#856404'
  },

  badgeTextAllocated: {
    color: '#166534'
  },

  badgeTextCompleted: {
    color: '#475569'
  },

  amount: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#16a34a',
    marginTop: 5
  },

  payment: {
    fontSize: 12,
    color: '#333',
    marginBottom: 10,
    fontWeight: '500'
  },

  route: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10
  },

  label: {
    fontSize: 10,
    color: '#888',
    fontWeight: 'bold'
  },

  value: {
    fontSize: 13,
    color: '#333'
  },

  findingBox: {
    marginTop: 10,
    backgroundColor: '#eef6ff',
    padding: 10,
    borderRadius: 6
  },

  findingText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500'
  },

  driverBox: { marginTop: 15, padding: 15, backgroundColor: '#f0fdf4', borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0' },
  driverHeader: { fontSize: 14, fontWeight: 'bold', color: '#166534', marginBottom: 10 },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  driverAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#166534', justifyContent: 'center', alignItems: 'center' },
  driverAvatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  driverName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  driverPhone: { fontSize: 14, color: '#666' },

  callButton: {
    backgroundColor: '#16a34a',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  profileBtn: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#dcfce7',
    alignItems: 'center'
  },
  profileBtnText: {
    color: '#166534',
    fontWeight: 'bold'
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '85%'
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalLabel: { fontSize: 12, color: '#666', marginTop: 10 },
  modalValue: { fontSize: 16, color: '#333', fontWeight: 'bold', marginTop: 2 },
  licenseImage: { width: '100%', height: 150, marginTop: 15, borderRadius: 8, backgroundColor: '#f9f9f9' },
  closeBtn: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  }
});

export default TripsScreen;