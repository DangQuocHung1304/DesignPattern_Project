using HealthySystem.API.DesignPatterns.AbstractFactory;
using HealthySystem.API.DesignPatterns.Adapter;
using HealthySystem.API.DesignPatterns.Builder;
using HealthySystem.API.DesignPatterns.Decorator;
using HealthySystem.API.DesignPatterns.Facade;
using HealthySystem.API.DesignPatterns.FactoryMethod;
using HealthySystem.API.DesignPatterns.Observer;
using HealthySystem.API.DesignPatterns.Proxy;
using HealthySystem.API.DesignPatterns.Singleton;
using HealthySystem.API.DesignPatterns.State;
using HealthySystem.API.DesignPatterns.Strategy;
using HealthySystem.API.DesignPatterns.TemplateMethod;
using Moq;

namespace HealthySystem.API.Tests.DesignPatterns;

// Singleton: Verify one shared instance and fallback behavior for missing keys.
public class SingletonPatternTests
{
    [Fact]
    public void Instance_ShouldAlwaysReturnSameObject()
    {
        var first = ClinicConfigurationStore.Instance;
        var second = ClinicConfigurationStore.Instance;

        Assert.Same(first, second);
    }

    [Fact]
    public void Seed_ThenGetUnknownKey_ShouldReturnNullForMissingSetting()
    {
        var store = ClinicConfigurationStore.Instance;
        var testKey = $"Test:{Guid.NewGuid():N}";

        store.Seed(new Dictionary<string, string>
        {
            [testKey] = "Enabled"
        });

        Assert.Equal("Enabled", store.Get(testKey));
        Assert.Null(store.Get($"Missing:{Guid.NewGuid():N}"));
    }
}

// State: Verify valid and invalid transitions in appointment lifecycle.
public class StatePatternTests
{
    [Fact]
    public void Transit_FromScheduledToCheckedIn_ShouldSucceed()
    {
        var stateMachine = new AppointmentStateMachineService();

        var result = stateMachine.Transit("scheduled", "check-in");

        Assert.Equal("scheduled", result.PreviousState);
        Assert.Equal("checked-in", result.CurrentState);
        Assert.Equal("check-in", result.Action);
    }

    [Fact]
    public void Transit_FromScheduledDirectlyToCompleted_ShouldThrowInvalidOperationException()
    {
        var stateMachine = new AppointmentStateMachineService();

        Assert.Throws<InvalidOperationException>(() => stateMachine.Transit("scheduled", "complete"));
    }
}

// Strategy: Verify processor chooses the right payment strategy and rejects unsupported method.
public class StrategyPatternTests
{
    [Fact]
    public async Task ProcessAsync_WhenMethodIsCard_ShouldInvokeCardStrategyOnly()
    {
        var cash = new Mock<IPaymentStrategy>();
        cash.SetupGet(s => s.Method).Returns("cash");

        var card = new Mock<IPaymentStrategy>();
        card.SetupGet(s => s.Method).Returns("card");
        card.Setup(s => s.ExecuteAsync(It.IsAny<PaymentRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PaymentResult(
                Success: true,
                Method: "card",
                TransactionCode: "CARD-INV-001",
                Message: "Card approved",
                ProcessedAtUtc: DateTime.UtcNow));

        var insurance = new Mock<IPaymentStrategy>();
        insurance.SetupGet(s => s.Method).Returns("insurance");

        var processor = new PaymentProcessor(new[] { cash.Object, card.Object, insurance.Object });
        var request = new PaymentRequest("INV-001", 250000m, "VND", "card", "PAT-001");

        var result = await processor.ProcessAsync(request);

        Assert.True(result.Success);
        Assert.Equal("card", result.Method);
        card.Verify(s => s.ExecuteAsync(It.IsAny<PaymentRequest>(), It.IsAny<CancellationToken>()), Times.Once);
        cash.Verify(s => s.ExecuteAsync(It.IsAny<PaymentRequest>(), It.IsAny<CancellationToken>()), Times.Never);
        insurance.Verify(s => s.ExecuteAsync(It.IsAny<PaymentRequest>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ProcessAsync_WhenMethodUnsupported_ShouldThrowInvalidOperationException()
    {
        var processor = new PaymentProcessor(new[] { new CashPaymentStrategy() });
        var request = new PaymentRequest("INV-002", 100000m, "VND", "crypto", "PAT-002");

        await Assert.ThrowsAsync<InvalidOperationException>(() => processor.ProcessAsync(request));
    }
}

// Decorator: Verify invoice total is additive with surcharge/discount and never negative.
public class DecoratorPatternTests
{
    [Fact]
    public void Calculate_WithAfterHoursInsuranceLoyalty_ShouldAccumulateAllAdjustments()
    {
        var composer = new InvoicePricingComposer();
        var input = new InvoicePricingInput(
            ConsultationFee: 100000m,
            LabFee: 50000m,
            IsAfterHours: true,
            HasInsurance: true,
            IsLoyalPatient: true);

        var result = composer.Calculate(input);

        Assert.Equal(150000m, result.Subtotal);
        Assert.Equal(65000m, result.Discount);
        Assert.Equal(50000m, result.Surcharge);
        Assert.Equal(135000m, result.Total);
        Assert.Equal(3, result.Notes.Count);
    }

    [Fact]
    public void Calculate_WhenDiscountExceedsSubtotal_ShouldClampTotalToZero()
    {
        var composer = new InvoicePricingComposer();
        var input = new InvoicePricingInput(
            ConsultationFee: 10000m,
            LabFee: 0m,
            IsAfterHours: false,
            HasInsurance: true,
            IsLoyalPatient: true);

        var result = composer.Calculate(input);

        Assert.Equal(0m, result.Total);
    }
}

// Proxy: Verify access control and cache behavior for repeated record requests.
public class ProxyPatternTests
{
    [Fact]
    public async Task GetMedicalRecordAsync_WhenRequesterRoleIsUnauthorized_ShouldThrowUnauthorizedAccessException()
    {
        var reader = new Mock<IMedicalRecordReader>(MockBehavior.Strict);
        var policy = new Mock<IMedicalRecordAccessPolicy>();
        policy.Setup(p => p.CanAccess(It.IsAny<MedicalRecordAccessContext>())).Returns(false);

        var proxy = new MedicalRecordProxyService(reader.Object, policy.Object);
        var context = new MedicalRecordAccessContext("REC-001", "reception", "PAT-001");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => proxy.GetMedicalRecordAsync(context));
        reader.Verify(r => r.GetByPatientCodeAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GetMedicalRecordAsync_WhenSamePatientRequestedTwice_ShouldHitReaderOnceDueToCache()
    {
        var record = new MedicalRecordView(
            PatientCode: "PAT-001",
            Summary: "Test summary",
            Allergies: new[] { "Penicillin" },
            LastUpdatedAtUtc: DateTime.UtcNow);

        var reader = new Mock<IMedicalRecordReader>();
        reader.Setup(r => r.GetByPatientCodeAsync("PAT-001", It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        var policy = new Mock<IMedicalRecordAccessPolicy>();
        policy.Setup(p => p.CanAccess(It.IsAny<MedicalRecordAccessContext>())).Returns(true);

        var proxy = new MedicalRecordProxyService(reader.Object, policy.Object);
        var context = new MedicalRecordAccessContext("DOC-001", "doctor", "PAT-001");

        var first = await proxy.GetMedicalRecordAsync(context);
        var second = await proxy.GetMedicalRecordAsync(context);

        Assert.NotNull(first);
        Assert.Same(first, second);
        reader.Verify(r => r.GetByPatientCodeAsync("PAT-001", It.IsAny<CancellationToken>()), Times.Once);
    }
}

// Observer: Verify subscribers receive status updates and unsubscribed observers stop receiving events.
public class ObserverPatternTests
{
    [Fact]
    public async Task NotifyAsync_WhenStatusChanges_ShouldNotifyDoctorAndReceptionObservers()
    {
        var doctor = new Mock<IAppointmentStatusObserver>();
        doctor.SetupGet(o => o.Name).Returns("doctor-observer");
        doctor.Setup(o => o.OnStatusChangedAsync(It.IsAny<AppointmentStatusChangedEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var reception = new Mock<IAppointmentStatusObserver>();
        reception.SetupGet(o => o.Name).Returns("reception-observer");
        reception.Setup(o => o.OnStatusChangedAsync(It.IsAny<AppointmentStatusChangedEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var subject = new AppointmentStatusSubject();
        subject.Subscribe(doctor.Object);
        subject.Subscribe(reception.Object);

        var eventData = new AppointmentStatusChangedEvent("APT-001", "scheduled", "checked-in", DateTime.UtcNow);

        await subject.NotifyAsync(eventData);

        doctor.Verify(o => o.OnStatusChangedAsync(It.IsAny<AppointmentStatusChangedEvent>(), It.IsAny<CancellationToken>()), Times.Once);
        reception.Verify(o => o.OnStatusChangedAsync(It.IsAny<AppointmentStatusChangedEvent>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Unsubscribe_ShouldPreventObserverFromReceivingNextNotification()
    {
        var doctor = new Mock<IAppointmentStatusObserver>();
        doctor.SetupGet(o => o.Name).Returns("doctor-observer");
        doctor.Setup(o => o.OnStatusChangedAsync(It.IsAny<AppointmentStatusChangedEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var reception = new Mock<IAppointmentStatusObserver>();
        reception.SetupGet(o => o.Name).Returns("reception-observer");
        reception.Setup(o => o.OnStatusChangedAsync(It.IsAny<AppointmentStatusChangedEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var subject = new AppointmentStatusSubject();
        subject.Subscribe(doctor.Object);
        subject.Subscribe(reception.Object);
        subject.Unsubscribe("doctor-observer");

        var eventData = new AppointmentStatusChangedEvent("APT-002", "checked-in", "in-progress", DateTime.UtcNow);

        await subject.NotifyAsync(eventData);

        doctor.Verify(o => o.OnStatusChangedAsync(It.IsAny<AppointmentStatusChangedEvent>(), It.IsAny<CancellationToken>()), Times.Never);
        reception.Verify(o => o.OnStatusChangedAsync(It.IsAny<AppointmentStatusChangedEvent>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}

// Factory Method: Verify service creates role-specific profiles and throws for unsupported role.
public class FactoryMethodPatternTests
{
    [Fact]
    public void CreateActor_ShouldReturnCorrectDoctorAndPatientProfiles()
    {
        var service = new ActorFactoryMethodService(new ActorProfileCreator[]
        {
            new DoctorProfileCreator(),
            new PatientProfileCreator(),
            new ReceptionProfileCreator()
        });

        var command = new ActorCreationCommand("user@clinic.vn", "Nguyen", "An");

        var doctor = service.CreateActor("doctor", command);
        var patient = service.CreateActor("patient", command);

        Assert.Equal("doctor", doctor.Role);
        Assert.StartsWith("DOC-", doctor.StaffCode);
        Assert.Null(doctor.MedicalRecordNumber);

        Assert.Equal("patient", patient.Role);
        Assert.Null(patient.StaffCode);
        Assert.StartsWith("MRN-", patient.MedicalRecordNumber);
    }

    [Fact]
    public void CreateActor_WhenRoleUnsupported_ShouldThrowInvalidOperationException()
    {
        var service = new ActorFactoryMethodService(new ActorProfileCreator[]
        {
            new DoctorProfileCreator(),
            new PatientProfileCreator()
        });

        var command = new ActorCreationCommand("user@clinic.vn", "Tran", "Binh");

        Assert.Throws<InvalidOperationException>(() => service.CreateActor("nurse", command));
    }
}

// Template Method: Verify common algorithm skeleton with different concrete plan outputs and validation failure.
public class TemplateMethodPatternTests
{
    [Fact]
    public async Task GenerateAsync_AcuteAndChronic_ShouldShareFlowButProduceDifferentActions()
    {
        var service = new TreatmentPlanService(new TreatmentPlanTemplate[]
        {
            new AcuteTreatmentPlanTemplate(),
            new ChronicTreatmentPlanTemplate()
        });

        var request = new TreatmentPlanRequest(
            EncounterCode: "ENC-001",
            PatientCode: "PAT-001",
            Diagnosis: "Tang huyet ap",
            Symptoms: new[] { "Dau dau", "Met moi" });

        var acute = await service.GenerateAsync("Acute", request);
        var chronic = await service.GenerateAsync("Chronic", request);
        var acuteFirstAction = acute.Actions.First();
        var chronicFirstAction = chronic.Actions.First();

        Assert.Equal("acute", acute.PlanType);
        Assert.Equal("chronic", chronic.PlanType);
        Assert.NotEqual(acuteFirstAction, chronicFirstAction);
        Assert.Contains("cap tinh", acuteFirstAction, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("benh ly nen", chronicFirstAction, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GenerateAsync_WhenDiagnosisMissing_ShouldThrowInvalidOperationException()
    {
        var service = new TreatmentPlanService(new TreatmentPlanTemplate[] { new AcuteTreatmentPlanTemplate() });

        var invalid = new TreatmentPlanRequest(
            EncounterCode: "ENC-002",
            PatientCode: "PAT-002",
            Diagnosis: "",
            Symptoms: new[] { "Ho" });

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.GenerateAsync("Acute", invalid));
    }
}

// Builder: Verify EncounterNoteDirector assembles SOAP note with all required sections.
public class BuilderPatternTests
{
    [Fact]
    public void ConstructSoapNote_ShouldContainHeaderSubjectiveAssessmentAndPlan()
    {
        var director = new EncounterNoteDirector();

        var context = new ClinicalEncounterContext(
            EncounterCode: "ENC-003",
            DoctorName: "Le Hoa",
            PatientName: "Pham Minh",
            SymptomSummary: "Sot, dau hong",
            Diagnosis: "Viem hong cap",
            Prescriptions: new[] { "Paracetamol" },
            LabRequests: new[] { "CBC" },
            VisitTime: DateTime.UtcNow);

        var note = director.ConstructSoapNote(context);

        Assert.Contains("Encounter #ENC-003", note.Header);
        Assert.StartsWith("S:", note.SubjectiveSection);
        Assert.StartsWith("A:", note.AssessmentSection);
        Assert.StartsWith("P:", note.PlanSection);
        Assert.False(string.IsNullOrWhiteSpace(note.Footer));
    }

    [Fact]
    public void ConstructSoapNote_WhenNoPrescriptionOrLab_ShouldUseKhongPlaceholder()
    {
        var director = new EncounterNoteDirector();

        var context = new ClinicalEncounterContext(
            EncounterCode: "ENC-004",
            DoctorName: "Le Hoa",
            PatientName: "Pham Minh",
            SymptomSummary: "Met moi",
            Diagnosis: "Theo doi",
            Prescriptions: Array.Empty<string>(),
            LabRequests: Array.Empty<string>(),
            VisitTime: DateTime.UtcNow);

        var note = director.ConstructSoapNote(context);

        Assert.Contains("Thuoc: Khong", note.PlanSection);
        Assert.Contains("can lam sang: Khong", note.PlanSection);
    }
}

// Facade: Verify one-call workflow orchestrates validation, encounter, invoice, and notifications.
public class FacadePatternTests
{
    [Fact]
    public async Task StartVisitAsync_WhenCommandValid_ShouldCreateEncounterInvoiceAndDispatchNotification()
    {
        var validator = new Mock<IAppointmentValidator>();
        validator.Setup(v => v.ValidateAsync(It.IsAny<StartVisitCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var encounterCreator = new Mock<IEncounterDraftCreator>();
        encounterCreator.Setup(c => c.CreateEncounterDraftAsync(It.IsAny<StartVisitCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("ENC-APT-001");

        var invoiceCreator = new Mock<IInvoiceDraftCreator>();
        invoiceCreator.Setup(c => c.CreateInvoiceDraftAsync(It.IsAny<StartVisitCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("INV-APT-001");

        var dispatcher = new Mock<INotificationDispatcher>();
        dispatcher.Setup(d => d.DispatchVisitStartedAsync(It.IsAny<StartVisitCommand>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var facade = new VisitWorkflowFacade(
            validator.Object,
            encounterCreator.Object,
            invoiceCreator.Object,
            dispatcher.Object);

        var command = new StartVisitCommand("APT-001", "DOC-001", "PAT-001", DateTime.UtcNow, 300000m);
        var result = await facade.StartVisitAsync(command);

        Assert.Equal("ENC-APT-001", result.EncounterCode);
        Assert.Equal("INV-APT-001", result.InvoiceCode);

        validator.Verify(v => v.ValidateAsync(It.IsAny<StartVisitCommand>(), It.IsAny<CancellationToken>()), Times.Once);
        encounterCreator.Verify(c => c.CreateEncounterDraftAsync(It.IsAny<StartVisitCommand>(), It.IsAny<CancellationToken>()), Times.Once);
        invoiceCreator.Verify(c => c.CreateInvoiceDraftAsync(It.IsAny<StartVisitCommand>(), It.IsAny<CancellationToken>()), Times.Once);
        dispatcher.Verify(d => d.DispatchVisitStartedAsync(It.IsAny<StartVisitCommand>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task StartVisitAsync_WhenValidationFails_ShouldThrowAndStopWorkflow()
    {
        var validator = new Mock<IAppointmentValidator>();
        validator.Setup(v => v.ValidateAsync(It.IsAny<StartVisitCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var encounterCreator = new Mock<IEncounterDraftCreator>();
        var invoiceCreator = new Mock<IInvoiceDraftCreator>();
        var dispatcher = new Mock<INotificationDispatcher>();

        var facade = new VisitWorkflowFacade(
            validator.Object,
            encounterCreator.Object,
            invoiceCreator.Object,
            dispatcher.Object);

        var command = new StartVisitCommand("APT-002", "DOC-001", "PAT-002", DateTime.UtcNow, 300000m);

        await Assert.ThrowsAsync<InvalidOperationException>(() => facade.StartVisitAsync(command));

        encounterCreator.Verify(c => c.CreateEncounterDraftAsync(It.IsAny<StartVisitCommand>(), It.IsAny<CancellationToken>()), Times.Never);
        invoiceCreator.Verify(c => c.CreateInvoiceDraftAsync(It.IsAny<StartVisitCommand>(), It.IsAny<CancellationToken>()), Times.Never);
        dispatcher.Verify(d => d.DispatchVisitStartedAsync(It.IsAny<StartVisitCommand>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}

// Adapter: Verify internal claim model is transformed correctly to partner payload and exception is propagated.
public class AdapterPatternTests
{
    [Fact]
    public async Task SubmitClaimAsync_ShouldMapInternalClaimToPartnerPayload()
    {
        InsurancePartnerPayload? capturedPayload = null;

        var partnerClient = new Mock<IInsurancePartnerClient>();
        partnerClient
            .Setup(c => c.SendAsync(It.IsAny<InsurancePartnerPayload>(), It.IsAny<CancellationToken>()))
            .Callback<InsurancePartnerPayload, CancellationToken>((payload, _) => capturedPayload = payload)
            .ReturnsAsync(new InsurancePartnerResponse
            {
                IsApproved = true,
                PartnerReferenceId = "PARTNER-001",
                Description = "Accepted"
            });

        var adapter = new InsuranceGatewayAdapter(partnerClient.Object);
        var claim = new ClaimSubmission(
            ClaimCode: "CLM-001",
            PatientCode: "PAT-001",
            Amount: 500000m,
            Diagnosis: "J11",
            VisitDate: new DateTime(2026, 4, 2, 8, 30, 0, DateTimeKind.Utc));

        var result = await adapter.SubmitClaimAsync(claim);

        Assert.NotNull(capturedPayload);
        Assert.Equal(claim.ClaimCode, capturedPayload!.RequestId);
        Assert.Equal(claim.PatientCode, capturedPayload.BeneficiaryId);
        Assert.Equal(claim.Diagnosis, capturedPayload.IcD10Diagnosis);
        Assert.Equal(claim.Amount, capturedPayload.TotalCoveredAmount);
        Assert.Equal(claim.VisitDate, capturedPayload.ServiceDate);

        Assert.True(result.Accepted);
        Assert.Equal("PARTNER-001", result.ExternalReference);
        Assert.Equal("Accepted", result.Message);
    }

    [Fact]
    public async Task SubmitClaimAsync_WhenPartnerThrows_ShouldBubbleException()
    {
        var partnerClient = new Mock<IInsurancePartnerClient>();
        partnerClient
            .Setup(c => c.SendAsync(It.IsAny<InsurancePartnerPayload>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new TimeoutException("Insurance partner timeout"));

        var adapter = new InsuranceGatewayAdapter(partnerClient.Object);
        var claim = new ClaimSubmission("CLM-002", "PAT-002", 200000m, "R50", DateTime.UtcNow);

        await Assert.ThrowsAsync<TimeoutException>(() => adapter.SubmitClaimAsync(claim));
    }
}

// Abstract Factory: Verify factory creates correct message+channel pair for doctor vs patient and handles unknown audience.
public class AbstractFactoryPatternTests
{
    [Fact]
    public async Task SendReminderAsync_DoctorShouldUseEmail_PatientShouldUseSms()
    {
        var service = new AppointmentCommunicationService(new IAppointmentReminderFactory[]
        {
            new DoctorReminderFactory(),
            new PatientReminderFactory()
        });

        var snapshot = new AppointmentSnapshot(
            AppointmentCode: "APT-010",
            DoctorName: "BS Tran",
            PatientName: "Nguyen Van A",
            StartAt: new DateTime(2026, 4, 2, 9, 0, 0, DateTimeKind.Utc),
            Room: "201");

        var doctorReceipt = await service.SendReminderAsync("doctor", snapshot);
        var patientReceipt = await service.SendReminderAsync("patient", snapshot);

        Assert.Equal("email", doctorReceipt.Channel);
        Assert.True(doctorReceipt.Success);

        Assert.Equal("sms", patientReceipt.Channel);
        Assert.True(patientReceipt.Success);
    }

    [Fact]
    public async Task SendReminderAsync_WhenAudienceNotRegistered_ShouldThrowInvalidOperationException()
    {
        var service = new AppointmentCommunicationService(new IAppointmentReminderFactory[]
        {
            new DoctorReminderFactory(),
            new PatientReminderFactory()
        });

        var snapshot = new AppointmentSnapshot(
            AppointmentCode: "APT-011",
            DoctorName: "BS Tran",
            PatientName: "Nguyen Van B",
            StartAt: DateTime.UtcNow,
            Room: "202");

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.SendReminderAsync("reception", snapshot));
    }
}
