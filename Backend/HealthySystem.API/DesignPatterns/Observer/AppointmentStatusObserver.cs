namespace HealthySystem.API.DesignPatterns.Observer;

public sealed record AppointmentStatusChangedEvent(
    string AppointmentCode,
    string PreviousStatus,
    string NewStatus,
    DateTime ChangedAtUtc);

public interface IAppointmentStatusObserver
{
    string Name { get; }
    Task OnStatusChangedAsync(AppointmentStatusChangedEvent @event, CancellationToken cancellationToken = default);
}

public interface IAppointmentStatusSubject
{
    void Subscribe(IAppointmentStatusObserver observer);
    void Unsubscribe(string observerName);
    Task NotifyAsync(AppointmentStatusChangedEvent @event, CancellationToken cancellationToken = default);
}

public sealed class AppointmentStatusSubject : IAppointmentStatusSubject
{
    private readonly object _lock = new();
    private readonly List<IAppointmentStatusObserver> _observers = new();

    public void Subscribe(IAppointmentStatusObserver observer)
    {
        lock (_lock)
        {
            _observers.Add(observer);
        }
    }

    public void Unsubscribe(string observerName)
    {
        lock (_lock)
        {
            _observers.RemoveAll(o => string.Equals(o.Name, observerName, StringComparison.OrdinalIgnoreCase));
        }
    }

    public async Task NotifyAsync(AppointmentStatusChangedEvent @event, CancellationToken cancellationToken = default)
    {
        List<IAppointmentStatusObserver> snapshot;
        lock (_lock)
        {
            snapshot = _observers.ToList();
        }

        foreach (var observer in snapshot)
        {
            await observer.OnStatusChangedAsync(@event, cancellationToken);
        }
    }
}

public sealed class DoctorScheduleObserver : IAppointmentStatusObserver
{
    public string Name => "doctor-schedule";

    public Task OnStatusChangedAsync(AppointmentStatusChangedEvent @event, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
}

public sealed class ReceptionDeskObserver : IAppointmentStatusObserver
{
    public string Name => "reception-desk";

    public Task OnStatusChangedAsync(AppointmentStatusChangedEvent @event, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
}

public sealed class PatientNotificationObserver : IAppointmentStatusObserver
{
    public string Name => "patient-notification";

    public Task OnStatusChangedAsync(AppointmentStatusChangedEvent @event, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
}

public interface IAppointmentStatusCoordinator
{
    Task ChangeStatusAsync(string appointmentCode, string currentStatus, string newStatus, CancellationToken cancellationToken = default);
}

public sealed class AppointmentStatusCoordinator : IAppointmentStatusCoordinator
{
    private readonly IAppointmentStatusSubject _subject;

    public AppointmentStatusCoordinator(IAppointmentStatusSubject subject)
    {
        _subject = subject;
    }

    public Task ChangeStatusAsync(string appointmentCode, string currentStatus, string newStatus, CancellationToken cancellationToken = default)
    {
        var @event = new AppointmentStatusChangedEvent(
            AppointmentCode: appointmentCode,
            PreviousStatus: currentStatus,
            NewStatus: newStatus,
            ChangedAtUtc: DateTime.UtcNow);

        return _subject.NotifyAsync(@event, cancellationToken);
    }
}
