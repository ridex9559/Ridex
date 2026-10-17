import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types/user';

interface EditProfileModalProps {
  visible: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (updated: Partial<User>) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  user,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phoneNumber || user?.phone || '');
  const [city, setCity] = useState(user?.city || user?.location || '');
  const [experience, setExperience] = useState(
    user?.ridingExperienceYears ? String(user.ridingExperienceYears) : '3'
  );
  const [level, setLevel] = useState(user?.ridingLevel || 'INTERMEDIATE');
  const [bio, setBio] = useState(user?.bio || '');

  const handleSave = () => {
    onSave({
      name: name.trim() || 'Rider',
      email: email.trim(),
      phoneNumber: phone.trim(),
      phone: phone.trim(),
      city: city.trim(),
      location: city.trim(),
      ridingExperienceYears: parseInt(experience) || 1,
      ridingLevel: level as any,
      bio: bio.trim(),
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Ionicons name="person-circle" size={20} color="#06B6D4" />
              <Text style={styles.headerTitle}>EDIT RIDER PROFILE</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>FULL NAME</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Pratik Sharma"
              placeholderTextColor="#64748B"
            />

            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="pratik@example.com"
              placeholderTextColor="#64748B"
            />

            <Text style={styles.inputLabel}>PHONE NUMBER (FOR SQUAD SOS)</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+91 98765 43210"
              placeholderTextColor="#64748B"
            />

            <Text style={styles.inputLabel}>CITY / HOME BASE</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="e.g. Pune, Maharashtra"
              placeholderTextColor="#64748B"
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>EXP (YEARS)</Text>
                <TextInput
                  style={styles.input}
                  value={experience}
                  onChangeText={setExperience}
                  keyboardType="numeric"
                  placeholder="5"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={{ flex: 2, marginLeft: 12 }}>
                <Text style={styles.inputLabel}>RIDER LEVEL</Text>
                <View style={styles.levelRow}>
                  {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map((lvl) => (
                    <TouchableOpacity
                      key={lvl}
                      style={[
                        styles.levelChip,
                        level === lvl && styles.levelChipActive,
                      ]}
                      onPress={() => setLevel(lvl)}
                    >
                      <Text
                        style={[
                          styles.levelText,
                          level === lvl && styles.levelTextActive,
                        ]}
                      >
                        {lvl.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <Text style={styles.inputLabel}>RIDER BIO</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Corner carver, touring addict, weekend twisties explorer."
              placeholderTextColor="#64748B"
              multiline
            />
          </ScrollView>

          {/* Footer Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="checkmark-done" size={18} color="#090D16" />
              <Text style={styles.saveBtnText}>SAVE RIDER PROFILE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 16,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0B1120',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  bioInput: {
    height: 70,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelRow: {
    flexDirection: 'row',
    gap: 6,
  },
  levelChip: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  levelChipActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderWidth: 1,
    borderColor: '#06B6D4',
  },
  levelText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
  },
  levelTextActive: {
    color: '#06B6D4',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  saveBtn: {
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: '#090D16',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
