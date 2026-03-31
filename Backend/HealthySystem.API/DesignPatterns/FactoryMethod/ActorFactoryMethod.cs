namespace HealthySystem.API.DesignPatterns.FactoryMethod;

public sealed record ActorCreationCommand(
    string Email,
    string FirstName,
    string LastName,
    DateOnly? DateOfBirth = null);

public sealed record ActorProfile(
    string Role,
    string DisplayName,
    string Email,
    string? StaffCode,
    string? MedicalRecordNumber,
    string OnboardingMessage);

public abstract class ActorProfileCreator
{
    public abstract string Role { get; }

    public ActorProfile Create(ActorCreationCommand command)
    {
        var profile = CreateRoleSpecificProfile(command);
        return profile with
        {
            Role = Role,
            DisplayName = $"{command.FirstName} {command.LastName}".Trim(),
            Email = command.Email
        };
    }

    protected abstract ActorProfile CreateRoleSpecificProfile(ActorCreationCommand command);
}

public sealed class DoctorProfileCreator : ActorProfileCreator
{
    public override string Role => "doctor";

    protected override ActorProfile CreateRoleSpecificProfile(ActorCreationCommand command)
    {
        return new ActorProfile(
            Role,
            string.Empty,
            string.Empty,
            StaffCode: $"DOC-{DateTime.UtcNow:yyyyMMddHHmmss}",
            MedicalRecordNumber: null,
            OnboardingMessage: "Bac si da duoc khoi tao profile va gan lich lam viec mac dinh.");
    }
}

public sealed class PatientProfileCreator : ActorProfileCreator
{
    public override string Role => "patient";

    protected override ActorProfile CreateRoleSpecificProfile(ActorCreationCommand command)
    {
        return new ActorProfile(
            Role,
            string.Empty,
            string.Empty,
            StaffCode: null,
            MedicalRecordNumber: $"MRN-{DateTime.UtcNow:yyyyMMddHHmmss}",
            OnboardingMessage: "Benh nhan da duoc cap ma ho so benh an ban dau.");
    }
}

public sealed class ReceptionProfileCreator : ActorProfileCreator
{
    public override string Role => "reception";

    protected override ActorProfile CreateRoleSpecificProfile(ActorCreationCommand command)
    {
        return new ActorProfile(
            Role,
            string.Empty,
            string.Empty,
            StaffCode: $"REC-{DateTime.UtcNow:yyyyMMddHHmmss}",
            MedicalRecordNumber: null,
            OnboardingMessage: "Tiep tan da duoc khoi tao profile va cap quyen tiep nhan benh nhan.");
    }
}

public interface IActorFactoryMethodService
{
    ActorProfile CreateActor(string role, ActorCreationCommand command);
}

public sealed class ActorFactoryMethodService : IActorFactoryMethodService
{
    private readonly Dictionary<string, ActorProfileCreator> _creators;

    public ActorFactoryMethodService(IEnumerable<ActorProfileCreator> creators)
    {
        _creators = creators.ToDictionary(c => c.Role, StringComparer.OrdinalIgnoreCase);
    }

    public ActorProfile CreateActor(string role, ActorCreationCommand command)
    {
        if (!_creators.TryGetValue(role, out var creator))
        {
            throw new InvalidOperationException($"Role '{role}' is not supported by factory method.");
        }

        return creator.Create(command);
    }
}
