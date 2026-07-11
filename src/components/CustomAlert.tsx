import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  type?: 'success' | 'error' | 'warning' | 'info';
};

const CustomAlert = ({
  visible,
  title,
  message,
  confirmText = 'Okay, Understood',
  cancelText = 'Cancel',
  showCancel = false,
  onConfirm,
  onCancel,
  type = 'warning',
}: Props) => {
  const getHeaderColor = () => {
    switch (type) {
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      case 'info': return '#3B82F6';
      default: return '#F59E0B';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'x-circle';
      case 'info': return 'info';
      default: return 'alert-triangle';
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={[styles.header, { backgroundColor: getHeaderColor() }]}>
            <Feather name={getIcon() as any} color="#fff" size={46} />
          </View>

          <View style={styles.body}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            {showCancel ? (
              <View style={styles.row}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                  <Text style={styles.cancelText}>{cancelText}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
                  <Text style={styles.confirmText}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.fullButton} onPress={onConfirm}>
                <Text style={styles.fullButtonText}>{confirmText}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CustomAlert;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '84%',
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 10,
  },
  header: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    padding: 18,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  fullButton: {
    backgroundColor: '#000',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 11,
    alignItems: 'center',
  },
  fullButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 11,
    paddingVertical: 13,
    alignItems: 'center',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 11,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelText: {
    fontWeight: '700',
    color: '#555',
  },
  confirmText: {
    color: '#fff',
    fontWeight: '700',
  },
});
