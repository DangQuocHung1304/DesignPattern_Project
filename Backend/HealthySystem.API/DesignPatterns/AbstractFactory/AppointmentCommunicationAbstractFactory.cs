namespace HealthySystem.API.DesignPatterns.AbstractFactory;

public sealed record AppointmentSnapshot(
    string AppointmentCode,
    string DoctorName,
    string PatientName,
    DateTime StartAt,
    string Room);

public sealed record ReminderMessage(
    string Subject,
    string Body,
    string Recipient);

public sealed record DeliveryReceipt(
    string Channel,
    bool Success,
    string Detail,
    DateTime SentAtUtc);

public interface IReminderMessageBuilder
{
    ReminderMessage Build(AppointmentSnapshot appointment);
}

public interface IReminderDeliveryChannel
{
    Task<DeliveryReceipt> SendAsync(ReminderMessage message, CancellationToken cancellationToken = default);
}

public interface IAppointmentReminderFactory
{
    string AudienceRole { get; }
    IReminderMessageBuilder CreateMessageBuilder();
    IReminderDeliveryChannel CreateDeliveryChannel();
}

public sealed class DoctorReminderMessageBuilder : IReminderMessageBuilder
{
    public ReminderMessage Build(AppointmentSnapshot appointment)
    {
        return new ReminderMessage(
            Subject: $"Lich kham sap toi #{appointment.AppointmentCode}",
            Body: $"Bac si {appointment.DoctorName} co lich voi {appointment.PatientName} luc {appointment.StartAt:HH:mm dd/MM/yyyy} tai phong {appointment.Room}.",
            Recipient: appointment.DoctorName);
    }
}

public sealed class PatientReminderMessageBuilder : IReminderMessageBuilder
{
    public ReminderMessage Build(AppointmentSnapshot appointment)
    {
        return new ReminderMessage(
            Subject: "Thong bao nhac lich kham",
            Body: $"Ban co lich kham voi bac si {appointment.DoctorName} vao {appointment.StartAt:HH:mm dd/MM/yyyy}. Vui long den truoc 15 phut.",
            Recipient: appointment.PatientName);
    }
}

public sealed class EmailReminderChannel : IReminderDeliveryChannel
{
    public Task<DeliveryReceipt> SendAsync(ReminderMessage message, CancellationToken cancellationToken = default)
    {
        var receipt = new DeliveryReceipt(
            Channel: "email",
            Success: true,
            Detail: $"Email sent to {message.Recipient} with subject '{message.Subject}'.",
            SentAtUtc: DateTime.UtcNow);

        return Task.FromResult(receipt);
    }
}

public sealed class SmsReminderChannel : IReminderDeliveryChannel
{
    public Task<DeliveryReceipt> SendAsync(ReminderMessage message, CancellationToken cancellationToken = default)
    {
        var receipt = new DeliveryReceipt(
            Channel: "sms",
            Success: true,
            Detail: $"SMS sent to {message.Recipient}: {message.Subject}",
            SentAtUtc: DateTime.UtcNow);

        return Task.FromResult(receipt);
    }
}

public sealed class DoctorReminderFactory : IAppointmentReminderFactory
{
    public string AudienceRole => "doctor";

    public IReminderMessageBuilder CreateMessageBuilder() => new DoctorReminderMessageBuilder();

    public IReminderDeliveryChannel CreateDeliveryChannel() => new EmailReminderChannel();
}

public sealed class PatientReminderFactory : IAppointmentReminderFactory
{
    public string AudienceRole => "patient";

    public IReminderMessageBuilder CreateMessageBuilder() => new PatientReminderMessageBuilder();

    public IReminderDeliveryChannel CreateDeliveryChannel() => new SmsReminderChannel();
}

public interface IAppointmentCommunicationService
{
    Task<DeliveryReceipt> SendReminderAsync(string audienceRole, AppointmentSnapshot appointment, CancellationToken cancellationToken = default);
}

public sealed class AppointmentCommunicationService : IAppointmentCommunicationService
{
    private readonly Dictionary<string, IAppointmentReminderFactory> _factories;

    public AppointmentCommunicationService(IEnumerable<IAppointmentReminderFactory> factories)
    {
        _factories = factories.ToDictionary(f => f.AudienceRole, StringComparer.OrdinalIgnoreCase);
    }

    public async Task<DeliveryReceipt> SendReminderAsync(string audienceRole, AppointmentSnapshot appointment, CancellationToken cancellationToken = default)
    {
        if (!_factories.TryGetValue(audienceRole, out var factory))
        {
            throw new InvalidOperationException($"No reminder factory registered for audience role '{audienceRole}'.");
        }

        var builder = factory.CreateMessageBuilder();
        var channel = factory.CreateDeliveryChannel();
        var message = builder.Build(appointment);
        return await channel.SendAsync(message, cancellationToken);
    }
}
