using FluentAssertions;
using RIDEX.Shared.Algorithms;
using Xunit;

namespace RIDEX.Tests.Algorithms;

public class ExpenseSettlementTests
{
    [Fact]
    public void CalculateSettlement_WithUnequalPayments_MinimizesTransactions()
    {
        // Arrange: 3 Riders, Total = ₹15,000 (Fair share = ₹5,000 each)
        // Aryan paid ₹8,000 (Net +₹3,000)
        // Vikram paid ₹5,000 (Net ₹0)
        // Neha paid ₹2,000 (Net -₹3,000)
        var aryanId = Guid.NewGuid();
        var vikramId = Guid.NewGuid();
        var nehaId = Guid.NewGuid();

        var inputs = new List<RiderExpenseInput>
        {
            new() { UserId = aryanId, UserName = "Aryan", TotalPaid = 8000, FairShare = 5000 },
            new() { UserId = vikramId, UserName = "Vikram", TotalPaid = 5000, FairShare = 5000 },
            new() { UserId = nehaId, UserName = "Neha", TotalPaid = 2000, FairShare = 5000 }
        };

        // Act
        var result = ExpenseSettlementAlgorithm.CalculateSettlement(inputs);

        // Assert
        result.TotalGroupExpense.Should().Be(15000);
        result.AverageShare.Should().Be(5000);
        result.Transactions.Should().HaveCount(1);

        var txn = result.Transactions[0];
        txn.FromUserId.Should().Be(nehaId);
        txn.ToUserId.Should().Be(aryanId);
        txn.Amount.Should().Be(3000);
    }

    [Fact]
    public void CalculateSettlement_WithSixRiders_ResolvesOptimalTransfers()
    {
        // 6 Riders, Total = ₹15,000 (Fair share = ₹2,500 each)
        // Amit paid ₹5,000 (Owed +₹2,500)
        // Pratik paid ₹4,000 (Owed +₹1,500)
        // Rahul paid ₹2,000 (Owes -₹500)
        // Rider 4 paid ₹2,000 (Owes -₹500)
        // Rider 5 paid ₹1,500 (Owes -₹1,000)
        // Rider 6 paid ₹500 (Owes -₹2,000)

        var amit = Guid.NewGuid();
        var pratik = Guid.NewGuid();
        var rahul = Guid.NewGuid();
        var r4 = Guid.NewGuid();
        var r5 = Guid.NewGuid();
        var r6 = Guid.NewGuid();

        var inputs = new List<RiderExpenseInput>
        {
            new() { UserId = amit, UserName = "Amit", TotalPaid = 5000, FairShare = 2500 },
            new() { UserId = pratik, UserName = "Pratik", TotalPaid = 4000, FairShare = 2500 },
            new() { UserId = rahul, UserName = "Rahul", TotalPaid = 2000, FairShare = 2500 },
            new() { UserId = r4, UserName = "Rider 4", TotalPaid = 2000, FairShare = 2500 },
            new() { UserId = r5, UserName = "Rider 5", TotalPaid = 1500, FairShare = 2500 },
            new() { UserId = r6, UserName = "Rider 6", TotalPaid = 500, FairShare = 2500 }
        };

        var result = ExpenseSettlementAlgorithm.CalculateSettlement(inputs);

        result.TotalGroupExpense.Should().Be(15000);
        result.AverageShare.Should().Be(2500);
        result.Transactions.Sum(t => t.Amount).Should().Be(4000); // Total transferred must equal total net credits (2500 + 1500 = 4000)
    }

    [Fact]
    public void CalculateSettlement_WhenEveryonePaidExactShare_ReturnsNoTransactions()
    {
        var id1 = Guid.NewGuid();
        var id2 = Guid.NewGuid();

        var inputs = new List<RiderExpenseInput>
        {
            new() { UserId = id1, UserName = "Rider 1", TotalPaid = 1000, FairShare = 1000 },
            new() { UserId = id2, UserName = "Rider 2", TotalPaid = 1000, FairShare = 1000 }
        };

        var result = ExpenseSettlementAlgorithm.CalculateSettlement(inputs);
        result.Transactions.Should().BeEmpty();
    }
}
