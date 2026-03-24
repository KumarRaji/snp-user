import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { getMyTrips } from '../api/tripApi';

const TripsScreen = () => {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.date}>{dateStr}</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>{item.status}</Text></View>
        </View>
        <Text style={styles.amount}>₹{item.estimateAmount || 'N/A'}</Text>
        <Text style={styles.type}>{item.bookingType || item.serviceType}</Text>
        
        <View style={styles.route}>
          <Text style={styles.label}>From:</Text>
          <Text style={styles.value} numberOfLines={1}>{item.pickupLocation}</Text>
          <Text style={[styles.label, {marginTop: 5}]}>To:</Text>
          <Text style={styles.value} numberOfLines={1}>{item.dropLocation}</Text>
        </View>
      </View>
    );
  };

  if (loading) return <ActivityIndicator style={{marginTop: 50}} size="large" />;

  return (
    <FlatList
      contentContainerStyle={{ padding: 15 }}
      data={trips}
      renderItem={renderItem}
      keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
      ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 50}}>No bookings yet</Text>}
    />
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  date: { fontSize: 12, color: '#666', fontWeight: 'bold' },
  badge: { backgroundColor: '#e6f4fe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 10, color: '#0066cc', fontWeight: 'bold' },
  amount: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  type: { fontSize: 12, backgroundColor: '#eee', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 10 },
  route: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  label: { fontSize: 10, color: '#888', fontWeight: 'bold' },
  value: { fontSize: 13, color: '#333' }
});

export default TripsScreen;