using RIDEX.Shared.Enums;

namespace RIDEX.Core.Entities;

public class Expense : BaseEntity
{
    public Guid RideId { get; set; }
    public Ride Ride { get; set; } = null!;

    public Guid PaidByUserId { get; set; }
    public User PaidByUser { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public ExpenseCategory Category { get; set; } = ExpenseCategory.Food;
    public string Currency { get; set; } = "INR";
    public string? Notes { get; set; }
    public DateTime IncurredAt { get; set; } = DateTime.UtcNow;

    public ICollection<ExpenseParticipant> Participants { get; set; } = new List<ExpenseParticipant>();
}

public class ExpenseParticipant : BaseEntity
{
    public Guid ExpenseId { get; set; }
    public Expense Expense { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public decimal ShareAmount { get; set; }
    public bool HasSettled { get; set; } = false;
}
