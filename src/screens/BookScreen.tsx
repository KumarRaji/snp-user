import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { createTrip } from '../api/tripApi';
import TermsAndConditionsModal from './TermsAndConditionsModal';

const BookScreen = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  
  // Main Selections
  const [serviceType, setServiceType] = useState('LOCAL_HOURLY');
  const [tripType, setTripType] = useState('One Way');
  const [driverType, setDriverType] = useState('ACTING');
  const [whenNeeded, setWhenNeeded] = useState('Immediately');
  const [duration, setDuration] = useState('4 Hrs');
  const [carType, setCarType] = useState('Manual');
  const [vehicleType, setVehicleType] = useState('Hatchback');
  
  // UI State
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Options
  const SERVICE_OPTIONS = ['ACTING', 'SPARE', 'TEMPORARY', 'VALET', 'DAILY', 'WEEKLY', 'MONTHLY'];
  const USAGE_OPTIONS = ['4 Hrs', '5 Hrs', '6 Hrs', '7 Hrs', '8 Hrs', '9 Hrs', '10 Hrs', '11 Hrs', '12 Hrs'];

  const handleBook = async () => {
    if (!from || !to) {
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
      dropLocation: to,
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

  // Helper to render accordion dropdowns
  const renderDropdown = (label: string, value: string, options: string[], dropdownKey: string, onSelect: (val: string) => void) => (
    <View style={{ marginBottom: 15 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdownBox}
        onPress={() => setOpenDropdown(openDropdown === dropdownKey ? null : dropdownKey)}
      >
        <Text style={styles.dropdownBoxText}>{value}</Text>
        <Text style={styles.dropdownIcon}>{openDropdown === dropdownKey ? '▲' : '▼'}</Text>
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
              <Text style={value === opt ? styles.dropdownItemTextSelected : styles.dropdownItemText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* LOCAL / OUTSTATION */}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.tab, serviceType === 'LOCAL_HOURLY' && styles.activeTab]}
          onPress={() => setServiceType('LOCAL_HOURLY')}
        >
          <Text style={styles.tabText}>Local</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, serviceType === 'OUTSTATION' && styles.activeTab]}
          onPress={() => setServiceType('OUTSTATION')}
        >
          <Text style={styles.tabText}>Outstation</Text>
        </TouchableOpacity>
      </View>

      {/* ONE WAY / ROUND */}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.tab, tripType === 'One Way' && styles.activeTab]}
          onPress={() => setTripType('One Way')}
        >
          <Text style={styles.tabText}>One Way</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tripType === 'Round Trip' && styles.activeTab]}
          onPress={() => setTripType('Round Trip')}
        >
          <Text style={styles.tabText}>Round Trip</Text>
        </TouchableOpacity>
      </View>

      {/* LOCATIONS */}
      <TextInput
        style={styles.input}
        placeholder="Pickup Location"
        value={from}
        onChangeText={setFrom}
      />

      <TextInput
        style={styles.input}
        placeholder="Drop Location"
        value={to}
        onChangeText={setTo}
      />

      {/* ========================= */}
{/* 🔥 OUTSTATION DESIGN ONLY */}
{/* ========================= */}

{serviceType === 'OUTSTATION' ? (
  <>
    {/* CHOOSE SERVICE */}
    {renderDropdown('Choose Service', driverType, SERVICE_OPTIONS, 'driver', setDriverType)}

    {/* SCHEDULE DETAILS */}
    <Text style={styles.label}>Schedule Details</Text>

    {/* Trip Type + Duration */}
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        {renderDropdown('', tripType, ['One Way', 'Round Trip'], 'trip', setTripType)}
      </View>

      <View style={{ flex: 1 }}>
        {renderDropdown('', duration, USAGE_OPTIONS, 'duration', setDuration)}
      </View>
    </View>

    {/* DATE + TIME */}
    <Text style={styles.label}>Date & Time</Text>
    <View style={styles.row}>
      <TextInput
        style={[styles.input, { flex: 1 }]}
        placeholder="dd-mm-yyyy"
      />
      <TextInput
        style={[styles.input, { flex: 1 }]}
        placeholder="Select time"
      />
    </View>

    {/* CAR TYPE */}
    <Text style={styles.label}>Car Type</Text>
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        {renderDropdown('', carType, ['Manual', 'Automatic', 'Both'], 'car', setCarType)}
      </View>

      <View style={{ flex: 1 }}>
        {renderDropdown('', vehicleType, ['Hatchback', 'Sedan', 'SUV', 'MPV'], 'vehicle', setVehicleType)}
      </View>
    </View>
  </>
) : (
  <>
    {/* ✅ KEEP LOCAL SAME (NO CHANGE) */}

    {renderDropdown('Choose Service', driverType, SERVICE_OPTIONS, 'driver', setDriverType)}

    {renderDropdown('When do you need?', whenNeeded, ['Immediately', 'Schedule'], 'when', setWhenNeeded)}

    {renderDropdown('Estimated Usage', duration, USAGE_OPTIONS, 'duration', setDuration)}

    {renderDropdown('Car Type', carType, ['Manual', 'Automatic', 'Both'], 'car', setCarType)}

    {renderDropdown('Vehicle Type', vehicleType, ['Hatchback', 'Sedan', 'SUV', 'MPV'], 'vehicle', setVehicleType)}
  </>
)}
      {/* FARE CARD */}
      <View style={styles.fareCard}>
        <Text style={styles.fareTitle}>Estimated fare</Text>
        <Text style={styles.price}>₹500</Text>
        <Text style={styles.small}>4 Hour Local Package</Text>

        <Text style={styles.small}>Extra per hour: ₹100</Text>
      </View>

      {/* TERMS */}
      <View style={styles.checkboxRow}>
        <TouchableOpacity onPress={() => setAgree(!agree)}>
          <View style={[styles.checkbox, agree && styles.checked]} />
        </TouchableOpacity>
        <Text style={styles.termsText}>
          I agree to the{' '}
          <Text style={styles.termsLink} onPress={() => setShowTerms(true)}>
            Terms & Conditions
          </Text>
        </Text>
      </View>

      {/* BUTTON */}
      <TouchableOpacity style={styles.button} onPress={handleBook}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Request Driver</Text>
        )}
      </TouchableOpacity>

      <TermsAndConditionsModal 
        isOpen={showTerms} 
        onClose={() => setShowTerms(false)} 
      />
    </ScrollView>
  );
};

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

  smallTab: {
    flex: 1,
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 8,
    alignItems: 'center'
  },

  activeTab: {
    backgroundColor: '#000'
  },

  tabText: {
    color: '#fff',
    fontWeight: 'bold'
  },

  input: {
    backgroundColor: '#eee',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15
  },

  label: {
    fontWeight: 'bold',
    marginBottom: 5
  },

  dropdownBox: {
    backgroundColor: '#eee',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dropdownBoxText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333'
  },

  dropdownIcon: {
    fontSize: 12,
    color: '#666'
  },

  dropdownList: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginTop: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd'
  },

  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  dropdownItemText: {
    color: '#444',
  },

  dropdownItemTextSelected: {
    color: '#000',
    fontWeight: 'bold'
  },

  fareCard: {
    backgroundColor: '#e6f5f1',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15
  },

  fareTitle: {
    color: '#666'
  },

  price: {
    fontSize: 28,
    fontWeight: 'bold'
  },

  small: {
    fontSize: 12,
    color: '#666'
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20
  },

  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1
  },

  checked: {
    backgroundColor: '#000'
  },

  termsText: {
    color: '#333'
  },

  termsLink: {
    fontWeight: 'bold',
    textDecorationLine: 'underline'
  },

  button: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});

export default BookScreen;