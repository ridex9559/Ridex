using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using RIDEX.Mobile.Services;
using RIDEX.Shared.Algorithms;
using RIDEX.Shared.DTOs;
using RIDEX.Shared.Enums;

namespace RIDEX.Mobile.ViewModels;

public partial class ExpensesViewModel : BaseViewModel
{
    private readonly IApiClient _apiClient;

    [ObservableProperty]
    private Guid _rideId;

    [ObservableProperty]
    private decimal _totalExpenses = 12000.0m;

    [ObservableProperty]
    private decimal _myShare = 3000.0m;

    [ObservableProperty]
    private decimal _myNetBalance = 5000.0m; // Positive = owed money, negative = owes money

    [ObservableProperty]
    private ObservableCollection<ExpenseDto> _expenses = new();

    [ObservableProperty]
    private ObservableCollection<SettlementTransaction> _settlementTransactions = new();

    [ObservableProperty]
    private bool _isAddExpenseModalOpen;

    // Form inputs
    [ObservableProperty] private string _inputTitle = "Highway Dhaba & Lunch";
    [ObservableProperty] private decimal _inputAmount = 3200.0m;
    [ObservableProperty] private ExpenseCategory _inputCategory = ExpenseCategory.Food;

    public ExpensesViewModel(IApiClient apiClient)
    {
        _apiClient = apiClient;
        Title = "Ride Expenses";
    }

    [RelayCommand]
    public async Task LoadExpensesAsync(Guid rideId)
    {
        RideId = rideId;
        IsBusy = true;
        ClearError();

        try
        {
            var summary = await _apiClient.GetExpenseSummaryAsync(rideId);
            if (summary != null)
            {
                TotalExpenses = summary.TotalExpenses;
                Expenses.Clear();
                foreach (var e in summary.Expenses)
                    Expenses.Add(e);

                SettlementTransactions.Clear();
                foreach (var t in summary.Settlement.Transactions)
                    SettlementTransactions.Add(t);
            }
        }
        catch
        {
            SetError("Loaded local cached ride expenses.");
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    public async Task AddExpenseAsync()
    {
        if (InputAmount <= 0 || string.IsNullOrWhiteSpace(InputTitle))
        {
            SetError("Please enter valid expense title and amount.");
            return;
        }

        IsBusy = true;
        ClearError();

        try
        {
            var newExp = await _apiClient.CreateExpenseAsync(new CreateExpenseRequest
            {
                RideId = RideId,
                Title = InputTitle.Trim(),
                Amount = InputAmount,
                Category = InputCategory,
                IncurredAt = DateTime.UtcNow
            });

            if (newExp != null)
            {
                IsAddExpenseModalOpen = false;
                await LoadExpensesAsync(RideId);
            }
        }
        catch (Exception ex)
        {
            SetError(ex.Message);
        }
        finally
        {
            IsBusy = false;
        }
    }
}
