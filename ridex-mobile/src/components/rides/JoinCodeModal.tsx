import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface JoinCodeModalProps {
  visible: boolean;
  onClose: () => void;
  onJoinSuccess?: (rideId: string) => void;
}

export const JoinCodeModal: React.FC<JoinCodeModalProps> = ({
  visible,
  onClose,
  onJoinSuccess,
}) => {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length < 4) {
      Alert.alert('Invalid Code', 'Please enter a valid squad join code (e.g. RDX-7749).');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate/look up ride by join code or navigate to ride details
      setTimeout(() => {
        setIsLoading(false);
        setCode('');
        onClose();
        // Route to ride details screen
        router.push('/rides/ride-1');
        onJoinSuccess?.('ride-1');
      }, 600);
    } catch {
      setIsLoading(false);
      Alert.alert('Error', 'Unable to find ride with this code.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <Ionicons name="key" size={18} color="#06B6D4" />
              <Text style={styles.title}>JOIN SQUAD VIA CODE</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.desc}>
            Enter the 6-character private invite code provided by the squad Road Captain.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="RDX-XXXX"
            placeholderTextColor="#64748B"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            maxLength={10}
            textAlign="center"
          />

          <TouchableOpacity
            style={styles.joinBtn}
            onPress={handleJoin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#090D16" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={18} color="#090D16" />
                <Text style={styles.joinBtnText}>ENTER GROUP RIDE</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  desc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
  input: {
    backgroundColor: '#0B1120',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#06B6D4',
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 3,
    paddingVertical: 14,
  },
  joinBtn: {
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  joinBtnText: {
    color: '#090D16',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
