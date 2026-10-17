import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GroupExpense, ExpenseCategory } from '../../types/expense';

interface ExpenseManagerModalProps {
  visible: boolean;
  onClose: () => void;
  rideId: string;
  members: { userId: string; userName: string }[];
  currentUserId?: string;
  onAddExpense: (expense: GroupExpense) => void;
}

const CATEGORIES: { type: ExpenseCategory; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { type: 'FUEL', label: 'Fuel / Gas', icon: 'flash', color: '#06B6D4' },
  { type: 'FOOD', label: 'Breakfast / Food', icon: 'restaurant', color: '#F59E0B' },
  { type: 'TOLL', label: 'Toll Plaza', icon: 'receipt', color: '#10B981' },
  { type: 'HOTEL', label: 'Hotel / Stay', icon: 'bed', color: '#A855F7' },
  { type: 'PARKING', label: 'Parking Fee', icon: 'car', color: '#38BDF8' },
  { type: 'REPAIR', label: 'Bike Repair / Spares', icon: 'construct', color: '#EF4444' },
  { type: 'OTHER', label: 'Other Misc', icon: 'apps', color: '#94A3B8' },
];

export const ExpenseManagerModal: React.FC<ExpenseManagerModalProps> = ({
  visible,
  onClose,
  rideId,
  members,
  currentUserId,
  onAddExpense,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('FOOD');
  const [paidByUserId, setPaidByUserId] = useState(currentUserId || (members[0]?.userId ?? 'user-1'));
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    members.map((m) => m.userId)
  );

  const toggleParticipant = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      if (selectedParticipants.length === 1) {
        Alert.alert('Notice', 'At least one participant must share the expense.');
        return;
      }
      setSelectedParticipants(selectedParticipants.filter((id) => id !== userId));
    } else {
      setSelectedParticipants([...selectedParticipants, userId]);
    }
  };

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid expense title and amount in INR.');
      return;
    }

    const payer = members.find((m) => m.userId === paidByUserId) || {
      userId: paidByUserId,
      userName: 'Road Captain',
    };

    const newExpense: GroupExpense = {
      id: `exp-${Date.now()}`,
      rideId,
      title: title.trim(),
      category,
      amount: parsedAmount,
      paidByUserId: payer.userId,
      paidByUserName: payer.userName,
      participantUserIds: selectedParticipants,
      createdAt: new Date().toISOString(),
    };

    onAddExpense(newExpense);
    setTitle('');
    setAmount('');
    onClose();
    Alert.alert('Expense Added', `₹${parsedAmount} for "${newExpense.title}" split across ${selectedParticipants.length} riders.`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Ionicons name="wallet" size={20} color="#06B6D4" />
              <Text style={styles.headerTitle}>LOG SQUAD EXPENSE</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Amount Input */}
            <Text style={styles.inputLabel}>AMOUNT (₹ INR)</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="₹ 0"
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            {/* Title */}
            <Text style={styles.inputLabel}>EXPENSE TITLE / PLACE</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Sunny Da Dhaba Breakfast"
              placeholderTextColor="#64748B"
              value={title}
              onChangeText={setTitle}
            />

            {/* Category Selector */}
            <Text style={styles.inputLabel}>CATEGORY</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.type}
                  style={[
                    styles.catChip,
                    category === cat.type && {
                      backgroundColor: `${cat.color}20`,
                      borderColor: cat.color,
                    },
                  ]}
                  onPress={() => setCategory(cat.type)}
                >
                  <Ionicons
                    name={cat.icon}
                    size={14}
                    color={category === cat.type ? cat.color : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.catText,
                      category === cat.type && { color: cat.color, fontWeight: '800' },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Who Paid */}
            <Text style={styles.inputLabel}>WHO PAID?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.payersScroll}>
              {members.map((m) => (
                <TouchableOpacity
                  key={m.userId}
                  style={[
                    styles.payerChip,
                    paidByUserId === m.userId && styles.payerChipActive,
                  ]}
                  onPress={() => setPaidByUserId(m.userId)}
                >
                  <Text
                    style={[
                      styles.payerText,
                      paidByUserId === m.userId && styles.payerTextActive,
                    ]}
                  >
                    {m.userName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Split Participants */}
            <Text style={styles.inputLabel}>
              SPLIT EQUALLY AMONG ({selectedParticipants.length} RIDERS)
            </Text>
            <View style={styles.participantsList}>
              {members.map((m) => {
                const isSelected = selectedParticipants.includes(m.userId);
                return (
                  <TouchableOpacity
                    key={m.userId}
                    style={[styles.participantRow, isSelected && styles.participantRowActive]}
                    onPress={() => toggleParticipant(m.userId)}
                  >
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={18}
                      color={isSelected ? '#06B6D4' : '#64748B'}
                    />
                    <Text style={[styles.participantName, isSelected && styles.participantNameActive]}>
                      {m.userName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer Save */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="checkmark-done" size={18} color="#090D16" />
              <Text style={styles.saveBtnText}>SPLIT & SAVE EXPENSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  body: {
    padding: 16,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 6,
  },
  amountInput: {
    backgroundColor: '#0B1120',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#06B6D4',
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: {
    backgroundColor: '#0B1120',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#F8FAFC',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1120',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 6,
  },
  catText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  payersScroll: {
    flexDirection: 'row',
  },
  payerChip: {
    backgroundColor: '#0B1120',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginRight: 8,
  },
  payerChipActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderColor: '#06B6D4',
  },
  payerText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  payerTextActive: {
    color: '#06B6D4',
    fontWeight: '900',
  },
  participantsList: {
    gap: 6,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1120',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 10,
  },
  participantRowActive: {
    borderColor: '#06B6D4',
  },
  participantName: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  participantNameActive: {
    color: '#F8FAFC',
    fontWeight: '800',
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
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
