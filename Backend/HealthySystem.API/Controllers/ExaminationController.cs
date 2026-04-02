using System.Security.Claims;
using HealthySystem.API.DesignPatterns.AbstractFactory;
using HealthySystem.API.DesignPatterns.Adapter;
using HealthySystem.API.DesignPatterns.Builder;
using HealthySystem.API.DesignPatterns.Decorator;
using HealthySystem.API.DesignPatterns.Facade;
using HealthySystem.API.DesignPatterns.Observer;
using HealthySystem.API.DesignPatterns.Proxy;
using HealthySystem.API.DesignPatterns.State;
using HealthySystem.API.DesignPatterns.TemplateMethod;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "doctor,admin")]
    public class ExaminationController : ControllerBase
    {
        private readonly IVisitWorkflowFacade _visitWorkflowFacade;
        private readonly IAppointmentStateMachineService _appointmentStateMachineService;
        private readonly IInvoicePricingComposer _invoicePricingComposer;
        private readonly IEncounterNoteDirector _encounterNoteDirector;
        private readonly IAppointmentStatusCoordinator _appointmentStatusCoordinator;
        private readonly IAppointmentCommunicationService _appointmentCommunicationService;
        private readonly ITreatmentPlanService _treatmentPlanService;
        private readonly IInsuranceGateway _insuranceGateway;
        private readonly IMedicalRecordProxyService _medicalRecordProxyService;

        public ExaminationController(
            IVisitWorkflowFacade visitWorkflowFacade,
            IAppointmentStateMachineService appointmentStateMachineService,
            IInvoicePricingComposer invoicePricingComposer,
            IEncounterNoteDirector encounterNoteDirector,
            IAppointmentStatusCoordinator appointmentStatusCoordinator,
            IAppointmentCommunicationService appointmentCommunicationService,
            ITreatmentPlanService treatmentPlanService,
            IInsuranceGateway insuranceGateway,
            IMedicalRecordProxyService medicalRecordProxyService)
        {
            _visitWorkflowFacade = visitWorkflowFacade;
            _appointmentStateMachineService = appointmentStateMachineService;
            _invoicePricingComposer = invoicePricingComposer;
            _encounterNoteDirector = encounterNoteDirector;
            _appointmentStatusCoordinator = appointmentStatusCoordinator;
            _appointmentCommunicationService = appointmentCommunicationService;
            _treatmentPlanService = treatmentPlanService;
            _insuranceGateway = insuranceGateway;
            _medicalRecordProxyService = medicalRecordProxyService;
        }

        // Demonstration endpoint that combines Facade + State + Decorator + Builder
        [HttpPost("start")]
        public async Task<IActionResult> StartExamination([FromBody] StartExaminationRequest request)
        {
            var transition = _appointmentStateMachineService.Transit(
                currentState: request.CurrentAppointmentState,
                action: "start-visit");

            var visitResult = await _visitWorkflowFacade.StartVisitAsync(new StartVisitCommand(
                AppointmentCode: request.AppointmentCode,
                DoctorCode: request.DoctorCode,
                PatientCode: request.PatientCode,
                VisitTime: request.VisitTime,
                InitialFee: request.InitialFee));

            var invoicePricing = _invoicePricingComposer.Calculate(new InvoicePricingInput(
                ConsultationFee: request.ConsultationFee,
                LabFee: request.LabFee,
                IsAfterHours: request.IsAfterHours,
                HasInsurance: request.HasInsurance,
                IsLoyalPatient: request.IsLoyalPatient));

            var note = _encounterNoteDirector.ConstructSoapNote(new ClinicalEncounterContext(
                EncounterCode: visitResult.EncounterCode,
                DoctorName: request.DoctorName,
                PatientName: request.PatientName,
                SymptomSummary: request.SymptomSummary,
                Diagnosis: request.Diagnosis,
                Prescriptions: request.Prescriptions,
                LabRequests: request.LabRequests,
                VisitTime: request.VisitTime));

            await _appointmentStatusCoordinator.ChangeStatusAsync(
                appointmentCode: request.AppointmentCode,
                currentStatus: request.CurrentAppointmentState,
                newStatus: transition.CurrentState);

            var snapshot = new AppointmentSnapshot(
                AppointmentCode: request.AppointmentCode,
                DoctorName: request.DoctorName,
                PatientName: request.PatientName,
                StartAt: request.VisitTime,
                Room: request.Room);

            var doctorReminder = await _appointmentCommunicationService.SendReminderAsync("doctor", snapshot);
            var patientReminder = await _appointmentCommunicationService.SendReminderAsync("patient", snapshot);

            return Ok(new
            {
                success = true,
                processingState = new
                {
                    phase = "ready",
                    isLoading = false,
                    skeletonHint = "examination-workflow-result"
                },
                data = new
                {
                    stateTransition = transition,
                    visitWorkflow = visitResult,
                    pricing = invoicePricing,
                    soapNote = note,
                    reminders = new { doctorReminder, patientReminder }
                }
            });
        }

        [HttpPost("treatment-plan/{planType}")]
        public async Task<IActionResult> GenerateTreatmentPlan([FromRoute] string planType, [FromBody] GenerateTreatmentPlanRequest request)
        {
            var result = await _treatmentPlanService.GenerateAsync(
                planType,
                new TreatmentPlanRequest(
                    EncounterCode: request.EncounterCode,
                    PatientCode: request.PatientCode,
                    Diagnosis: request.Diagnosis,
                    Symptoms: request.Symptoms));

            return Ok(new
            {
                success = true,
                processingState = new
                {
                    phase = "ready",
                    isLoading = false,
                    skeletonHint = "treatment-plan-result"
                },
                data = result
            });
        }

        [HttpPost("insurance-claim")]
        public async Task<IActionResult> SubmitInsuranceClaim([FromBody] SubmitInsuranceClaimRequest request)
        {
            var result = await _insuranceGateway.SubmitClaimAsync(new ClaimSubmission(
                ClaimCode: request.ClaimCode,
                PatientCode: request.PatientCode,
                Amount: request.Amount,
                Diagnosis: request.Diagnosis,
                VisitDate: request.VisitDate));

            return Ok(new
            {
                success = true,
                processingState = new
                {
                    phase = "ready",
                    isLoading = false,
                    skeletonHint = "insurance-claim-result"
                },
                data = result
            });
        }

        [HttpPost("medical-records/secure")]
        public async Task<IActionResult> GetSecureMedicalRecord([FromBody] SecureMedicalRecordRequest request)
        {
            var requesterRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "guest";
            var requesterCode = User.FindFirst("publicId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "unknown";

            var result = await _medicalRecordProxyService.GetMedicalRecordAsync(new MedicalRecordAccessContext(
                RequesterCode: requesterCode,
                RequesterRole: requesterRole,
                RequestedPatientCode: request.PatientCode));

            return Ok(new
            {
                success = true,
                processingState = new
                {
                    phase = "ready",
                    isLoading = false,
                    skeletonHint = "secure-medical-record"
                },
                data = result
            });
        }
    }

    public class StartExaminationRequest
    {
        public string AppointmentCode { get; set; } = string.Empty;
        public string DoctorCode { get; set; } = string.Empty;
        public string PatientCode { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public string PatientName { get; set; } = string.Empty;
        public string CurrentAppointmentState { get; set; } = "checked-in";
        public string SymptomSummary { get; set; } = string.Empty;
        public string Diagnosis { get; set; } = string.Empty;
        public DateTime VisitTime { get; set; }
        public decimal InitialFee { get; set; }
        public decimal ConsultationFee { get; set; }
        public decimal LabFee { get; set; }
        public bool IsAfterHours { get; set; }
        public bool HasInsurance { get; set; }
        public bool IsLoyalPatient { get; set; }
        public string Room { get; set; } = "General";
        public IReadOnlyCollection<string> Prescriptions { get; set; } = Array.Empty<string>();
        public IReadOnlyCollection<string> LabRequests { get; set; } = Array.Empty<string>();
    }

    public class GenerateTreatmentPlanRequest
    {
        public string EncounterCode { get; set; } = string.Empty;
        public string PatientCode { get; set; } = string.Empty;
        public string Diagnosis { get; set; } = string.Empty;
        public IReadOnlyCollection<string> Symptoms { get; set; } = Array.Empty<string>();
    }

    public class SubmitInsuranceClaimRequest
    {
        public string ClaimCode { get; set; } = string.Empty;
        public string PatientCode { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Diagnosis { get; set; } = "R69";
        public DateTime VisitDate { get; set; }
    }

    public class SecureMedicalRecordRequest
    {
        public string PatientCode { get; set; } = string.Empty;
    }
}
