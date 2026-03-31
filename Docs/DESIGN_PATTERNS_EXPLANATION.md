# DESIGN PATTERNS EXPLANATION

## Tong quan
Tai lieu nay mo ta 12 GoF patterns da duoc ap dung trong project HealthySystem (ASP.NET Core + Vanilla JS), tap trung vao:
- Van de/ngu canh trong bai toan phong kham.
- Cach code cu thuong duoc viet (if/else lon, coupling cao, kho mo rong).
- Cach refactor theo design pattern.
- Loi ich dat duoc, dac biet la polymorphism, testability, maintainability.

## 1) Singleton
### Ten pattern
Singleton

### Van de / Ngu canh
He thong can dung chung cau hinh toan cuc (clinic_name, default_timezone, max_appointments_per_hour) o nhieu noi ma khong muon tao nhieu instance.

### Code cu (before)
```csharp
// Before: static dictionary dung truc tiep, kho quan ly va kho test
public static class AppConfig
{
    public static Dictionary<string, string> Values = new();
}
```

### Code refactor (after)
File: `Backend/HealthySystem.API/DesignPatterns/Singleton/SystemConfiguration.cs`
```csharp
public sealed class ClinicConfigurationStore
{
    private static readonly Lazy<ClinicConfigurationStore> _instance =
        new(() => new ClinicConfigurationStore());

    private readonly ConcurrentDictionary<string, string> _settings =
        new(StringComparer.OrdinalIgnoreCase);

    public static ClinicConfigurationStore Instance => _instance.Value;
}
```

### Loi ich / Polymorphism
- Dam bao 1 diem su that (single source of truth) cho runtime settings.
- Thread-safe khi truy cap dong thoi.
- Co abstraction `ISystemConfigurationProvider` de controller/service phu thuoc vao interface thay vi static global truc tiep.

---

## 2) Factory Method
### Ten pattern
Factory Method

### Van de / Ngu canh
Khi tao profile theo role (doctor, patient, reception), code cu thuong if/else dai va de vo khi them role moi.

### Code cu (before)
```csharp
// Before
if (role == "doctor") { ... }
else if (role == "patient") { ... }
else if (role == "reception") { ... }
```

### Code refactor (after)
File: `Backend/HealthySystem.API/DesignPatterns/FactoryMethod/ActorFactoryMethod.cs`
```csharp
public abstract class ActorProfileCreator
{
    public abstract string Role { get; }
    public ActorProfile Create(ActorCreationCommand command) { ... }
    protected abstract ActorProfile CreateRoleSpecificProfile(ActorCreationCommand command);
}

public sealed class DoctorProfileCreator : ActorProfileCreator { ... }
public sealed class PatientProfileCreator : ActorProfileCreator { ... }
```

### Loi ich / Polymorphism
- Moi role la 1 lop rieng, override hanh vi tao profile.
- Mo rong role moi ma khong sua logic cu (Open/Closed).
- Polymorphism thong qua `ActorProfileCreator` + DI `IEnumerable<ActorProfileCreator>`.

---

## 3) Abstract Factory
### Ten pattern
Abstract Factory

### Van de / Ngu canh
Nhac lich kham cho tung doi tuong (doctor/patient) can mot "ho" san pham di kem: message builder + delivery channel.

### Code cu (before)
```csharp
// Before: doctor => email message, patient => sms message trong 1 ham lon
if (role == "doctor") { ... build doctor message ... send email ... }
else if (role == "patient") { ... build patient message ... send sms ... }
```

### Code refactor (after)
File: `Backend/HealthySystem.API/DesignPatterns/AbstractFactory/AppointmentCommunicationAbstractFactory.cs`
```csharp
public interface IAppointmentReminderFactory
{
    IReminderMessageBuilder CreateMessageBuilder();
    IReminderDeliveryChannel CreateDeliveryChannel();
}

public sealed class DoctorReminderFactory : IAppointmentReminderFactory { ... }
public sealed class PatientReminderFactory : IAppointmentReminderFactory { ... }
```

### Loi ich / Polymorphism
- Dong bo cac doi tuong lien quan theo "family" (doctor family, patient family).
- Doi channel/format de dang ma khong anh huong code client.
- Polymorphism qua `IAppointmentReminderFactory`, `IReminderMessageBuilder`, `IReminderDeliveryChannel`.

---

## 4) Builder
### Ten pattern
Builder

### Van de / Ngu canh
Tao SOAP encounter note co nhieu phan (Header, Subjective, Assessment, Plan, Footer). Code cu de bi constructor telescoping hoac string concat lon.

### Code cu (before)
```csharp
// Before
var note = new ClinicalEncounterNote {
  Header = "...",
  SubjectiveSection = "...",
  AssessmentSection = "...",
  PlanSection = "...",
  Footer = "..."
};
```

### Code refactor (after)
File: `Backend/HealthySystem.API/DesignPatterns/Builder/ClinicalEncounterNoteBuilder.cs`
```csharp
var note = builder
    .BuildHeader(context)
    .BuildSubjective(context)
    .BuildAssessment(context)
    .BuildPlan(context)
    .BuildFooter(context)
    .Build();
```

### Loi ich / Polymorphism
- Tach quy trinh build khoi data object.
- Cho phep tao nhieu bien the ghi chu theo quy trinh khac nhau.
- Director dieu phoi trinh tu build, de test tung buoc rieng.

---

## 5) Adapter
### Ten pattern
Adapter

### Van de / Ngu canh
He thong phong kham can gui claim sang cong bao hiem ngoai, nhung schema API doi tac khac schema noi bo.

### Code cu (before)
```csharp
// Before: business service goi truc tiep doi tac va map du lieu long trong service
var payload = new PartnerPayload { ... };
var partnerRes = await partner.SendAsync(payload);
```

### Code refactor (after)
File: `Backend/HealthySystem.API/DesignPatterns/Adapter/InsuranceClaimAdapter.cs`
```csharp
public interface IInsuranceGateway
{
    Task<ClaimSubmissionResult> SubmitClaimAsync(ClaimSubmission claim, CancellationToken cancellationToken = default);
}

public sealed class InsuranceGatewayAdapter : IInsuranceGateway
{
    // map ClaimSubmission -> InsurancePartnerPayload
}
```

### Loi ich / Polymorphism
- Ngan business layer phu thuoc truc tiep API doi tac.
- Doi provider bao hiem moi ma chi can adapter moi.
- Polymorphism qua `IInsuranceGateway` va `IInsurancePartnerClient`.

---

## 6) Proxy
### Ten pattern
Proxy

### Van de / Ngu canh
Doc ho so benh an can kiem soat truy cap theo role va co cache de giam I/O.

### Code cu (before)
```csharp
// Before: moi noi goi reader truc tiep, de quen check quyen
var record = await reader.GetByPatientCodeAsync(patientCode);
```

### Code refactor (after)
File: `Backend/HealthySystem.API/DesignPatterns/Proxy/MedicalRecordProxy.cs`
```csharp
public sealed class MedicalRecordProxyService : IMedicalRecordProxyService
{
    // check policy -> cache -> call real reader
}
```

### Loi ich / Polymorphism
- Them security gate va cache ma khong sua class doc du lieu goc.
- Duy tri mot abstraction `IMedicalRecordReader`/`IMedicalRecordProxyService` de thay doi implementation linh hoat.

---

## 7) Facade
### Ten pattern
Facade

### Van de / Ngu canh
Workflow "bat dau buoi kham" gom nhieu subsystem: validate appointment, tao encounter draft, tao invoice draft, gui notification.

### Code cu (before)
```csharp
// Before: controller tu goi tung service theo thu tu, de trung lap va sai quy trinh
await validator.ValidateAsync(cmd);
await encounter.CreateEncounterDraftAsync(cmd);
await invoice.CreateInvoiceDraftAsync(cmd);
await notifier.DispatchVisitStartedAsync(cmd);
```

### Code refactor (after)
File: `Backend/HealthySystem.API/DesignPatterns/Facade/VisitWorkflowFacade.cs`
```csharp
public sealed class VisitWorkflowFacade : IVisitWorkflowFacade
{
    public async Task<StartVisitResult> StartVisitAsync(StartVisitCommand command, CancellationToken cancellationToken = default)
    {
        // one entrypoint for full workflow
    }
}
```

### Loi ich / Polymorphism
- Controller co API don gian, khong phai biet chi tiet subsystem.
- Quyet dinh thu tu va rule duoc gom mot cho.
- De thay subsystem implementation thong qua interfaces.

---

## 8) Decorator
### Ten pattern
Decorator

### Van de / Ngu canh
Tinh tien hoa don can stack rule: bao hiem giam gia, loyalty discount, after-hours surcharge.

### Code cu (before)
```csharp
// Before: if/else lon trong 1 method
if (hasInsurance) ...
if (isLoyal) ...
if (afterHours) ...
```

### Code refactor (after)
File: `Backend/HealthySystem.API/DesignPatterns/Decorator/InvoicePricingDecorator.cs`
```csharp
IInvoicePricingService pipeline = new StandardInvoicePricingService();
pipeline = new InsuranceCoverageDecorator(pipeline);
pipeline = new LoyaltyDiscountDecorator(pipeline);
pipeline = new AfterHoursFeeDecorator(pipeline);
```

### Loi ich / Polymorphism
- Rule tinh phi duoc gan/lap linh hoat theo nhu cau.
- Moi decorator tu quan ly 1 concern.
- Polymorphism qua `IInvoicePricingService` giup compose de dang.

---

## 9) Observer
### Ten pattern
Observer

### Van de / Ngu canh
Khi trang thai lich hen doi, can thong bao nhieu bo phan: doctor schedule, reception desk, patient notification.

### Code cu (before)
```csharp
// Before: hardcode call tung ben ngay trong service
await notifyDoctor();
await notifyReception();
await notifyPatient();
```

### Code refactor (after)
File: `Backend/HealthySystem.API/DesignPatterns/Observer/AppointmentStatusObserver.cs`
```csharp
public interface IAppointmentStatusObserver
{
    Task OnStatusChangedAsync(AppointmentStatusChangedEvent @event, CancellationToken cancellationToken = default);
}

public sealed class AppointmentStatusSubject : IAppointmentStatusSubject
{
    public Task NotifyAsync(AppointmentStatusChangedEvent @event, CancellationToken cancellationToken = default) { ... }
}
```

### Loi ich / Polymorphism
- Subject khong can biet chi tiet observer nao dang nghe.
- Dang ky/huy dang ky observer linh hoat.
- Polymorphism qua `IAppointmentStatusObserver` cho moi subscriber.

---

## 10) State
### Ten pattern
State

### Van de / Ngu canh
Vong doi lich hen co quy tac nghiep vu: scheduled -> checked-in -> in-progress -> completed/cancelled.

### Code cu (before)
```csharp
// Before: nested switch-case theo currentState + action
switch (currentState) {
  case "scheduled": ...
}
```

### Code refactor (after)
File: `Backend/HealthySystem.API/DesignPatterns/State/AppointmentLifecycleState.cs`
```csharp
public interface IAppointmentState
{
    IAppointmentState CheckIn();
    IAppointmentState StartVisit();
    IAppointmentState Complete();
    IAppointmentState Cancel();
}

public sealed class ScheduledState : IAppointmentState { ... }
public sealed class CheckedInState : IAppointmentState { ... }
```

### Loi ich / Polymorphism
- Moi state dong goi rule transition rieng.
- Giam switch-case phuc tap, de doc/de bao tri.
- Polymorphism dua tren `IAppointmentState`.

---

## 11) Strategy
### Ten pattern
Strategy

### Van de / Ngu canh
Thanh toan co nhieu phuong thuc: cash, card, insurance. Moi phuong thuc co quy trinh xu ly rieng.

### Code cu (before)
```csharp
// Before
if (method == "cash") ...
else if (method == "card") ...
else if (method == "insurance") ...
```

### Code refactor (after)
File: `Backend/HealthySystem.API/DesignPatterns/Strategy/PaymentStrategy.cs`
```csharp
public interface IPaymentStrategy
{
    string Method { get; }
    Task<PaymentResult> ExecuteAsync(PaymentRequest request, CancellationToken cancellationToken = default);
}

public sealed class PaymentProcessor : IPaymentProcessor
{
    // resolve strategy by method
}
```

### Loi ich / Polymorphism
- Them payment method moi ma khong sua payment processor.
- Test tung chien luoc thanh toan doc lap.
- Polymorphism qua `IPaymentStrategy`.

---

## 12) Template Method
### Ten pattern
Template Method

### Van de / Ngu canh
Sinh treatment plan co quy trinh chung (validate -> collect assessment -> build actions -> persist), nhung noi dung khac nhau voi acute/chronic.

### Code cu (before)
```csharp
// Before: duplicate cac buoc chung o tung service
GenerateAcutePlan(...)
GenerateChronicPlan(...)
```

### Code refactor (after)
File: `Backend/HealthySystem.API/DesignPatterns/TemplateMethod/TreatmentPlanTemplateMethod.cs`
```csharp
public abstract class TreatmentPlanTemplate
{
    public async Task<TreatmentPlanResult> GenerateAsync(TreatmentPlanRequest request, CancellationToken cancellationToken = default)
    {
        ValidateRequest(request);
        var assessment = await CollectAssessmentDataAsync(request, cancellationToken);
        var actions = BuildActions(request, assessment);
        await PersistPlanAsync(request, actions, cancellationToken);
    }

    protected abstract IReadOnlyCollection<string> BuildActions(TreatmentPlanRequest request, string assessmentSummary);
}
```

### Loi ich / Polymorphism
- Reuse skeleton algorithm, giam duplicate code.
- Cho phep custom buoc bien doi qua override.
- Polymorphism qua abstract base class `TreatmentPlanTemplate`.

---

## Frontend Patterns (Vanilla JS)
Ngoai backend, frontend da them 2 pattern module hoa:

1. Abstract Factory cho role-based dashboard UI:
- File: `Web/HealthySystem-Frontend/assets/js/design-patterns/role-ui-abstract-factory.js`
- Factory theo role (doctor/reception/accountant) tao sidebar + quick actions + theme token.

2. Observer cho appointment notification:
- File: `Web/HealthySystem-Frontend/assets/js/design-patterns/appointment-notification-observer.js`
- Event bus subscribe/publish cho badge update + toast notification.

Demo frontend:
- File: `Web/HealthySystem-Frontend/design-patterns-demo.html`

---

## API Demo Endpoints
Da them controller de test nhanh cac pattern:
- File: `Backend/HealthySystem.API/Controllers/DesignPatternsController.cs`
- Route goc: `api/design-patterns`
- Vi du:
  - `GET /api/design-patterns/singleton/config/{key}`
  - `POST /api/design-patterns/factory-method/actors/{role}`
  - `POST /api/design-patterns/strategy/payments`
  - `POST /api/design-patterns/template-method/treatment-plans/{planType}`

---

## Dang ky DI
Tat ca pattern services duoc dang ky tai:
- File: `Backend/HealthySystem.API/Program.cs`

Dieu nay dam bao app su dung interface-based architecture, tan dung polymorphism va dependency inversion trong toan bo luong xu ly.
