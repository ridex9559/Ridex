import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmergencyContact } from '../../types/user';
import { emergencyContactService } from '../../services/EmergencyContactService';
import { useRideTrackingStore } from '../../store/rideTrackingStore';

interface EmergencyContactsCardProps {
  contacts: EmergencyContact[];
  onAddContact: (contact: EmergencyContact) => void;
  onRemoveContact: (id: string) => void;
  riderName?: string;
}

export const EmergencyContactsCard: React.FC<EmergencyContactsCardProps> = ({
  contacts,
  onAddContact,
  onRemoveContact,
  riderName = 'Rider',
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('Family');

  const currentLocation = useRideTrackingStore((s) => s.currentLocation);

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Missing Details', 'Please enter contact name and phone number.');
      return;
    }

    onAddContact({
      id: `ec-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      relationship,
      isPrimary: contacts.length === 0,
    });

    setName('');
    setPhone('');
    setIsAdding(false);
  };

  const handleCall = (contact: EmergencyContact) => {
    emergencyContactService.callContact(contact.phone);
  };

  const handleSms = (contact: EmergencyContact) => {
    emergencyContactService.sendEmergencySms(
      contact,
      riderName,
      currentLocation
        ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude }
        : null
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Ionicons name="shield-checkmark" size={18} color="#EF4444" />
          <Text style={styles.headerTitle}>EMERGENCY CONTACTS (SOS)</Text>
        </View>
        {!isAdding && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setIsAdding(true)}
          >
            <Ionicons name="add" size={14} color="#06B6D4" />
            <Text style={styles.addBtnText}>ADD CONTACT</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.subtext}>
        These contacts will receive immediate SOS coordinates during accidents or breakdowns.
      </Text>

      {/* Add New Contact Form */}
      {isAdding && (
        <View style={styles.addForm}>
          <Text style={styles.formTitle}>ADD EMERGENCY GUARDIAN</Text>
          <TextInput
            style={styles.input}
            placeholder="Guardian / Contact Name"
            placeholderTextColor="#64748B"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number (e.g. +91 98765 43210)"
            placeholderTextColor="#64748B"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <View style={styles.relRow}>
            {['Family', 'Friend', 'Doctor', 'Riding Buddy'].map((rel) => (
              <TouchableOpacity
                key={rel}
                style={[
                  styles.relChip,
                  relationship === rel && styles.relChipActive,
                ]}
                onPress={() => setRelationship(rel)}
              >
                <Text
                  style={[
                    styles.relText,
                    relationship === rel && styles.relTextActive,
                  ]}
                >
                  {rel}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.formActionRow}>
            <TouchableOpacity
              style={styles.cancelFormBtn}
              onPress={() => setIsAdding(false)}
            >
              <Text style={styles.cancelFormText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveFormBtn} onPress={handleSave}>
              <Text style={styles.saveFormText}>SAVE GUARDIAN</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Contact List */}
      {contacts.length === 0 && !isAdding ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="alert-circle-outline" size={24} color="#64748B" />
          <Text style={styles.emptyText}>No emergency contacts added yet.</Text>
        </View>
      ) : (
        <View style={styles.contactList}>
          {contacts.map((contact) => (
            <View key={contact.id} style={styles.contactItem}>
              <View style={styles.contactInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <View style={styles.relBadge}>
                    <Text style={styles.relBadgeText}>{contact.relationship}</Text>
                  </View>
                </View>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>

              <View style={styles.actionRow}>
                {/* 1-Tap Call */}
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => handleCall(contact)}
                >
                  <Ionicons name="call" size={14} color="#FFFFFF" />
                </TouchableOpacity>

                {/* 1-Tap SMS */}
                <TouchableOpacity
                  style={styles.smsBtn}
                  onPress={() => handleSms(contact)}
                >
                  <Ionicons name="chatbubble-ellipses" size={14} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Remove */}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => onRemoveContact(contact.id)}
                >
                  <Ionicons name="trash-outline" size={14} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 12,
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
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    color: '#06B6D4',
    fontSize: 10,
    fontWeight: '900',
  },
  subtext: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 12,
  },
  contactList: {
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0B1120',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  contactInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
  },
  relBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  relBadgeText: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '800',
  },
  contactPhone: {
    color: '#94A3B8',
    fontSize: 11,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addForm: {
    backgroundColor: '#0B1120',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  formTitle: {
    color: '#06B6D4',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    color: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  relRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  relChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  relChipActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderWidth: 1,
    borderColor: '#06B6D4',
  },
  relText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  relTextActive: {
    color: '#06B6D4',
  },
  formActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  cancelFormBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelFormText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
  },
  saveFormBtn: {
    backgroundColor: '#06B6D4',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveFormText: {
    color: '#090D16',
    fontSize: 11,
    fontWeight: '900',
  },
});
