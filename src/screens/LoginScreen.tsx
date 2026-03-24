import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ImageBackground,
  Platform,
  NativeModules,
  Alert,
} from 'react-native';
import { sendOTP, verifyOTP } from '../api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = () => {
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (step === 'PHONE' && Platform.OS === 'android') {
      const timer = setTimeout(() => {
        if (!phoneNumber) {
          handleRequestPhoneNumberHint();
        }
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [step]);

  // ✅ FIXED FUNCTION (no duplicate, safe)
  const handleRequestPhoneNumberHint = async () => {
    try {
      const { PhoneNumberHint } = NativeModules;

      if (!PhoneNumberHint || !PhoneNumberHint.requestHint) {
        console.log('PhoneNumberHint module not available');
        return;
      }

      const phoneString: string = await PhoneNumberHint.requestHint();

      if (!phoneString) return;

      const cleanNumber = phoneString
        .replace(/^\+?91/, '')
        .replace(/[^0-9]/g, '');

      setPhoneNumber(cleanNumber);
    } catch (error: unknown) {
      console.log('Phone number hint error:', error);

      // Ignore cancel
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as any).code === 'HINT_CANCELLED'
      ) {
        return;
      }

      Alert.alert(
        'Hint Error',
        'Could not load phone number automatically.'
      );
    }
  };

  const handleSendOtp = async () => {
    if (phoneNumber.length < 10) {
      alert('Enter valid number');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOTP(phoneNumber);
      if (res.success) {
        setStep('OTP');
      }
    } catch (error) {
      console.log(error);
      alert('Error sending OTP');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      alert('Invalid OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOTP(phoneNumber, otp);

      if (res.success) {
        await AsyncStorage.setItem('token', res.token);
        alert('Login success');
      }
    } catch (error) {
      console.log(error);
      alert('Error verifying OTP');
    }
    setLoading(false);
  };

  return (
    <ImageBackground
      source={{
        uri: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70',
      }}
      style={styles.background}
      blurRadius={3}
    >
      <View style={styles.overlay}>
        <Text style={styles.logo}>SNP</Text>

        <View style={styles.card}>
          {step === 'PHONE' ? (
            <>
              <Text style={styles.title}>What's your number?</Text>
              <Text style={styles.subtitle}>
                We'll send you a code to verify your account.
              </Text>

              <View style={styles.row}>
                <Text style={styles.country}>+91</Text>

                <TextInput
                  style={styles.input}
                  placeholder="9876543210"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phoneNumber}
                  onChangeText={(text) =>
                    setPhoneNumber(text.replace(/[^0-9]/g, ''))
                  }
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  importantForAutofill="yes"
                />
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Send Code</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => setStep('PHONE')}
                style={styles.backRow}
              >
                <Text style={styles.backText}>← Edit Number</Text>
              </TouchableOpacity>

              <Text style={styles.title}>Verify account</Text>

              <Text style={styles.subtitle}>
                Enter the 6-digit code sent to +91 {phoneNumber}
              </Text>

              <View style={styles.otpContainer}>
                {[...Array(6)].map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.otpBox,
                      otp.length === index && styles.activeBox,
                    ]}
                  >
                    <Text style={styles.otpText}>
                      {otp[index] || ''}
                    </Text>
                  </View>
                ))}

                <TextInput
                  style={styles.hiddenInput}
                  keyboardType="numeric"
                  maxLength={6}
                  value={otp}
                  onChangeText={(text) =>
                    setOtp(text.replace(/[^0-9]/g, ''))
                  }
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Verify & Login</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSendOtp}>
                <Text style={styles.resend}>Resend Code</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </ImageBackground>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  background: { flex: 1 },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },

  logo: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  subtitle: {
    color: '#666',
    marginBottom: 20,
  },

  row: {
    flexDirection: 'row',
    marginBottom: 20,
  },

  country: {
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
  },

  input: {
    flex: 1,
    backgroundColor: '#eee',
    borderRadius: 8,
    padding: 12,
  },

  button: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },

  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  resend: {
    textAlign: 'center',
    marginTop: 10,
    color: '#888',
  },

  backRow: {
    marginBottom: 10,
  },

  backText: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
  },

  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    position: 'relative',
  },

  otpBox: {
    width: 45,
    height: 55,
    borderRadius: 10,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },

  activeBox: {
    borderWidth: 2,
    borderColor: '#000',
  },

  otpText: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
  },
});