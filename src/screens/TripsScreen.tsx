import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, Linking, Image, ScrollView, Alert, TextInput } from 'react-native';
import { getMyTrips, cancelTrip, rateTrip } from '../api/tripApi';
import { useAuth } from '../context/AuthContext';

const TripsScreen = () => {
  const { userToken } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [ratingData, setRatingData] = useState<{
    [key: string]: {
      rating: number;
      feedback: string;
    };
  }>({});

  useEffect(() => {
    if (!userToken) {
      setTrips([]);
      setLoading(false);
      return;
    }

    loadTrips();
  }, [userToken]);

  const normalizeStatus = (status: any) => String(status ?? '').trim().toUpperCase().replace(/\s+/g, '_');

  const loadTrips = async () => {
    setLoading(true);
    const res = await getMyTrips();

    const rawBookings = Array.isArray(res?.bookings)
      ? res.bookings
      : Array.isArray(res?.data?.bookings)
      ? res.data.bookings
      : Array.isArray(res?.data)
      ? res.data
      : [];

    const allBookings = rawBookings;

    const processedTrips = allBookings.map((trip: any) => {
      const normalizedStatus = normalizeStatus(trip.status);
      const allocatedStatuses = ['DRIVER_ALLOCATED', 'DRIVER_ALLOCATED', 'ACCEPTED', 'ARRIVED', 'STARTED', 'ON_TRIP'];
      if (allocatedStatuses.includes(normalizedStatus)) {
        // Normalize status to DRIVER_ALLOCATED to group them
        return { ...trip, status: 'DRIVER_ALLOCATED' };
      }
      return { ...trip, status: normalizedStatus || trip.status };
    });

    // Only show trips with one of the supported statuses
    const validStatuses = ['PENDING', 'CONFIRMED', 'DRIVER_ALLOCATED', 'COMPLETED', 'CANCELLED'];
    const filteredTrips = processedTrips.filter((trip: any) =>
      validStatuses.includes(normalizeStatus(trip.status))
    );

    setTrips(filteredTrips);
    setLoading(false);
  };

  const confirmCancelTrip = async () => {
    if (!selectedBookingId) return;

    try {
      setCancelLoading(true);

      const res = await cancelTrip(selectedBookingId);

      if (res.success) {
        setShowCancelModal(false);
        setSelectedBookingId(null);
        await loadTrips();

        Alert.alert(
          'Success',
          'Cancellation request sent to Admin for approval'
        );
      } else {
        Alert.alert('Error', 'Unable to cancel booking');
      }
    } finally {
      setCancelLoading(false);
    }
  };

  const handleRating = (tripId: string, rating: number) => {
    setRatingData(prev => ({
      ...prev,
      [tripId]: {
        rating,
        feedback: prev[tripId]?.feedback || '',
      },
    }));
  };

  const submitRating = async (tripId: string) => {
    const data = ratingData[tripId];

    if (!data?.rating) {
      Alert.alert('Please select rating');
      return;
    }

    console.log('Submitting rating payload', {
      rating: data.rating,
      feedback: data.feedback,
    });

    try {
      const response = await rateTrip(tripId, data.rating, data.feedback);

      if (response.success) {
        Alert.alert('Success', response.message || 'Rating submitted successfully');
        await loadTrips();
      } else {
        Alert.alert('Error', response.message || 'Something went wrong');
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const renderItem = ({ item }: any) => {
    const d = new Date(item.startDateTime || item.createdAt || Date.now());
    const dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const rawType = item.serviceType || item.bookingType;

    const assignedPerson = item.driver || item.lead;
    const isLead = !!item.lead;

    const normalizedStatus = normalizeStatus(item.status);

    // Status checks
    const isPending = normalizedStatus === 'PENDING';
    const isCompleted = normalizedStatus === 'COMPLETED';
    const isAllocated = normalizedStatus === 'DRIVER_ALLOCATED';
    const isCancelled = normalizedStatus === 'CANCELLED';
    const isCancellationPending = item.cancellationRequested;
    const existingRating = Number(item.rating ?? item.userRating ?? 0) || 0;

    const statusText = isCancelled
      ? 'CANCELLED'
      : isCompleted
      ? 'COMPLETED'
      : assignedPerson
      ? (isLead ? 'LEAD ALLOCATED' : 'DRIVER ALLOCATED')
      : item.selectedLeadPackageId
      ? 'REQUEST SENT TO LEADS'
      : item.status === 'CONFIRMED'
      ? 'CONFIRMED'
      : item.status;

    return (
      <View style={styles.card}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.date}>{dateStr}</Text>

          <View style={styles.headerRight}>
            {isCancellationPending ? (
              <View style={styles.cancelPendingBadge}>
                <Text style={styles.cancelPendingText}>CANCELLATION PENDING</Text>
              </View>
            ) : (
              <View style={[
                styles.badge,
                isPending && styles.badgePending,
                isAllocated && styles.badgeAllocated,
                isCompleted && styles.badgeCompleted,
                isCancelled && styles.badgeCancelled
              ]}>
                <Text style={[
                  styles.badgeText,
                  isPending && styles.badgeTextPending,
                  isAllocated && styles.badgeTextAllocated,
                  isCompleted && styles.badgeTextCompleted,
                  isCancelled && styles.badgeTextCancelled
                ]}>
                  {statusText}
                </Text>
              </View>
            )}

            {!isCompleted &&
              !isCancellationPending &&
              ['PENDING', 'CONFIRMED', 'DRIVER_ALLOCATED'].includes(item.status) && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setSelectedBookingId(item.id);
                    setShowCancelModal(true);
                  }}
                >
                  <Text style={styles.cancelBtnText}>Cancel Trip</Text>
                </TouchableOpacity>
              )}
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

        {item.status === 'COMPLETED' && (
          <View style={styles.ratingContainer}>
            {existingRating > 0 ? (
              <View>
                <View style={styles.ratingHeader}>
                  <Text style={styles.ratingTitle}>Your Rating:</Text>
                  <View style={styles.ratingStars}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Text
                        key={star}
                        style={{
                          fontSize: 18,
                          color: star <= existingRating ? '#FBBF24' : '#D1D5DB',
                        }}
                      >
                        ★
                      </Text>
                    ))}
                  </View>
                </View>

                {!!item.feedback && (
                  <Text style={styles.feedbackText}>
                    "{item.feedback}"
                  </Text>
                )}
              </View>
            ) : (
              <>
                <Text style={styles.ratingTitle}>Rate your driver:</Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => handleRating(item.id, star)}
                    >
                      <Text
                        style={{
                          fontSize: 32,
                          color: (ratingData[item.id]?.rating || 0) >= star ? '#FBBF24' : '#D1D5DB',
                        }}
                      >
                        ★
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {ratingData[item.id]?.rating > 0 && (
                  <>
                    <TextInput
                      placeholder="How was your trip? (Optional)"
                      value={ratingData[item.id]?.feedback}
                      multiline
                      numberOfLines={3}
                      style={styles.feedbackInput}
                      onChangeText={(text) => {
                        setRatingData(prev => ({
                          ...prev,
                          [item.id]: {
                            ...prev[item.id],
                            feedback: text,
                          },
                        }));
                      }}
                    />

                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={() => submitRating(item.id)}
                    >
                      <Text style={styles.submitText}>Submit Rating</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </View>
        )}
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
        visible={showCancelModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cancelModal}>
            <View style={styles.cancelIcon}>
              <Text style={{ fontSize: 24, color: '#ef4444' }}>✕</Text>
            </View>

            <Text style={styles.cancelTitle}>Cancel Booking?</Text>
            <Text style={styles.cancelSubtitle}>
              Are you sure?{'\n'}This request will be sent to the{'\n'}Admin for approval.
            </Text>

            <View style={styles.cancelFooter}>
              <TouchableOpacity
                style={styles.keepBtn}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.keepText}>Keep It</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelConfirmBtn}
                onPress={confirmCancelTrip}
                disabled={cancelLoading}
              >
                <Text style={styles.cancelConfirmText}>
                  {cancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

  headerRight: {
    alignItems: 'flex-end',
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

  badgeCancelled: {
    backgroundColor: '#FEE2E2'
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

  badgeTextCancelled: {
    color: '#DC2626'
  },

  cancelBtn: {
    marginTop: 8,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  cancelBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 10,
  },

  cancelPendingBadge: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  cancelPendingText: {
    color: '#EA580C',
    fontSize: 10,
    fontWeight: '700',
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

  ratingContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  ratingTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 0,
  },
  ratingStars: {
    flexDirection: 'row',
    marginLeft: 6,
  },
  starRow: {
    flexDirection: 'row',
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginTop: 15,
    padding: 12,
    minHeight: 70,
    textAlignVertical: 'top',
    fontSize: 14,
    backgroundColor: '#FFF',
  },
  submitButton: {
    backgroundColor: '#000',
    marginTop: 15,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  feedbackText: {
    marginTop: 2,
    color: '#6B7280',
    fontSize: 14,
    fontStyle: 'italic',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cancelModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '82%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  cancelIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEE2E2',
    alignSelf: 'center',
    marginTop: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 14,
  },
  cancelSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 18,
    lineHeight: 18,
  },
  cancelFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#eee',
    marginTop: 18,
  },
  keepBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  cancelConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  keepText: {
    fontWeight: '700',
    fontSize: 14,
    color: '#6B7280',
  },
  cancelConfirmText: {
    fontWeight: '700',
    fontSize: 14,
    color: '#DC2626',
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