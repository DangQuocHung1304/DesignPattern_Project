namespace HealthySystem.API.DesignPatterns.State;

public sealed record AppointmentStateTransitionResult(
    string PreviousState,
    string CurrentState,
    string Action,
    DateTime ChangedAtUtc);

public interface IAppointmentState
{
    string Name { get; }
    IAppointmentState CheckIn();
    IAppointmentState StartVisit();
    IAppointmentState Complete();
    IAppointmentState Cancel();
}

public sealed class ScheduledState : IAppointmentState
{
    public string Name => "scheduled";

    public IAppointmentState CheckIn() => new CheckedInState();

    public IAppointmentState StartVisit() => throw new InvalidOperationException("Cannot start visit before patient check-in.");

    public IAppointmentState Complete() => throw new InvalidOperationException("Cannot complete before visit starts.");

    public IAppointmentState Cancel() => new CancelledState();
}

public sealed class CheckedInState : IAppointmentState
{
    public string Name => "checked-in";

    public IAppointmentState CheckIn() => this;

    public IAppointmentState StartVisit() => new InProgressState();

    public IAppointmentState Complete() => throw new InvalidOperationException("Cannot complete before visit is in-progress.");

    public IAppointmentState Cancel() => new CancelledState();
}

public sealed class InProgressState : IAppointmentState
{
    public string Name => "in-progress";

    public IAppointmentState CheckIn() => this;

    public IAppointmentState StartVisit() => this;

    public IAppointmentState Complete() => new CompletedState();

    public IAppointmentState Cancel() => new CancelledState();
}

public sealed class CompletedState : IAppointmentState
{
    public string Name => "completed";

    public IAppointmentState CheckIn() => throw new InvalidOperationException("Completed appointment cannot be changed.");

    public IAppointmentState StartVisit() => throw new InvalidOperationException("Completed appointment cannot be changed.");

    public IAppointmentState Complete() => this;

    public IAppointmentState Cancel() => throw new InvalidOperationException("Completed appointment cannot be cancelled.");
}

public sealed class CancelledState : IAppointmentState
{
    public string Name => "cancelled";

    public IAppointmentState CheckIn() => throw new InvalidOperationException("Cancelled appointment cannot be changed.");

    public IAppointmentState StartVisit() => throw new InvalidOperationException("Cancelled appointment cannot be changed.");

    public IAppointmentState Complete() => throw new InvalidOperationException("Cancelled appointment cannot be changed.");

    public IAppointmentState Cancel() => this;
}

public sealed class AppointmentLifecycleContext
{
    public AppointmentLifecycleContext(IAppointmentState initialState)
    {
        State = initialState;
    }

    public IAppointmentState State { get; private set; }

    public AppointmentStateTransitionResult ApplyAction(string action)
    {
        var previous = State.Name;
        State = action.ToLowerInvariant() switch
        {
            "check-in" => State.CheckIn(),
            "start-visit" => State.StartVisit(),
            "complete" => State.Complete(),
            "cancel" => State.Cancel(),
            _ => throw new InvalidOperationException($"Unsupported appointment action '{action}'.")
        };

        return new AppointmentStateTransitionResult(
            PreviousState: previous,
            CurrentState: State.Name,
            Action: action,
            ChangedAtUtc: DateTime.UtcNow);
    }
}

public interface IAppointmentStateMachineService
{
    AppointmentStateTransitionResult Transit(string currentState, string action);
}

public sealed class AppointmentStateMachineService : IAppointmentStateMachineService
{
    public AppointmentStateTransitionResult Transit(string currentState, string action)
    {
        IAppointmentState state = currentState.ToLowerInvariant() switch
        {
            "scheduled" => new ScheduledState(),
            "checked-in" => new CheckedInState(),
            "in-progress" => new InProgressState(),
            "completed" => new CompletedState(),
            "cancelled" => new CancelledState(),
            _ => throw new InvalidOperationException($"Unknown appointment state '{currentState}'.")
        };

        var context = new AppointmentLifecycleContext(state);
        return context.ApplyAction(action);
    }
}
