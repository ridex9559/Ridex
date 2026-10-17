/**
 * RIDEX — Expense & Smart Splitting Engine
 * Computes category breakdowns, individual fair shares, and optimizes debt settlements.
 */

import {
  GroupExpense,
  ExpenseCategory,
  ExpenseSummary,
  MemberBalance,
  SettlementTransfer,
} from '../../types/expense';

export class ExpenseService {
  private static instance: ExpenseService | null = null;
  private expenseStore: Map<string, GroupExpense[]> = new Map();

  public static getInstance(): ExpenseService {
    if (!ExpenseService.instance) {
      ExpenseService.instance = new ExpenseService();
    }
    return ExpenseService.instance;
  }

  public getRideExpenses(rideId: string): GroupExpense[] {
    return this.expenseStore.get(rideId) || [];
  }

  public addExpense(expense: GroupExpense): void {
    const list = this.expenseStore.get(expense.rideId) || [];
    list.push(expense);
    this.expenseStore.set(expense.rideId, list);
  }

  public getRideExpenseSummary(
    rideId: string,
    allMembers: { userId: string; userName: string }[] = []
  ): ExpenseSummary {
    const expenses = this.getRideExpenses(rideId);
    return this.calculateSummary(expenses, allMembers);
  }

  /**
   * Computes comprehensive balance sheet and minimal debt settlements.
   */
  public calculateSummary(
    expenses: GroupExpense[],
    allMembers: { userId: string; userName: string }[]
  ): ExpenseSummary {
    const categoryTotals: Record<ExpenseCategory, number> = {
      FUEL: 0,
      FOOD: 0,
      HOTEL: 0,
      TOLL: 0,
      PARKING: 0,
      REPAIR: 0,
      OTHER: 0,
    };

    let totalAmount = 0;

    // Track total paid and total share per user
    const paidMap = new Map<string, number>();
    const shareMap = new Map<string, number>();
    const nameMap = new Map<string, string>();

    allMembers.forEach((m) => {
      paidMap.set(m.userId, 0);
      shareMap.set(m.userId, 0);
      nameMap.set(m.userId, m.userName);
    });

    expenses.forEach((exp) => {
      totalAmount += exp.amount;
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;

      // Add to payer
      paidMap.set(exp.paidByUserId, (paidMap.get(exp.paidByUserId) || 0) + exp.amount);
      if (!nameMap.has(exp.paidByUserId)) {
        nameMap.set(exp.paidByUserId, exp.paidByUserName);
      }

      // Split across participants
      const targets = exp.participantUserIds.length > 0 ? exp.participantUserIds : allMembers.map((m) => m.userId);
      const splitEach = exp.amount / Math.max(1, targets.length);

      targets.forEach((uid) => {
        shareMap.set(uid, (shareMap.get(uid) || 0) + splitEach);
      });
    });

    // Build Member Balances
    const memberBalances: MemberBalance[] = [];
    const netList: { userId: string; userName: string; net: number }[] = [];

    allMembers.forEach((m) => {
      const paid = paidMap.get(m.userId) || 0;
      const share = shareMap.get(m.userId) || 0;
      const net = Math.round(paid - share);

      memberBalances.push({
        userId: m.userId,
        userName: m.userName,
        paidAmount: Math.round(paid),
        shareAmount: Math.round(share),
        netBalance: net,
      });

      if (net !== 0) {
        netList.push({
          userId: m.userId,
          userName: m.userName,
          net,
        });
      }
    });

    // Smart Debt Minimization (Greedy matching debtor with creditor)
    const settlements: SettlementTransfer[] = [];
    const debtors = netList.filter((n) => n.net < 0).sort((a, b) => a.net - b.net);
    const creditors = netList.filter((n) => n.net > 0).sort((a, b) => b.net - a.net);

    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      const amountToSettle = Math.min(-debtor.net, creditor.net);
      if (amountToSettle > 0) {
        settlements.push({
          fromUserId: debtor.userId,
          fromUserName: debtor.userName,
          toUserId: creditor.userId,
          toUserName: creditor.userName,
          amount: Math.round(amountToSettle),
        });

        debtor.net += amountToSettle;
        creditor.net -= amountToSettle;
      }

      if (Math.abs(debtor.net) < 1) dIdx++;
      if (Math.abs(creditor.net) < 1) cIdx++;
    }

    return {
      totalAmount: Math.round(totalAmount),
      categoryTotals,
      memberBalances,
      settlements,
    };
  }
}

export const expenseService = ExpenseService.getInstance();
