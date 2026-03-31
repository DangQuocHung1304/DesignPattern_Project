namespace HealthySystem.API.DesignPatterns.TemplateMethod;

public sealed record TreatmentPlanRequest(
    string EncounterCode,
    string PatientCode,
    string Diagnosis,
    IReadOnlyCollection<string> Symptoms);

public sealed record TreatmentPlanResult(
    string EncounterCode,
    string PlanType,
    IReadOnlyCollection<string> Actions,
    DateTime GeneratedAtUtc);

public abstract class TreatmentPlanTemplate
{
    public async Task<TreatmentPlanResult> GenerateAsync(TreatmentPlanRequest request, CancellationToken cancellationToken = default)
    {
        ValidateRequest(request);
        var assessment = await CollectAssessmentDataAsync(request, cancellationToken);
        var actions = BuildActions(request, assessment);
        await PersistPlanAsync(request, actions, cancellationToken);

        return new TreatmentPlanResult(
            EncounterCode: request.EncounterCode,
            PlanType: PlanType,
            Actions: actions,
            GeneratedAtUtc: DateTime.UtcNow);
    }

    protected abstract string PlanType { get; }

    protected virtual void ValidateRequest(TreatmentPlanRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.EncounterCode))
        {
            throw new InvalidOperationException("EncounterCode is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Diagnosis))
        {
            throw new InvalidOperationException("Diagnosis is required to generate treatment plan.");
        }
    }

    protected virtual Task<string> CollectAssessmentDataAsync(TreatmentPlanRequest request, CancellationToken cancellationToken)
    {
        return Task.FromResult($"Assessment data for diagnosis: {request.Diagnosis}");
    }

    protected abstract IReadOnlyCollection<string> BuildActions(TreatmentPlanRequest request, string assessmentSummary);

    protected virtual Task PersistPlanAsync(TreatmentPlanRequest request, IReadOnlyCollection<string> actions, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}

public sealed class AcuteTreatmentPlanTemplate : TreatmentPlanTemplate
{
    protected override string PlanType => "acute";

    protected override IReadOnlyCollection<string> BuildActions(TreatmentPlanRequest request, string assessmentSummary)
    {
        return new[]
        {
            $"Danh gia trieu chung cap tinh: {assessmentSummary}",
            "Ke don dieu tri trieu chung trong 3-5 ngay",
            "Hen tai kham som neu trieu chung khong giam"
        };
    }
}

public sealed class ChronicTreatmentPlanTemplate : TreatmentPlanTemplate
{
    protected override string PlanType => "chronic";

    protected override IReadOnlyCollection<string> BuildActions(TreatmentPlanRequest request, string assessmentSummary)
    {
        return new[]
        {
            $"Danh gia benh ly nen: {assessmentSummary}",
            "Xay dung phac do dai han va huong dan theo doi tai nha",
            "Lap lich tai kham dinh ky 1-3 thang"
        };
    }
}

public interface ITreatmentPlanService
{
    Task<TreatmentPlanResult> GenerateAsync(string planType, TreatmentPlanRequest request, CancellationToken cancellationToken = default);
}

public sealed class TreatmentPlanService : ITreatmentPlanService
{
    private readonly Dictionary<string, TreatmentPlanTemplate> _templates;

    public TreatmentPlanService(IEnumerable<TreatmentPlanTemplate> templates)
    {
        _templates = templates.ToDictionary(
            t => t.GetType().Name.Replace("TreatmentPlanTemplate", string.Empty),
            StringComparer.OrdinalIgnoreCase);
    }

    public Task<TreatmentPlanResult> GenerateAsync(string planType, TreatmentPlanRequest request, CancellationToken cancellationToken = default)
    {
        if (!_templates.TryGetValue(planType, out var template))
        {
            throw new InvalidOperationException($"Treatment plan type '{planType}' is not supported.");
        }

        return template.GenerateAsync(request, cancellationToken);
    }
}
