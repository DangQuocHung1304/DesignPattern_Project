namespace HealthySystem.API.DesignPatterns.Facade;

public sealed record StartVisitCommand(
    string AppointmentCode,
    string DoctorCode,
    string PatientCode,
    DateTime VisitTime,
    decimal InitialFee);

public sealed record StartVisitResult(
    string EncounterCode,
    string InvoiceCode,
    string Message);

public interface IAppointmentValidator
{
    Task<bool> ValidateAsync(StartVisitCommand command, CancellationToken cancellationToken = default);
}

public interface IEncounterDraftCreator
{
    Task<string> CreateEncounterDraftAsync(StartVisitCommand command, CancellationToken cancellationToken = default);
}

public interface IInvoiceDraftCreator
{
    Task<string> CreateInvoiceDraftAsync(StartVisitCommand command, CancellationToken cancellationToken = default);
}

public interface INotificationDispatcher
{
    Task DispatchVisitStartedAsync(StartVisitCommand command, CancellationToken cancellationToken = default);
}

public sealed class AppointmentValidator : IAppointmentValidator
{
    public Task<bool> ValidateAsync(StartVisitCommand command, CancellationToken cancellationToken = default)
    {
        var isValid = command.VisitTime <= DateTime.UtcNow.AddHours(4) && command.InitialFee >= 0;
        return Task.FromResult(isValid);
    }
}

public sealed class EncounterDraftCreator : IEncounterDraftCreator
{
    public Task<string> CreateEncounterDraftAsync(StartVisitCommand command, CancellationToken cancellationToken = default)
    {
        return Task.FromResult($"ENC-{command.AppointmentCode}");
    }
}

public sealed class InvoiceDraftCreator : IInvoiceDraftCreator
{
    public Task<string> CreateInvoiceDraftAsync(StartVisitCommand command, CancellationToken cancellationToken = default)
    {
        return Task.FromResult($"INV-{command.AppointmentCode}");
    }
}

public sealed class NotificationDispatcher : INotificationDispatcher
{
    public Task DispatchVisitStartedAsync(StartVisitCommand command, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
}

public interface IVisitWorkflowFacade
{
    Task<StartVisitResult> StartVisitAsync(StartVisitCommand command, CancellationToken cancellationToken = default);
}

public sealed class VisitWorkflowFacade : IVisitWorkflowFacade
{
    private readonly IAppointmentValidator _appointmentValidator;
    private readonly IEncounterDraftCreator _encounterDraftCreator;
    private readonly IInvoiceDraftCreator _invoiceDraftCreator;
    private readonly INotificationDispatcher _notificationDispatcher;

    public VisitWorkflowFacade(
        IAppointmentValidator appointmentValidator,
        IEncounterDraftCreator encounterDraftCreator,
        IInvoiceDraftCreator invoiceDraftCreator,
        INotificationDispatcher notificationDispatcher)
    {
        _appointmentValidator = appointmentValidator;
        _encounterDraftCreator = encounterDraftCreator;
        _invoiceDraftCreator = invoiceDraftCreator;
        _notificationDispatcher = notificationDispatcher;
    }

    public async Task<StartVisitResult> StartVisitAsync(StartVisitCommand command, CancellationToken cancellationToken = default)
    {
        var isValid = await _appointmentValidator.ValidateAsync(command, cancellationToken);
        if (!isValid)
        {
            throw new InvalidOperationException("Appointment is invalid for visit start workflow.");
        }

        var encounterCode = await _encounterDraftCreator.CreateEncounterDraftAsync(command, cancellationToken);
        var invoiceCode = await _invoiceDraftCreator.CreateInvoiceDraftAsync(command, cancellationToken);

        await _notificationDispatcher.DispatchVisitStartedAsync(command, cancellationToken);

        return new StartVisitResult(
            EncounterCode: encounterCode,
            InvoiceCode: invoiceCode,
            Message: "Visit workflow started successfully.");
    }
}
