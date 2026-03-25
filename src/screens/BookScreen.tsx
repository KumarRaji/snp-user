import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as Location from 'expo-location';
import { createTrip } from '../api/tripApi';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import DateTimePicker from '@react-native-community/datetimepicker';
import TermsAndConditionsModal from './TermsAndConditionsModal';

const BookScreen = () => {
  const insets = useSafeAreaInsets();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [serviceType, setServiceType] = useState('LOCAL_HOURLY');
  const [tripType, setTripType] = useState('One Way');
  const [driverType, setDriverType] = useState('ACTING');
  const [whenNeeded, setWhenNeeded] = useState('Immediately');
  const [duration, setDuration] = useState('4 Hrs');
  const [carType, setCarType] = useState('Manual');
  const [vehicleType, setVehicleType] = useState('Hatchback');

  // ✅ NEW
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [dateObj, setDateObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showChargesModal, setShowChargesModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const fromRef = useRef<any>(null);
  const toRef = useRef<any>(null);

  const [estimate, setEstimate] = useState<number | null>(null);
  const [pricing, setPricing] = useState<any>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);

  // ✅ FIXED LOGIC
  const showDropLocation =
    serviceType === 'OUTSTATION' || tripType === 'One Way';

  const isFormValid =
    from.trim() !== '' &&
    (showDropLocation ? to.trim() !== '' : true) &&
    agree;

  const resetForm = () => {
    setFrom('');
    setTo('');
    setDriverType('ACTING');
    setWhenNeeded('Immediately');
    setCarType('Manual');
    setVehicleType('Hatchback');
    setDate('');
    setTime('');
    setDateObj(new Date());
    setAgree(false);
    fromRef.current?.setAddressText('');
    toRef.current?.setAddressText('');
  };

  const fetchEstimate = async () => {
    try {
      setEstimateLoading(true);
  
      const hours = parseInt(duration); // "4 Hrs" -> 4
      const packageType = serviceType === 'OUTSTATION' ? 'OUTSTATION' : 'LOCAL';
  
      let url = `https://drivemate.api.luisant.cloud/api/pricing-packages/estimate?packageType=${packageType}&hours=${hours}`;
      
      if (packageType === 'OUTSTATION') {
        url += '&distance=100'; // Default distance for outstation estimate
      }

      const res = await fetch(url);
  
      const data = await res.json();
  
      let finalEstimate = data.estimate;
      let finalPricing = data.pricing;

      // Fallbacks if API is missing data (especially for LOCAL)
      if (!finalEstimate && packageType === 'LOCAL') {
        finalEstimate = hours === 4 ? 500 : (hours * 125);
      }
      if (!finalPricing) {
        finalPricing = {
          description: `${hours} Hrs ${packageType === 'LOCAL' ? 'Local' : 'Outstation'} Package`,
          extraPerHour: 100
        };
      }

      setEstimate(finalEstimate);
      setPricing(finalPricing);
    } catch (e) {
      console.log('Estimate error', e);
    } finally {
      setEstimateLoading(false);
    }
  };

  useEffect(() => {
    fetchEstimate();
  }, [duration, serviceType]);

  const handleBook = async () => {
    if (!from || (showDropLocation && !to)) {
      Alert.alert('Required', 'Enter locations');
      return;
    }

    if (!from.includes(',')) {
      Alert.alert('Invalid', 'Select proper pickup location');
      return;
    }

    if (showDropLocation && !to.includes(',')) {
      Alert.alert('Invalid', 'Select proper drop location');
      return;
    }

    if (!agree) {
      Alert.alert('Terms', 'Please accept terms & conditions');
      return;
    }

    setLoading(true);

    try {
      let startDateTimeObj = new Date();
      if (date && time) {
        const [timePart, modifier] = time.split(' ');
        let [hours, minutes] = timePart.split(':');
        let hrs = parseInt(hours, 10);
        if (hrs === 12) hrs = 0;
        if (modifier === 'pm') hrs += 12;
        
        startDateTimeObj = new Date(dateObj);
        startDateTimeObj.setHours(hrs, parseInt(minutes, 10), 0, 0);
      }

      const res = await createTrip({
        pickupLocation: from,
        dropLocation: showDropLocation ? to : '',
        serviceType,
        tripType,
        driverType,
        duration,
        carType,
        vehicleType,

        // ✅ FIXED DATE TIME
        startDateTime: startDateTimeObj.toISOString(),

        paymentMethod: 'CASH'
      });

      if (res.success) {
        Alert.alert('Success', 'Driver request sent');
      } else {
        Alert.alert('Error', 'Failed');
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong');
    }

    setLoading(false);
  };

  const fetchMyLocation = async () => {
    try {
      setLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const [addr] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (addr) {
        const formatted = [
          addr.name,
          addr.street,
          addr.city,
          addr.region,
        ]
          .filter(Boolean)
          .join(', ');

        setFrom(formatted);
        fromRef.current?.setAddressText(formatted);
      }
    } catch {
      Alert.alert('Error fetching location');
    } finally {
      setLoading(false);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateObj(selectedDate);
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);
      setTime(''); // Reset time when date changes
    }
  };

  const getAvailableTimeSlots = () => {
    const slots: string[] = [];
    let start = new Date();
    
    if (dateObj.toDateString() === new Date().toDateString()) {
      start.setMinutes(start.getMinutes() + 30);
      const remainder = start.getMinutes() % 30;
      if (remainder !== 0) {
        start.setMinutes(start.getMinutes() + (30 - remainder));
      }
    } else {
      start = new Date(dateObj);
      start.setHours(0, 0, 0, 0);
    }

    const endOfDay = new Date(start);
    endOfDay.setHours(23, 59, 59, 999);

    while (start <= endOfDay) {
      let hrs = start.getHours();
      let mins = start.getMinutes();
      const ampm = hrs >= 12 ? 'pm' : 'am';
      hrs = hrs % 12;
      hrs = hrs ? hrs : 12; 
      const minsStr = mins === 0 ? '00' : String(mins).padStart(2, '0');
      slots.push(`${hrs}:${minsStr} ${ampm}`);
      start.setMinutes(start.getMinutes() + 30);
    }
    return slots;
  };

  const getUsageOptions = () => {
    const maxHours = serviceType === 'OUTSTATION' ? 30 : 12;
    return Array.from({ length: maxHours - 3 }, (_, i) => `${i + 4} Hrs`);
  };

  const renderDropdown = (
    label: string,
    value: string,
    options: string[],
    key: string,
    onSelect: (v: string) => void
  ) => (
    <View style={{ marginBottom: 15 }}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={styles.dropdownBox}
        onPress={() =>
          setOpenDropdown(openDropdown === key ? null : key)
        }
      >
        <Text>{value}</Text>
        <Text>{openDropdown === key ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {openDropdown === key && (
        <View style={styles.dropdownList}>
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
            {options.length === 0 ? (
              <Text style={{ padding: 15, color: '#999' }}>No slots available</Text>
            ) : (
              options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.dropdownItem}
                  onPress={() => {
                    onSelect(opt);
                    setOpenDropdown(null);
                  }}
                >
                  <Text>{opt}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        style={{ flex: 1 }}
        data={[]}
        renderItem={() => null}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.container}
        ListHeaderComponent={
          <>
            {/* SERVICE TYPE */}
            <View style={styles.row}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  serviceType === 'LOCAL_HOURLY' && styles.activeTab
                ]}
                onPress={() => {
                  setServiceType('LOCAL_HOURLY');
                  setTripType('One Way');
                  setDuration('4 Hrs');
                  resetForm();
                }}
              >
                <Text style={styles.tabText}>Local</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tab,
                  serviceType === 'OUTSTATION' && styles.activeTab
                ]}
                onPress={() => {
                  setServiceType('OUTSTATION');
                  setTripType('One Way');
                  setDuration('8 Hrs'); // ✅ default like web
                  resetForm();
                }}
              >
                <Text style={styles.tabText}>Outstation</Text>
              </TouchableOpacity>
            </View>

            {/* TRIP TYPE ONLY FOR LOCAL */}
            {serviceType === 'LOCAL_HOURLY' && (
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
                query={{
                  key: 'AIzaSyAfUP27GUuOL0cBm_ROdjE2n6EyVKesIu8',
                  language: 'en',
                  components: 'country:in'
                }}
                styles={{
                  textInput: [styles.input, { marginBottom: 0 }],
                  container: { flex: 0, marginBottom: 5 },
                  listView: { backgroundColor: '#fff', elevation: 3, borderRadius: 8, position: 'absolute', top: 55, zIndex: 10, width: '100%' }
                }}
              />

              <TouchableOpacity onPress={fetchMyLocation} style={{ marginTop: 10 }}>
                <Text style={styles.locationBtn}>
                  📍 Use Current Location
                </Text>
              </TouchableOpacity>
            </View>

            {showDropLocation && (
              <View style={{ zIndex: 1 }}>
                <GooglePlacesAutocomplete
                  ref={toRef}
                  placeholder="Drop Location"
                  fetchDetails={true}
                  onPress={(data) => setTo(data.description)}
                  query={{
                    key: 'AIzaSyAfUP27GUuOL0cBm_ROdjE2n6EyVKesIu8',
                    language: 'en',
                    components: 'country:in'
                  }}
                  styles={{
                    textInput: [styles.input, { marginBottom: 0 }],
                    container: { flex: 0, marginBottom: 15 },
                    listView: { backgroundColor: '#fff', elevation: 3, borderRadius: 8, position: 'absolute', top: 55, zIndex: 10, width: '100%' }
                  }}
                />
              </View>
            )}

            {/* SCHEDULE */}
            <Text style={styles.sectionTitle}>Schedule Details</Text>

            {renderDropdown('Choose Service', driverType, ['ACTING','SPARE'], 'driver', setDriverType)}
            {serviceType === 'OUTSTATION' ? (
              renderDropdown('Select Trip Type', tripType, ['One Way', 'Round Trip'], 'tripTypeDropdown', setTripType)
            ) : (
              renderDropdown('When do you need?', whenNeeded, ['Immediately','Schedule'], 'when', setWhenNeeded)
            )}
            {renderDropdown('Estimated Usage', duration, getUsageOptions(), 'duration', setDuration)}

            {/* DATE */}
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity style={styles.dropdownBox} onPress={() => setShowDatePicker(true)}>
                <Text>{date ? date.split('-').reverse().join('-') : 'dd-mm-yyyy'}</Text>
              </TouchableOpacity>
            </View>

            {/* TIME */}
            {renderDropdown('Select Time', time || 'Select time', getAvailableTimeSlots(), 'time', setTime)}

            {showDatePicker && (
              <DateTimePicker
                value={dateObj}
                mode="date"
                display="default"
                onChange={onChangeDate}
                minimumDate={new Date()}
              />
            )}

            {renderDropdown('Car Type', carType, ['Manual','Automatic'], 'car', setCarType)}
            {renderDropdown('Vehicle Type', vehicleType, ['Hatchback','Sedan'], 'vehicle', setVehicleType)}

            {/* FARE */}
            <View style={styles.fareCard}>
              <Text style={styles.fareTitle}>Estimated fare</Text>
            
              {estimateLoading ? (
                <ActivityIndicator />
              ) : (
                <>
                  <Text style={styles.price}>₹{estimate || 0}</Text>
            
                  {pricing && (
                    <>
                      <Text style={styles.packageText}>
                        {pricing.description}
                      </Text>
            
                      <View style={styles.divider} />
            
                      <Text style={styles.extraText}>
                        EXTRA PER HOUR: ₹{pricing.extraPerHour}
                      </Text>
            
                      <TouchableOpacity onPress={() => setShowChargesModal(true)}>
                        <Text style={styles.moreText}>
                          ℹ More charges apply
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}
            </View>

            {/* TERMS */}
            <View style={styles.checkboxRow}>
              <TouchableOpacity onPress={() => setAgree(!agree)}>
                <View style={[styles.checkbox, agree && styles.checked]}>
                  {agree && <Text style={styles.checkmark}>✔</Text>}
                </View>
              </TouchableOpacity>
              <Text>
                I agree to the {' '}
                <Text style={styles.link} onPress={() => setShowTerms(true)}>
                  Terms & Conditions
                </Text>
              </Text>
            </View>
          </>
        }
      />

      {/* BUTTON */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            (!isFormValid || loading) && styles.disabledButton
          ]}
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

      {showChargesModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            
            {/* HEADER */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Additional Charges</Text>
              <TouchableOpacity onPress={() => setShowChargesModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* CONTENT */}
            <Text style={styles.modalText}>
              • Extra Pay for One Way Drop Return Ticket
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default BookScreen;

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10 },

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
    borderRadius: 10,
    marginBottom: 10
  },

  label: { fontWeight: 'bold', marginBottom: 5 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10
  },

  dropdownBox: {
    backgroundColor: '#eee',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  dropdownList: { backgroundColor: '#fff', borderRadius: 10 },

  dropdownItem: { padding: 15 },

  fareCard: {
    backgroundColor: '#e6f5f1',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15
  },

  fareTitle: { fontSize: 14, color: '#666', marginBottom: 5 },
  packageText: { fontSize: 12, color: '#555', marginTop: 5 },
  divider: { height: 1, backgroundColor: '#cceae3', marginVertical: 10 },
  extraText: { fontSize: 12, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  moreText: { fontSize: 12, color: '#0066cc', marginTop: 5 },

  price: { fontSize: 24, fontWeight: 'bold' },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },

  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },

  checked: { 
    backgroundColor: '#0066cc',
    borderColor: '#0066cc' 
  },

  checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  link: {
    color: '#0066cc',
    textDecorationLine: 'underline'
  },

  button: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },

  disabledButton: { backgroundColor: '#ccc' },

  buttonText: { color: '#fff', fontWeight: 'bold' },

  bottomContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },

  locationBtn: {
    color: '#0066cc',
    marginBottom: 10,
    fontWeight: 'bold'
  },

  modalOverlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 1000
  },
  modalBox: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold' },
  closeBtn: { fontSize: 20, color: '#999', paddingHorizontal: 5 },
  modalText: { fontSize: 14, color: '#444', lineHeight: 22 }
});