namespace HealthySystem.API.DesignPatterns.Adapter;

public sealed record ClaimSubmission(
    string ClaimCode,
    string PatientCode,
    decimal Amount,
    string Diagnosis,
    DateTime VisitDate);

public sealed record ClaimSubmissionResult(
    bool Accepted,
    string ExternalReference,
    string Message);

public interface IInsuranceGateway
{
    Task<ClaimSubmissionResult> SubmitClaimAsync(ClaimSubmission claim, CancellationToken cancellationToken = default);
}

public sealed class InsurancePartnerPayload
{
    public string RequestId { get; init; } = string.Empty;
    public string BeneficiaryId { get; init; } = string.Empty;
    public string IcD10Diagnosis { get; init; } = string.Empty;
    public decimal TotalCoveredAmount { get; init; }
    public DateTime ServiceDate { get; init; }
}

public sealed class InsurancePartnerResponse
{
    public bool IsApproved { get; init; }
    public string PartnerReferenceId { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
}

public interface IInsurancePartnerClient
{
    Task<InsurancePartnerResponse> SendAsync(InsurancePartnerPayload payload, CancellationToken cancellationToken = default);
}

public sealed class InsurancePartnerClient : IInsurancePartnerClient
{
    public Task<InsurancePartnerResponse> SendAsync(InsurancePartnerPayload payload, CancellationToken cancellationToken = default)
    {
        var response = new InsurancePartnerResponse
        {
            IsApproved = true,
            PartnerReferenceId = $"INS-{payload.RequestId}",
            Description = "Claim received by insurance partner"
        };

        return Task.FromResult(response);
    }
}

public sealed class InsuranceGatewayAdapter : IInsuranceGateway
{
    private readonly IInsurancePartnerClient _insurancePartnerClient;

    public InsuranceGatewayAdapter(IInsurancePartnerClient insurancePartnerClient)
    {
        _insurancePartnerClient = insurancePartnerClient;
    }

    public async Task<ClaimSubmissionResult> SubmitClaimAsync(ClaimSubmission claim, CancellationToken cancellationToken = default)
    {
        var payload = new InsurancePartnerPayload
        {
            RequestId = claim.ClaimCode,
            BeneficiaryId = claim.PatientCode,
            IcD10Diagnosis = claim.Diagnosis,
            TotalCoveredAmount = claim.Amount,
            ServiceDate = claim.VisitDate
        };

        var partnerResponse = await _insurancePartnerClient.SendAsync(payload, cancellationToken);

        return new ClaimSubmissionResult(
            Accepted: partnerResponse.IsApproved,
            ExternalReference: partnerResponse.PartnerReferenceId,
            Message: partnerResponse.Description);
    }
}
