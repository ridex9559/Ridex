namespace RIDEX.Shared.Algorithms;

public class RiderExpenseInput
{
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public decimal TotalPaid { get; set; }
    public decimal FairShare { get; set; }
}

public class SettlementTransaction
{
    public Guid FromUserId { get; set; }
    public string FromUserName { get; set; } = string.Empty;
    public Guid ToUserId { get; set; }
    public string ToUserName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class SettlementResult
{
    public decimal TotalGroupExpense { get; set; }
    public int TotalParticipants { get; set; }
    public decimal AverageShare { get; set; }
    public Dictionary<Guid, decimal> NetBalances { get; set; } = new();
    public List<SettlementTransaction> Transactions { get; set; } = new();
}

/// <summary>
/// Computes optimal debt settlement minimizing total transactions between group ride members.
/// </summary>
public static class ExpenseSettlementAlgorithm
{
    private const decimal Epsilon = 0.01m;

    /// <summary>
    /// Calculates net balances and generates minimum bilateral settlement transfers.
    /// </summary>
    public static SettlementResult CalculateSettlement(IReadOnlyList<RiderExpenseInput> inputs)
    {
        var result = new SettlementResult
        {
            TotalParticipants = inputs.Count,
            TotalGroupExpense = inputs.Sum(x => x.TotalPaid)
        };

        if (inputs.Count == 0)
            return result;

        result.AverageShare = result.TotalGroupExpense / inputs.Count;

        // Calculate Net Balance: (Paid - FairShare)
        // Positive means the rider is owed money (creditor)
        // Negative means the rider owes money (debtor)
        var debtors = new List<(Guid UserId, string Name, decimal Amount)>();
        var creditors = new List<(Guid UserId, string Name, decimal Amount)>();

        foreach (var rider in inputs)
        {
            var net = rider.TotalPaid - rider.FairShare;
            result.NetBalances[rider.UserId] = net;

            if (net < -Epsilon)
            {
                debtors.Add((rider.UserId, rider.UserName, -net)); // positive debt amount
            }
            else if (net > Epsilon)
            {
                creditors.Add((rider.UserId, rider.UserName, net)); // positive credit amount
            }
        }

        // Greedy matching: largest debtor pays largest creditor
        debtors = debtors.OrderByDescending(d => d.Amount).ToList();
        creditors = creditors.OrderByDescending(c => c.Amount).ToList();

        int debtorIdx = 0;
        int creditorIdx = 0;

        while (debtorIdx < debtors.Count && creditorIdx < creditors.Count)
        {
            var debtor = debtors[debtorIdx];
            var creditor = creditors[creditorIdx];

            var transferAmount = Math.Min(debtor.Amount, creditor.Amount);
            if (transferAmount > Epsilon)
            {
                result.Transactions.Add(new SettlementTransaction
                {
                    FromUserId = debtor.UserId,
                    FromUserName = debtor.Name,
                    ToUserId = creditor.UserId,
                    ToUserName = creditor.Name,
                    Amount = Math.Round(transferAmount, 2)
                });
            }

            debtor.Amount -= transferAmount;
            creditor.Amount -= transferAmount;

            debtors[debtorIdx] = debtor;
            creditors[creditorIdx] = creditor;

            if (debtor.Amount <= Epsilon)
                debtorIdx++;

            if (creditor.Amount <= Epsilon)
                creditorIdx++;
        }

        return result;
    }
}
