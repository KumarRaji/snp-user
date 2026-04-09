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

    const allBookings = res.bookings || [];

    const processedTrips = allBookings.map((trip: any) => {
      const allocatedStatuses = ['DRIVER_ALLOCATED', 'DRIVER ALLOCATED', 'ACCEPTED', 'ARRIVED', 'STARTED', 'ON_TRIP'];
      if (allocatedStatuses.includes(trip.status)) {
        // Normalize status to DRIVER_ALLOCATED to group them
        return { ...trip, status: 'DRIVER_ALLOCATED' };
      }
      return trip;
    });

    // Only show trips with one of the 4 main statuses
    const validStatuses = ['PENDING', 'CONFIRMED', 'DRIVER_ALLOCATED', 'COMPLETED'];
    const filteredTrips = processedTrips.filter((trip: any) =>
      validStatuses.includes(trip.status)
    );

    setTrips(filteredTrips);
    setLoading(false);
  };

  const renderItem = ({ item }: any) => {
    const d = new Date(item.startDateTime || item.createdAt || Date.now());
    const dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const rawType = item.serviceType || item.bookingType;

    const assignedPerson = item.driver || item.lead;
    const isLead = !!item.lead;

    // Status checks
    const isPending = item.status === 'PENDING';
    const isCompleted = item.status === 'COMPLETED';
    const isAllocated = item.status === 'DRIVER_ALLOCATED';

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
              {isCompleted
                ? 'COMPLETED'
                : assignedPerson
                ? (isLead ? 'LEAD ALLOCATED' : 'DRIVER ALLOCATED')
                : item.selectedLeadPackageId
                ? 'REQUEST SENT TO LEADS'
                : item.status === 'CONFIRMED'
                ? 'CONFIRMED'
                : item.status}
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
            Payment: <Text style={{ fontWeight: 'bold' }}>{item.paymentMethod}</Text>
          </Text>
        )}

        {/* ROUTE */}
        <View style={styles.routeContainer}>
          <View style={styles.routeVisual}>
            <View style={styles.dotStart} />
            <View style={styles.line} />
            <View style={styles.dotEnd} />
          </View>
          <View style={styles.routeTextContainer}>
            <View style={styles.routeTextRow}>
              <Text style={styles.label}>From:</Text>
              <Text style={styles.value} numberOfLines={1}>{item.pickupLocation}</Text>
            </View>
            <View style={[styles.routeTextRow, { marginBottom: 0 }]}>
              <Text style={styles.label}>To:</Text>
              <Text style={styles.value} numberOfLines={1}>
                {item.dropLocation ? item.dropLocation : 'Round trips'}
              </Text>
            </View>
          </View>
        </View>

        {/* DRIVER STATUS */}
        {assignedPerson ? (
          <View style={styles.driverBox}>
            
            <Text style={styles.driverHeader}>
              ✓ YOUR DRIVER
            </Text>
        
            <View style={styles.driverRow}>
              
              {/* Avatar */}
              <View style={styles.driverAvatar}>
                <Text style={styles.driverAvatarText}>
                  {assignedPerson?.name?.[0] || (isLead ? 'L' : 'D')}
                </Text>
              </View>
        
              {/* Name + Phone */}
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>
                  {assignedPerson?.name || (isLead ? 'Lead Pro' : 'Driver')}
                </Text>
                <Text style={styles.driverPhone}>
                  {assignedPerson?.phone || 'N/A'}
                </Text>
              </View>
            
              {/* 📞 CALL BUTTON */}
              {assignedPerson?.phone && (
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => Linking.openURL(`tel:${assignedPerson.phone}`)}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>📞</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* 👤 SHOW DRIVER PROFILE BUTTON */}
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => {
                setSelectedDriver(assignedPerson);
                setShowDriverModal(true);
              }}
            >
              <Text style={styles.profileBtnText}>
                Show Driver Profile
              </Text>
            </TouchableOpacity>
          </View>
        ) : (item.status === 'PENDING' || item.status === 'CONFIRMED') ? (
          item.selectedLeadPackageId ? (
            <View style={styles.findingBox}>
              <Text style={styles.findingText}>
                Request sent to LEADS...
              </Text>
            </View>
          ) : item.status === 'PENDING' ? (
            <View style={styles.findingBox}>
              <Text style={styles.findingText}>
                🔍 Finding available drivers...
              </Text>
            </View>
          ) : (
            <View style={styles.findingBox}>
              <Text style={styles.findingText}>
                🔍 Finding available drivers...
              </Text>
              <Text style={styles.findingText}>
                Request sent to {rawType === 'OUTSTATION' ? 'OUTSTATION' : 'LOCAL'} drivers
              </Text>
            </View>
          )
        ) : null}
      </View>
    );
  };

  if (loading) return <ActivityIndicator style={{marginTop: 50}} size="large" />;

  const getImgUrl = (val: any) => (typeof val === 'string' ? val : val?.url || val?.uri || null);

  const profileImgUri = getImgUrl(selectedDriver?.documents?.photo || selectedDriver?.photo || selectedDriver?.profileImage || selectedDriver?.profilePic || selectedDriver?.avatar || selectedDriver?.image || selectedDriver?.profile_image);
  const licenseImgUri = getImgUrl(selectedDriver?.documents?.dl || selectedDriver?.dlPhoto || selectedDriver?.drivingLicensePhoto || selectedDriver?.driving_license_photo || selectedDriver?.licenseImage || selectedDriver?.licenseProof || selectedDriver?.idProof || selectedDriver?.drivingLicense || selectedDriver?.licenseUrl || selectedDriver?.documentUrl || selectedDriver?.licenseFile || selectedDriver?.license_image || selectedDriver?.id_proof);

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
            <ScrollView contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
              
              {/* Profile Image Preview */}
              <View style={{ alignItems: 'center', marginBottom: 10 }}>
                {profileImgUri ? (
                  <Image source={{ uri: profileImgUri }} style={styles.modalProfileImage} />
                ) : (
                  <View style={styles.modalAvatarFallback}>
                    <Text style={styles.modalAvatarText}>
                      {selectedDriver?.name?.[0] || 'D'}
                    </Text>
                  </View>
                )}
              </View>

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
  
              {/* License Image Preview */}
              <Text style={styles.modalLabel}>Driving License Photo</Text>
              {licenseImgUri ? (
                <Image source={{ uri: licenseImgUri }} style={styles.licenseImage} resizeMode="contain" />
              ) : (
                <Text style={styles.modalValue}>Not available</Text>
              )}
            </ScrollView>

            {/* Sticky Close Button */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowDriverModal(false)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
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

  routeContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
    marginTop: 5,
  },

  routeVisual: {
    alignItems: 'center',
    marginRight: 10,
    width: 16,
  },

  dotStart: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16a34a',
    marginTop: 4,
  },

  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#cbd5e1',
    marginVertical: 4,
    borderRadius: 2,
  },

  dotEnd: {
    width: 10,
    height: 10,
    borderRadius: 2, // Slight square for differentiation at the destination
    backgroundColor: '#ef4444',
    marginBottom: 16, // Adjusts position to properly align with 'To' text
  },

  routeTextContainer: {
    flex: 1,
  },

  routeTextRow: {
    marginBottom: 12,
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
  modalProfileImage: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0f0f0' },
  modalAvatarFallback: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#166534', justifyContent: 'center', alignItems: 'center' },
  modalAvatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalLabel: { fontSize: 12, color: '#666', marginTop: 10 },
  modalValue: { fontSize: 16, color: '#333', fontWeight: 'bold', marginTop: 2 },
  licenseImage: { width: '100%', height: 150, marginTop: 15, borderRadius: 8, backgroundColor: '#f9f9f9' },
  closeBtn: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  }
});

export default TripsScreen;