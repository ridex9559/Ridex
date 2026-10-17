using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RIDEX.Core.Entities;
using RIDEX.Infrastructure.Data;
using RIDEX.Shared.Algorithms;
using RIDEX.Shared.DTOs;
using RIDEX.Shared.Enums;

namespace RIDEX.API.Controllers;

[AllowAnonymous]
public class ExpensesController : BaseApiController
{
    private readonly RideXDbContext _dbContext;
    private readonly ILogger<ExpensesController> _logger;

    public ExpensesController(RideXDbContext dbContext, ILogger<ExpensesController> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    [HttpGet("ride/{rideId:guid}")]
    [ProducesResponseType(typeof(List<ExpenseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRideExpenses(Guid rideId)
    {
        var expenses = await _dbContext.Expenses
            .AsNoTracking()
            .Include(e => e.PaidByUser)
            .Include(e => e.Participants)
                .ThenInclude(p => p.User)
            .Where(e => e.RideId == rideId && !e.IsDeleted)
            .OrderByDescending(e => e.IncurredAt)
            .Select(e => MapToDto(e))
            .ToListAsync();

        return Ok(expenses);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ExpenseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateExpenseRequest request)
    {
        var ride = await _dbContext.Rides
            .Include(r => r.Members)
            .FirstOrDefaultAsync(r => r.Id == request.RideId && !r.IsDeleted);

        if (ride == null)
            return NotFound(new { message = "Ride not found." });

        var expense = new Expense
        {
            Id = Guid.NewGuid(),
            RideId = request.RideId,
            PaidByUserId = CurrentUserId,
            Title = request.Title.Trim(),
            Amount = request.Amount,
            Category = request.Category,
            Currency = request.Currency,
            Notes = request.Notes,
            IncurredAt = request.IncurredAt,
            CreatedAt = DateTime.UtcNow
        };

        var participantUserIds = (request.SplitAmongUserIds != null && request.SplitAmongUserIds.Count > 0)
            ? request.SplitAmongUserIds
            : ride.Members.Select(m => m.UserId).ToList();

        if (participantUserIds.Count == 0)
            participantUserIds.Add(CurrentUserId);

        var share = Math.Round(request.Amount / participantUserIds.Count, 2);

        foreach (var pUserId in participantUserIds)
        {
            expense.Participants.Add(new ExpenseParticipant
            {
                Id = Guid.NewGuid(),
                ExpenseId = expense.Id,
                UserId = pUserId,
                ShareAmount = share,
                HasSettled = pUserId == CurrentUserId, // Payer is already settled
                CreatedAt = DateTime.UtcNow
            });
        }

        _dbContext.Expenses.Add(expense);
        await _dbContext.SaveChangesAsync();

        var created = await _dbContext.Expenses
            .Include(e => e.PaidByUser)
            .Include(e => e.Participants)
                .ThenInclude(p => p.User)
            .FirstAsync(e => e.Id == expense.Id);

        return CreatedAtAction(nameof(GetRideExpenses), new { rideId = expense.RideId }, MapToDto(created));
    }

    [HttpGet("ride/{rideId:guid}/summary")]
    [ProducesResponseType(typeof(ExpenseSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetExpenseSummary(Guid rideId)
    {
        var expenses = await _dbContext.Expenses
            .Include(e => e.PaidByUser)
            .Include(e => e.Participants)
                .ThenInclude(p => p.User)
            .Where(e => e.RideId == rideId && !e.IsDeleted)
            .ToListAsync();

        var rideMembers = await _dbContext.RideMembers
            .Include(m => m.User)
            .Where(m => m.RideId == rideId)
            .ToListAsync();

        var totalAmount = expenses.Sum(e => e.Amount);
        var categoryBreakdown = expenses
            .GroupBy(e => e.Category)
            .ToDictionary(g => g.Key, g => g.Sum(e => e.Amount));

        // Prepare Rider Expense Inputs for Settlement Algorithm
        var riderInputs = new List<RiderExpenseInput>();
        foreach (var member in rideMembers)
        {
            var paidTotal = expenses.Where(e => e.PaidByUserId == member.UserId).Sum(e => e.Amount);
            var shareTotal = expenses.SelectMany(e => e.Participants).Where(p => p.UserId == member.UserId).Sum(p => p.ShareAmount);

            riderInputs.Add(new RiderExpenseInput
            {
                UserId = member.UserId,
                UserName = member.User.FullName,
                TotalPaid = paidTotal,
                FairShare = shareTotal
            });
        }

        var settlement = ExpenseSettlementAlgorithm.CalculateSettlement(riderInputs);

        var summary = new ExpenseSummaryDto
        {
            RideId = rideId,
            TotalExpenses = totalAmount,
            TotalTransactionsCount = settlement.Transactions.Count,
            CategoryBreakdown = categoryBreakdown,
            Expenses = expenses.Select(MapToDto).ToList(),
            Settlement = settlement
        };

        return Ok(summary);
    }

    private static ExpenseDto MapToDto(Expense e)
    {
        return new ExpenseDto
        {
            Id = e.Id,
            RideId = e.RideId,
            PaidByUserId = e.PaidByUserId,
            PaidByUserName = e.PaidByUser?.FullName ?? string.Empty,
            Title = e.Title,
            Amount = e.Amount,
            Category = e.Category,
            Currency = e.Currency,
            Notes = e.Notes,
            IncurredAt = e.IncurredAt,
            Participants = e.Participants.Select(p => new ExpenseParticipantDto
            {
                UserId = p.UserId,
                UserName = p.User?.FullName ?? string.Empty,
                ShareAmount = p.ShareAmount,
                HasSettled = p.HasSettled
            }).ToList()
        };
    }
}
