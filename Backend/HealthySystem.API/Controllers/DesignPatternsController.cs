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
using Microsoft.AspNetCore.Mvc;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/design-patterns")]
    public class DesignPatternsController : ControllerBase
    {
        private readonly ISystemConfigurationProvider _systemConfigurationProvider;
        private readonly IActorFactoryMethodService _actorFactoryMethodService;
        private readonly IAppointmentCommunicationService _appointmentCommunicationService;
        private readonly IEncounterNoteDirector _encounterNoteDirector;
        private readonly IInsuranceGateway _insuranceGateway;
        private readonly IMedicalRecordProxyService _medicalRecordProxyService;
        private readonly IVisitWorkflowFacade _visitWorkflowFacade;
        private readonly IInvoicePricingComposer _invoicePricingComposer;
        private readonly IAppointmentStatusCoordinator _appointmentStatusCoordinator;
        private readonly IAppointmentStateMachineService _appointmentStateMachineService;
        private readonly IPaymentProcessor _paymentProcessor;
        private readonly ITreatmentPlanService _treatmentPlanService;

        public DesignPatternsController(
            ISystemConfigurationProvider systemConfigurationProvider,
            IActorFactoryMethodService actorFactoryMethodService,
            IAppointmentCommunicationService appointmentCommunicationService,
            IEncounterNoteDirector encounterNoteDirector,
            IInsuranceGateway insuranceGateway,
            IMedicalRecordProxyService medicalRecordProxyService,
            IVisitWorkflowFacade visitWorkflowFacade,
            IInvoicePricingComposer invoicePricingComposer,
            IAppointmentStatusCoordinator appointmentStatusCoordinator,
            IAppointmentStateMachineService appointmentStateMachineService,
            IPaymentProcessor paymentProcessor,
            ITreatmentPlanService treatmentPlanService)
        {
            _systemConfigurationProvider = systemConfigurationProvider;
            _actorFactoryMethodService = actorFactoryMethodService;
            _appointmentCommunicationService = appointmentCommunicationService;
            _encounterNoteDirector = encounterNoteDirector;
            _insuranceGateway = insuranceGateway;
            _medicalRecordProxyService = medicalRecordProxyService;
            _visitWorkflowFacade = visitWorkflowFacade;
            _invoicePricingComposer = invoicePricingComposer;
            _appointmentStatusCoordinator = appointmentStatusCoordinator;
            _appointmentStateMachineService = appointmentStateMachineService;
            _paymentProcessor = paymentProcessor;
            _treatmentPlanService = treatmentPlanService;
        }

        [HttpGet("singleton/config/{key}")]
        [HttpGet("singleton/config/{key}/pattern")]
        public ActionResult<object> GetConfiguration([FromRoute] string key)
        {
            var value = _systemConfigurationProvider.GetValue(key, "N/A");
            return Ok(new
            {
                Pattern = "Singleton",
                Key = key,
                Value = value
            });
        }

        [HttpPost("singleton/config")]
        [HttpPost("singleton/config/pattern")]
        public ActionResult<object> UpdateConfiguration([FromBody] SingletonConfigUpdateRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Key))
            {
                return BadRequest(new { success = false, message = "Config key is required." });
            }

            _systemConfigurationProvider.SetValue(request.Key, request.Value ?? string.Empty);

            return Ok(new
            {
                success = true,
                message = "Configuration updated with Singleton workflow.",
                processingState = new
                {
                    phase = "ready",
                    isLoading = false,
                    skeletonHint = "singleton-config"
                },
                data = new
                {
                    Pattern = "Singleton",
                    Key = request.Key,
                    Value = _systemConfigurationProvider.GetValue(request.Key, string.Empty)
                }
            });
        }

        [HttpPost("factory-method/actors/{role}")]
        [HttpPost("factory-method/actors/{role}/pattern")]
        public ActionResult<ActorProfile> CreateActorProfile([FromRoute] string role, [FromBody] ActorCreationCommand command)
        {
            var profile = _actorFactoryMethodService.CreateActor(role, command);
            return Ok(profile);
        }

        [HttpPost("abstract-factory/reminders/{role}")]
        [HttpPost("abstract-factory/reminders/{role}/pattern")]
        public async Task<ActionResult<DeliveryReceipt>> SendReminder(
            [FromRoute] string role,
            [FromBody] AppointmentSnapshot appointment,
            CancellationToken cancellationToken)
        {
            var receipt = await _appointmentCommunicationService.SendReminderAsync(role, appointment, cancellationToken);
            return Ok(receipt);
        }

        [HttpPost("builder/soap-note")]
        [HttpPost("builder/soap-note/pattern")]
        public ActionResult<ClinicalEncounterNote> BuildSoapNote([FromBody] ClinicalEncounterContext context)
        {
            var note = _encounterNoteDirector.ConstructSoapNote(context);
            return Ok(note);
        }

        [HttpPost("adapter/insurance-claims")]
        [HttpPost("adapter/insurance-claims/pattern")]
        public async Task<ActionResult<ClaimSubmissionResult>> SubmitInsuranceClaim(
            [FromBody] ClaimSubmission claim,
            CancellationToken cancellationToken)
        {
            var result = await _insuranceGateway.SubmitClaimAsync(claim, cancellationToken);
            return Ok(result);
        }

        [HttpPost("proxy/medical-records")]
        [HttpPost("proxy/medical-records/pattern")]
        public async Task<ActionResult<MedicalRecordView?>> ReadMedicalRecord(
            [FromBody] MedicalRecordProxyRequest request,
            CancellationToken cancellationToken)
        {
            var context = new MedicalRecordAccessContext(
                RequesterCode: request.RequesterCode,
                RequesterRole: request.RequesterRole,
                RequestedPatientCode: request.PatientCode);

            var result = await _medicalRecordProxyService.GetMedicalRecordAsync(context, cancellationToken);
            return Ok(result);
        }

        [HttpPost("facade/start-visit")]
        [HttpPost("facade/start-visit/pattern")]
        public async Task<ActionResult<StartVisitResult>> StartVisit(
            [FromBody] StartVisitCommand command,
            CancellationToken cancellationToken)
        {
            var result = await _visitWorkflowFacade.StartVisitAsync(command, cancellationToken);
            return Ok(result);
        }

        [HttpPost("decorator/invoice-pricing")]
        [HttpPost("decorator/invoice-pricing/pattern")]
        public ActionResult<InvoicePricingResult> CalculateInvoicePricing([FromBody] InvoicePricingInput input)
        {
            var result = _invoicePricingComposer.Calculate(input);
            return Ok(result);
        }

        [HttpPost("observer/appointments/{appointmentCode}/status")]
        [HttpPost("observer/appointments/{appointmentCode}/status/pattern")]
        public async Task<ActionResult<object>> NotifyStatusChange(
            [FromRoute] string appointmentCode,
            [FromBody] AppointmentStatusChangeRequest request,
            CancellationToken cancellationToken)
        {
            await _appointmentStatusCoordinator.ChangeStatusAsync(
                appointmentCode,
                request.CurrentStatus,
                request.NewStatus,
                cancellationToken);

            return Ok(new
            {
                Pattern = "Observer",
                AppointmentCode = appointmentCode,
                request.CurrentStatus,
                request.NewStatus,
                Message = "Observers notified."
            });
        }

        [HttpPost("state/appointments/transition")]
        [HttpPost("state/appointments/transition/pattern")]
        public ActionResult<AppointmentStateTransitionResult> TransitAppointmentState([FromBody] StateTransitionRequest request)
        {
            var result = _appointmentStateMachineService.Transit(request.CurrentState, request.Action);
            return Ok(result);
        }

        [HttpPost("strategy/payments")]
        [HttpPost("strategy/payments/pattern")]
        public async Task<ActionResult<PaymentResult>> ProcessPayment([FromBody] PaymentRequest request, CancellationToken cancellationToken)
        {
            var result = await _paymentProcessor.ProcessAsync(request, cancellationToken);
            return Ok(result);
        }

        [HttpPost("template-method/treatment-plans/{planType}")]
        [HttpPost("template-method/treatment-plans/{planType}/pattern")]
        public async Task<ActionResult<TreatmentPlanResult>> GenerateTreatmentPlan(
            [FromRoute] string planType,
            [FromBody] TreatmentPlanRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _treatmentPlanService.GenerateAsync(planType, request, cancellationToken);
            return Ok(result);
        }

        public sealed record MedicalRecordProxyRequest(string RequesterCode, string RequesterRole, string PatientCode);

        public sealed record AppointmentStatusChangeRequest(string CurrentStatus, string NewStatus);

        public sealed record StateTransitionRequest(string CurrentState, string Action);

        public sealed record SingletonConfigUpdateRequest(string Key, string? Value);
    }
}
