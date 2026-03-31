namespace HealthySystem.API.DesignPatterns.Strategy;

public sealed record PaymentRequest(
    string InvoiceCode,
    decimal Amount,
    string Currency,
    string Method,
    string PayerCode);

public sealed record PaymentResult(
    bool Success,
    string Method,
    string TransactionCode,
    string Message,
    DateTime ProcessedAtUtc);

public interface IPaymentStrategy
{
    string Method { get; }
    Task<PaymentResult> ExecuteAsync(PaymentRequest request, CancellationToken cancellationToken = default);
}

public sealed class CashPaymentStrategy : IPaymentStrategy
{
    public string Method => "cash";

    public Task<PaymentResult> ExecuteAsync(PaymentRequest request, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new PaymentResult(
            Success: true,
            Method: Method,
            TransactionCode: $"CASH-{request.InvoiceCode}",
            Message: "Thanh toan tien mat tai quay thu ngan thanh cong.",
            ProcessedAtUtc: DateTime.UtcNow));
    }
}

public sealed class CardPaymentStrategy : IPaymentStrategy
{
    public string Method => "card";

    public Task<PaymentResult> ExecuteAsync(PaymentRequest request, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new PaymentResult(
            Success: true,
            Method: Method,
            TransactionCode: $"CARD-{request.InvoiceCode}",
            Message: "Thanh toan the da duoc chap nhan qua cong POS.",
            ProcessedAtUtc: DateTime.UtcNow));
    }
}

public sealed class InsurancePaymentStrategy : IPaymentStrategy
{
    public string Method => "insurance";

    public Task<PaymentResult> ExecuteAsync(PaymentRequest request, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new PaymentResult(
            Success: true,
            Method: Method,
            TransactionCode: $"BHYT-{request.InvoiceCode}",
            Message: "Thanh toan thong qua bao hiem y te da duoc ghi nhan.",
            ProcessedAtUtc: DateTime.UtcNow));
    }
}

public interface IPaymentProcessor
{
    Task<PaymentResult> ProcessAsync(PaymentRequest request, CancellationToken cancellationToken = default);
}

public sealed class PaymentProcessor : IPaymentProcessor
{
    private readonly Dictionary<string, IPaymentStrategy> _strategies;

    public PaymentProcessor(IEnumerable<IPaymentStrategy> strategies)
    {
        _strategies = strategies.ToDictionary(s => s.Method, StringComparer.OrdinalIgnoreCase);
    }

    public Task<PaymentResult> ProcessAsync(PaymentRequest request, CancellationToken cancellationToken = default)
    {
        if (!_strategies.TryGetValue(request.Method, out var strategy))
        {
            throw new InvalidOperationException($"Payment method '{request.Method}' is not supported.");
        }

        return strategy.ExecuteAsync(request, cancellationToken);
    }
}
