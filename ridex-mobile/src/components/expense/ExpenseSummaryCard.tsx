import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { expenseService } from '../../services/expense/ExpenseService';
import { ExpenseSummary, GroupExpense } from '../../types/expense';
import { ExpenseManagerModal } from './ExpenseManagerModal';

export interface ExpenseMemberItem {
  userId: string;
  userName: string;
}

interface ExpenseSummaryCardProps {
  rideId: string;
  members: ExpenseMemberItem[];
  currentUserId?: string;
  isOrganizer?: boolean;
}

export const ExpenseSummaryCard: React.FC<ExpenseSummaryCardProps> = ({
  rideId,
  members,
  currentUserId,
  isOrganizer,
}) => {
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [expensesList, setExpensesList] = useState<GroupExpense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadSummary = () => {
    const list = expenseService.getRideExpenses(rideId);
    setExpensesList(list);
    const data = expenseService.calculateSummary(list, members);
    setSummary(data);
  };

  useEffect(() => {
    loadSummary();
  }, [rideId, members]);

  const handleAddExpense = (expense: GroupExpense) => {
    expenseService.addExpense(expense);
    loadSummary();
  };

  const totalSpent = summary?.totalAmount || 0;
  const expenseCount = expensesList.length;
  const settlements = summary?.settlements || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconBox}>
            <Ionicons name="wallet" size={16} color="#10B981" />
          </View>
          <View>
            <Text style={styles.title}>SQUAD EXPENSE SPLIT</Text>
            <Text style={styles.subtitle}>{expenseCount} expenses logged</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.manageBtn}
          onPress={() => setIsModalOpen(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={14} color="#000" />
          <Text style={styles.manageBtnText}>LOG / SPLIT</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>TOTAL SQUAD SPEND</Text>
          <Text style={styles.metricVal}>₹{totalSpent.toLocaleString()}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>SETTLEMENT TRANSFERS</Text>
          <Text style={[styles.metricVal, { color: settlements.length > 0 ? '#F59E0B' : '#10B981' }]}>
            {settlements.length === 0 ? 'All Settled' : `${settlements.length} Pending`}
          </Text>
        </View>
      </View>

      {/* Mini Settlements Preview */}
      {settlements.length > 0 ? (
        <View style={styles.settlementsList}>
          <Text style={styles.settlementsHeading}>OPTIMAL DEBT SETTLEMENTS (MIN TRANSFERS)</Text>
          {settlements.slice(0, 3).map((transfer, idx) => (
            <View key={idx} style={styles.transferRow}>
              <View style={styles.transferParties}>
                <Text style={styles.debtorName}>{transfer.fromUserName}</Text>
                <Ionicons name="arrow-forward" size={12} color="#94A3B8" />
                <Text style={styles.creditorName}>{transfer.toUserName}</Text>
              </View>
              <Text style={styles.transferAmount}>₹{transfer.amount.toLocaleString()}</Text>
            </View>
          ))}
          {settlements.length > 3 && (
            <TouchableOpacity onPress={() => setIsModalOpen(true)}>
              <Text style={styles.viewMoreText}>+{settlements.length - 3} more transfers</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.emptyPrompt}>
          <Text style={styles.emptyText}>
            {expenseCount === 0
              ? 'Split fuel, tolls, meals, & hotel bills equally or custom.'
              : '🎉 All member balances are fully balanced!'}
          </Text>
        </View>
      )}

      {/* Full Modal */}
      <ExpenseManagerModal
        visible={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          loadSummary();
        }}
        rideId={rideId}
        members={members}
        currentUserId={currentUserId}
        onAddExpense={handleAddExpense}
      />
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
    marginVertical: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 11,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  manageBtnText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 10,
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricVal: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '900',
  },
  settlementsList: {
    backgroundColor: '#141E33',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  settlementsHeading: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  transferRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  transferParties: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  debtorName: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  creditorName: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  transferAmount: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
  },
  viewMoreText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  emptyPrompt: {
    paddingVertical: 4,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
  },
});
