/**
 * RIDEX — Expense & Smart Splitting Domain Models
 */

export type ExpenseCategory =
  | 'FUEL'
  | 'FOOD'
  | 'HOTEL'
  | 'TOLL'
  | 'PARKING'
  | 'REPAIR'
  | 'OTHER';

export interface GroupExpense {
  id: string;
  rideId: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  paidByUserId: string;
  paidByUserName: string;
  participantUserIds: string[]; // List of users sharing this expense
  createdAt: string;
}

export interface MemberBalance {
  userId: string;
  userName: string;
  paidAmount: number;
  shareAmount: number;
  netBalance: number; // positive = owed money, negative = owes money
}

export interface SettlementTransfer {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
}

export interface ExpenseSummary {
  totalAmount: number;
  categoryTotals: Record<ExpenseCategory, number>;
  memberBalances: MemberBalance[];
  settlements: SettlementTransfer[];
}
