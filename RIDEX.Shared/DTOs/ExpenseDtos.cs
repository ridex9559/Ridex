using System.ComponentModel.DataAnnotations;
using RIDEX.Shared.Algorithms;
using RIDEX.Shared.Enums;

namespace RIDEX.Shared.DTOs;

public class ExpenseDto
{
    public Guid Id { get; set; }
    public Guid RideId { get; set; }
    public Guid PaidByUserId { get; set; }
    public string PaidByUserName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public ExpenseCategory Category { get; set; }
    public string Currency { get; set; } = "INR";
    public string? Notes { get; set; }
    public DateTime IncurredAt { get; set; }
    public List<ExpenseParticipantDto> Participants { get; set; } = new();
}

public class ExpenseParticipantDto
{
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public decimal ShareAmount { get; set; }
    public bool HasSettled { get; set; }
}

public class CreateExpenseRequest
{
    [Required]
    public Guid RideId { get; set; }

    [Required, MinLength(2), MaxLength(100)]
    public string Title { get; set; } = string.Empty;

    [Range(0.01, 10000000.0)]
    public decimal Amount { get; set; }

    public ExpenseCategory Category { get; set; } = ExpenseCategory.Food;

    public string Currency { get; set; } = "INR";

    public string? Notes { get; set; }

    public DateTime IncurredAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// User IDs of riders sharing this expense. If empty or null, split equally across all active ride members.
    /// </summary>
    public List<Guid>? SplitAmongUserIds { get; set; }
}

public class ExpenseSummaryDto
{
    public Guid RideId { get; set; }
    public decimal TotalExpenses { get; set; }
    public int TotalTransactionsCount { get; set; }
    public Dictionary<ExpenseCategory, decimal> CategoryBreakdown { get; set; } = new();
    public List<ExpenseDto> Expenses { get; set; } = new();
    public SettlementResult Settlement { get; set; } = new();
}
