using System.Collections.Concurrent;

namespace HealthySystem.API.DesignPatterns.Proxy;

public sealed record MedicalRecordView(
    string PatientCode,
    string Summary,
    IReadOnlyCollection<string> Allergies,
    DateTime LastUpdatedAtUtc);

public interface IMedicalRecordReader
{
    Task<MedicalRecordView?> GetByPatientCodeAsync(string patientCode, CancellationToken cancellationToken = default);
}

public sealed class MedicalRecordReader : IMedicalRecordReader
{
    public Task<MedicalRecordView?> GetByPatientCodeAsync(string patientCode, CancellationToken cancellationToken = default)
    {
        var view = new MedicalRecordView(
            PatientCode: patientCode,
            Summary: "Tien su viem mui di ung, khong co benh nen man tinh.",
            Allergies: new[] { "Penicillin" },
            LastUpdatedAtUtc: DateTime.UtcNow);

        return Task.FromResult<MedicalRecordView?>(view);
    }
}

public sealed record MedicalRecordAccessContext(
    string RequesterCode,
    string RequesterRole,
    string RequestedPatientCode);

public interface IMedicalRecordAccessPolicy
{
    bool CanAccess(MedicalRecordAccessContext context);
}

public sealed class MedicalRecordAccessPolicy : IMedicalRecordAccessPolicy
{
    public bool CanAccess(MedicalRecordAccessContext context)
    {
        if (string.Equals(context.RequesterRole, "admin", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (string.Equals(context.RequesterRole, "doctor", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (string.Equals(context.RequesterRole, "patient", StringComparison.OrdinalIgnoreCase))
        {
            return string.Equals(context.RequesterCode, context.RequestedPatientCode, StringComparison.OrdinalIgnoreCase);
        }

        return false;
    }
}

public interface IMedicalRecordProxyService
{
    Task<MedicalRecordView?> GetMedicalRecordAsync(MedicalRecordAccessContext context, CancellationToken cancellationToken = default);
}

public sealed class MedicalRecordProxyService : IMedicalRecordProxyService
{
    private readonly IMedicalRecordReader _reader;
    private readonly IMedicalRecordAccessPolicy _policy;
    private readonly ConcurrentDictionary<string, MedicalRecordView> _cache = new(StringComparer.OrdinalIgnoreCase);

    public MedicalRecordProxyService(IMedicalRecordReader reader, IMedicalRecordAccessPolicy policy)
    {
        _reader = reader;
        _policy = policy;
    }

    public async Task<MedicalRecordView?> GetMedicalRecordAsync(MedicalRecordAccessContext context, CancellationToken cancellationToken = default)
    {
        if (!_policy.CanAccess(context))
        {
            throw new UnauthorizedAccessException("Requester is not allowed to read this medical record.");
        }

        if (_cache.TryGetValue(context.RequestedPatientCode, out var cached))
        {
            return cached;
        }

        var record = await _reader.GetByPatientCodeAsync(context.RequestedPatientCode, cancellationToken);
        if (record is not null)
        {
            _cache[context.RequestedPatientCode] = record;
        }

        return record;
    }
}
