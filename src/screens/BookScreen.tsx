import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as Location from 'expo-location';
import { createTrip } from '../api/tripApi';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import TermsAndConditionsModal from './TermsAndConditionsModal';

const BookScreen = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [serviceType, setServiceType] = useState('LOCAL_HOURLY');
  const [tripType, setTripType] = useState('One Way');
  const [driverType, setDriverType] = useState('ACTING');
  const [whenNeeded, setWhenNeeded] = useState('Immediately');
  const [duration, setDuration] = useState('4 Hrs');
  const [carType, setCarType] = useState('Manual');
  const [vehicleType, setVehicleType] = useState('Hatchback');

  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const fromRef = useRef<any>(null);

  const showDropLocation = !(serviceType === 'LOCAL_HOURLY' || tripType === 'Round Trip');
  const isFormValid = from.trim() !== '' && (!showDropLocation || to.trim() !== '') && agree;

  const SERVICE_OPTIONS = ['ACTING', 'SPARE', 'TEMPORARY', 'VALET', 'DAILY', 'WEEKLY', 'MONTHLY'];
  const USAGE_OPTIONS = ['4 Hrs', '5 Hrs', '6 Hrs', '7 Hrs', '8 Hrs', '9 Hrs', '10 Hrs', '11 Hrs', '12 Hrs'];

  const handleBook = async () => {
    if (!from || (showDropLocation && !to)) {
      Alert.alert('Required', 'Enter locations');
      return;
    }

    if (!agree) {
      Alert.alert('Terms', 'Please accept terms & conditions');
      return;
    }

    setLoading(true);

    const res = await createTrip({
      pickupLocation: from,
      dropLocation: showDropLocation ? to : '',
      serviceType,
      tripType,
      driverType,
      duration,
      carType,
      vehicleType,
      startDateTime: new Date().toISOString(),
      paymentMethod: 'CASH'
    });

    setLoading(false);

    if (res.success) {
      Alert.alert('Success', 'Driver request sent');
    } else {
      Alert.alert('Error', 'Failed');
    }
  };

  const fetchMyLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow location access.');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [addressDetails] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addressDetails) {
        const addressParts = [
          addressDetails.name,
          addressDetails.street,
          addressDetails.city,
          addressDetails.region,
        ].filter(Boolean);

        const formattedAddress = addressParts.join(', ');
        
        setFrom(formattedAddress);
        // Programmatically update the text in the Google Places input
        fromRef.current?.setAddressText(formattedAddress);
      }
    } catch (error) {
      console.log('Location error:', error);
      Alert.alert('Error', 'Failed to fetch location.');
    } finally {
      setLoading(false);
    }
  };

  const renderDropdown = (
    label: string,
    value: string,
    options: string[],
    dropdownKey: string,
    onSelect: (val: string) => void
  ) => (
    <View style={{ marginBottom: 15 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        style={styles.dropdownBox}
        onPress={() =>
          setOpenDropdown(openDropdown === dropdownKey ? null : dropdownKey)
        }
      >
        <Text style={styles.dropdownBoxText}>{value}</Text>
        <Text>{openDropdown === dropdownKey ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {openDropdown === dropdownKey && (
        <View style={styles.dropdownList}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={styles.dropdownItem}
              onPress={() => {
                onSelect(opt);
                setOpenDropdown(null);
              }}
            >
              <Text
                style={
                  value === opt
                    ? styles.dropdownItemTextSelected
                    : styles.dropdownItemText
                }
              >
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        style={{ flex: 1 }}
        data={[]}
        renderItem={() => null}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.container,
          { paddingBottom: 40 }
        ]}
        ListHeaderComponent={
          <>
            {/* SERVICE TYPE */}
            <View style={styles.row}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  serviceType === 'LOCAL_HOURLY' && styles.activeTab
                ]}
                onPress={() => setServiceType('LOCAL_HOURLY')}
              >
                <Text style={styles.tabText}>Local</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tab,
                  serviceType === 'OUTSTATION' && styles.activeTab
                ]}
                onPress={() => setServiceType('OUTSTATION')}
              >
                <Text style={styles.tabText}>Outstation</Text>
              </TouchableOpacity>
            </View>

            {/* TRIP TYPE */}
            {serviceType !== 'OUTSTATION' && (
              <View style={styles.row}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    tripType === 'One Way' && styles.activeTab
                  ]}
                  onPress={() => setTripType('One Way')}
                >
                  <Text style={styles.tabText}>One Way</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tab,
                    tripType === 'Round Trip' && styles.activeTab
                  ]}
                  onPress={() => setTripType('Round Trip')}
                >
                  <Text style={styles.tabText}>Round Trip</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* LOCATION */}
            <View style={{ zIndex: 2 }}>
              <GooglePlacesAutocomplete
                ref={fromRef}
                placeholder="Pickup Location"
                fetchDetails={true}
                onPress={(data) => setFrom(data.description)}
                query={{ key: 'AIzaSyAfUP27GUuOL0cBm_ROdjE2n6EyVKesIu8', language: 'en' }}
                styles={{
                  textInput: [styles.input, { marginBottom: 0 }],
                  container: { flex: 0, marginBottom: 5 },
                  listView: { backgroundColor: '#fff', elevation: 3, borderRadius: 8, position: 'absolute', top: 55, zIndex: 10, width: '100%' }
                }}
              />
              <TouchableOpacity onPress={fetchMyLocation} style={styles.locationBtn}>
                <Text style={styles.locationBtnText}>📍 Use My Current Location</Text>
              </TouchableOpacity>
            </View>

            {showDropLocation && (
              <View style={{ zIndex: 1 }}>
                <GooglePlacesAutocomplete
                  placeholder="Drop Location"
                  fetchDetails={true}
                  onPress={(data) => setTo(data.description)}
                  query={{ key: 'AIzaSyAfUP27GUuOL0cBm_ROdjE2n6EyVKesIu8', language: 'en' }}
                  styles={{
                    textInput: [styles.input, { marginBottom: 0 }],
                    container: { flex: 0, marginBottom: 15 },
                    listView: { backgroundColor: '#fff', elevation: 3, borderRadius: 8, position: 'absolute', top: 55, zIndex: 10, width: '100%' }
                  }}
                />
              </View>
            )}

            {/* DROPDOWNS */}
            {renderDropdown('Choose Service', driverType, SERVICE_OPTIONS, 'driver', setDriverType)}
            {renderDropdown('When do you need?', whenNeeded, ['Immediately', 'Schedule'], 'when', setWhenNeeded)}
            {renderDropdown('Estimated Usage', duration, USAGE_OPTIONS, 'duration', setDuration)}
            {renderDropdown('Car Type', carType, ['Manual', 'Automatic'], 'car', setCarType)}
            {renderDropdown('Vehicle Type', vehicleType, ['Hatchback', 'Sedan', 'SUV'], 'vehicle', setVehicleType)}

            {/* FARE */}
            <View style={styles.fareCard}>
              <Text>Estimated fare</Text>
              <Text style={styles.price}>₹500</Text>
            </View>

            {/* TERMS */}
            <View style={styles.checkboxRow}>
              <TouchableOpacity onPress={() => setAgree(!agree)}>
                <View style={[styles.checkbox, agree && styles.checked]} />
              </TouchableOpacity>
              <Text>
                I agree to the{' '}
                <Text
                  style={{ fontWeight: 'bold', color: '#0066cc', textDecorationLine: 'underline' }}
                  onPress={() => setShowTerms(true)}
                >
                  Terms and Conditions
                </Text>
              </Text>
            </View>
          </>
        }
      />

      {/* STICKY BOTTOM BUTTON */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[styles.button, (!isFormValid || loading) && styles.disabledButton]} 
          onPress={handleBook}
          disabled={!isFormValid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Request Driver</Text>
          )}
        </TouchableOpacity>
      </View>

      <TermsAndConditionsModal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
      />
    </SafeAreaView>
  );
};

export default BookScreen;

const styles = StyleSheet.create({
  container: { padding: 20 },

  row: { flexDirection: 'row', gap: 10, marginBottom: 15 },

  tab: {
    flex: 1,
    padding: 12,
    backgroundColor: '#eee',
    borderRadius: 10,
    alignItems: 'center'
  },

  activeTab: { backgroundColor: '#000' },

  tabText: { color: '#fff', fontWeight: 'bold' },

  input: {
    backgroundColor: '#eee',
    padding: 15,
    borderRadius: 10
  },

  label: { fontWeight: 'bold', marginBottom: 5 },

  dropdownBox: {
    backgroundColor: '#eee',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  dropdownBoxText: { color: '#333' },

  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: 10
  },

  dropdownItem: { padding: 15 },

  dropdownItemText: { color: '#444' },

  dropdownItemTextSelected: { fontWeight: 'bold' },

  fareCard: {
    backgroundColor: '#e6f5f1',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15
  },

  price: { fontSize: 24, fontWeight: 'bold' },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10
  },

  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1
  },

  checked: { backgroundColor: '#000' },

  button: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },

  disabledButton: {
    backgroundColor: '#ccc',
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  },

  bottomContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },

  locationBtn: {
    marginBottom: 15,
    alignSelf: 'flex-start'
  },

  locationBtnText: {
    color: '#0066cc',
    fontWeight: 'bold'
  }
});