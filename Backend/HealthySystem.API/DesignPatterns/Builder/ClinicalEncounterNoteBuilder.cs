namespace HealthySystem.API.DesignPatterns.Builder;

public sealed record ClinicalEncounterContext(
    string EncounterCode,
    string DoctorName,
    string PatientName,
    string SymptomSummary,
    string Diagnosis,
    IReadOnlyCollection<string> Prescriptions,
    IReadOnlyCollection<string> LabRequests,
    DateTime VisitTime);

public sealed class ClinicalEncounterNote
{
    public string Header { get; set; } = string.Empty;
    public string SubjectiveSection { get; set; } = string.Empty;
    public string AssessmentSection { get; set; } = string.Empty;
    public string PlanSection { get; set; } = string.Empty;
    public string Footer { get; set; } = string.Empty;
}

public interface IClinicalEncounterNoteBuilder
{
    IClinicalEncounterNoteBuilder BuildHeader(ClinicalEncounterContext context);
    IClinicalEncounterNoteBuilder BuildSubjective(ClinicalEncounterContext context);
    IClinicalEncounterNoteBuilder BuildAssessment(ClinicalEncounterContext context);
    IClinicalEncounterNoteBuilder BuildPlan(ClinicalEncounterContext context);
    IClinicalEncounterNoteBuilder BuildFooter(ClinicalEncounterContext context);
    ClinicalEncounterNote Build();
}

public sealed class SoapClinicalEncounterNoteBuilder : IClinicalEncounterNoteBuilder
{
    private readonly ClinicalEncounterNote _note = new();

    public IClinicalEncounterNoteBuilder BuildHeader(ClinicalEncounterContext context)
    {
        _note.Header = $"Encounter #{context.EncounterCode} | {context.PatientName} | BS {context.DoctorName} | {context.VisitTime:dd/MM/yyyy HH:mm}";
        return this;
    }

    public IClinicalEncounterNoteBuilder BuildSubjective(ClinicalEncounterContext context)
    {
        _note.SubjectiveSection = $"S: {context.SymptomSummary}";
        return this;
    }

    public IClinicalEncounterNoteBuilder BuildAssessment(ClinicalEncounterContext context)
    {
        _note.AssessmentSection = $"A: Chan doan ban dau: {context.Diagnosis}";
        return this;
    }

    public IClinicalEncounterNoteBuilder BuildPlan(ClinicalEncounterContext context)
    {
        var meds = context.Prescriptions.Any() ? string.Join(", ", context.Prescriptions) : "Khong";
        var labs = context.LabRequests.Any() ? string.Join(", ", context.LabRequests) : "Khong";
        _note.PlanSection = $"P: Thuoc: {meds}. Chi dinh can lam sang: {labs}.";
        return this;
    }

    public IClinicalEncounterNoteBuilder BuildFooter(ClinicalEncounterContext context)
    {
        _note.Footer = "Tai lieu duoc tao tu mau SOAP va luu vao ho so kham.";
        return this;
    }

    public ClinicalEncounterNote Build() => _note;
}

public interface IEncounterNoteDirector
{
    ClinicalEncounterNote ConstructSoapNote(ClinicalEncounterContext context);
}

public sealed class EncounterNoteDirector : IEncounterNoteDirector
{
    public ClinicalEncounterNote ConstructSoapNote(ClinicalEncounterContext context)
    {
        var builder = new SoapClinicalEncounterNoteBuilder();
        return builder
            .BuildHeader(context)
            .BuildSubjective(context)
            .BuildAssessment(context)
            .BuildPlan(context)
            .BuildFooter(context)
            .Build();
    }
}
