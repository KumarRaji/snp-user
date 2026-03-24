import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsAndConditionsModal = ({ isOpen, onClose }: TermsAndConditionsModalProps) => {
  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Terms and Conditions</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
              <Text style={styles.text}>By using SNP services, you agree to these terms and conditions.</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Service Description</Text>
              <Text style={styles.text}>SNP provides ride booking and transportation services through our platform.</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Booking and Payment</Text>
              <Text style={styles.listItem}>• All bookings are subject to driver availability</Text>
              <Text style={styles.listItem}>• Fare estimates are approximate and may vary</Text>
              <Text style={styles.listItem}>• Payment is due as per the agreed terms</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. Cancellation Policy</Text>
              <Text style={styles.text}>Cancellations may be subject to charges depending on timing and circumstances.</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. User Responsibilities</Text>
              <Text style={styles.listItem}>• Provide accurate pickup and drop-off locations</Text>
              <Text style={styles.listItem}>• Be present at the pickup location on time</Text>
              <Text style={styles.listItem}>• Treat drivers and vehicles with respect</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
              <Text style={styles.text}>SNP's liability is limited to the extent permitted by law.</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. Privacy</Text>
              <Text style={styles.text}>Your personal information is handled according to our privacy policy.</Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, maxHeight: '80%', overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 20, fontWeight: 'bold' },
  closeBtn: { fontSize: 28, color: '#999', lineHeight: 28 },
  content: { padding: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 8, fontSize: 16 },
  text: { color: '#444', lineHeight: 22 },
  listItem: { color: '#444', lineHeight: 22, marginLeft: 10 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  button: { backgroundColor: '#000', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default TermsAndConditionsModal;