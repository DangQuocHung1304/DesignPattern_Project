# LEGACY TO REFACTOR 1-1 MAPPING TABLE

Bang nay dung de dua thang vao slide, map 1-1 giua Legacy class va lop Refactor pattern tuong ung trong Healthy System.

| STT | Legacy Class | Legacy Violation (Tom tat) | Refactor Pattern | Refactor Main Class (1-1) | Legacy Source | Refactor Source |
|---|---|---|---|---|---|---|
| 1 | SystemConfiguration | Static global + hard-coded settings | Singleton | SystemConfigurationProvider (backed by ClinicConfigurationStore) | [Docs/LEGACY_SYSTEM_FULL_CODE.md](Docs/LEGACY_SYSTEM_FULL_CODE.md#L9) | [Backend/HealthySystem.API/DesignPatterns/Singleton/SystemConfiguration.cs](Backend/HealthySystem.API/DesignPatterns/Singleton/SystemConfiguration.cs) |
| 2 | ActorService | if-else role classification, many responsibilities | Factory Method | ActorFactoryMethodService | [Docs/LEGACY_SYSTEM_FULL_CODE.md](Docs/LEGACY_SYSTEM_FULL_CODE.md#L120) | [Backend/HealthySystem.API/DesignPatterns/FactoryMethod/ActorFactoryMethod.cs](Backend/HealthySystem.API/DesignPatterns/FactoryMethod/ActorFactoryMethod.cs) |
| 3 | ReminderService | One large function for formatting + channel sending | Abstract Factory | AppointmentCommunicationService | [Docs/LEGACY_SYSTEM_FULL_CODE.md](Docs/LEGACY_SYSTEM_FULL_CODE.md#L424) | [Backend/HealthySystem.API/DesignPatterns/AbstractFactory/AppointmentCommunicationAbstractFactory.cs](Backend/HealthySystem.API/DesignPatterns/AbstractFactory/AppointmentCommunicationAbstractFactory.cs) |
| 4 | ClinicalNoteService | Manual long string concatenation for SOAP note | Builder | EncounterNoteDirector | [Docs/LEGACY_SYSTEM_FULL_CODE.md](Docs/LEGACY_SYSTEM_FULL_CODE.md#L601) | [Backend/HealthySystem.API/DesignPatterns/Builder/ClinicalEncounterNoteBuilder.cs](Backend/HealthySystem.API/DesignPatterns/Builder/ClinicalEncounterNoteBuilder.cs) |
| 5 | InsuranceClaimService | Direct dependency on third-party SDK | Adapter | InsuranceGatewayAdapter | [Docs/LEGACY_SYSTEM_FULL_CODE.md](Docs/LEGACY_SYSTEM_FULL_CODE.md#L731) | [Backend/HealthySystem.API/DesignPatterns/Adapter/InsuranceClaimAdapter.cs](Backend/HealthySystem.API/DesignPatterns/Adapter/InsuranceClaimAdapter.cs) |
| 6 | MedicalRecordService | Direct DB read, no authorization, no cache | Proxy | MedicalRecordProxyService | [Docs/LEGACY_SYSTEM_FULL_CODE.md](Docs/LEGACY_SYSTEM_FULL_CODE.md#L857) | [Backend/HealthySystem.API/DesignPatterns/Proxy/MedicalRecordProxy.cs](Backend/HealthySystem.API/DesignPatterns/Proxy/MedicalRecordProxy.cs) |
| 7 | VisitManager | God Object orchestrates full visit workflow | Facade | VisitWorkflowFacade | [Docs/LEGACY_SYSTEM_FULL_CODE.md](Docs/LEGACY_SYSTEM_FULL_CODE.md#L979) | [Backend/HealthySystem.API/DesignPatterns/Facade/VisitWorkflowFacade.cs](Backend/HealthySystem.API/DesignPatterns/Facade/VisitWorkflowFacade.cs) |
| 8 | InvoiceCalculator | Nested discount/surcharge if logic | Decorator | InvoicePricingComposer | [Docs/LEGACY_SYSTEM_FULL_CODE.md](Docs/LEGACY_SYSTEM_FULL_CODE.md#L1244) | [Backend/HealthySystem.API/DesignPatterns/Decorator/InvoicePricingDecorator.cs](Backend/HealthySystem.API/DesignPatterns/Decorator/InvoicePricingDecorator.cs) |
| 9 | AppointmentService (Notify logic) | Manual calls to send email/SMS per status | Observer | AppointmentStatusCoordinator | [Docs/LEGACY_SYSTEM_FULL_CODE.md](Docs/LEGACY_SYSTEM_FULL_CODE.md#L1364) | [Backend/HealthySystem.API/DesignPatterns/Observer/AppointmentStatusObserver.cs](Backend/HealthySystem.API/DesignPatterns/Observer/AppointmentStatusObserver.cs) |
| 10 | AppointmentManager (State logic) | Massive state/action if-else chain | State | AppointmentStateMachineService | [Docs/LEGACY_SYSTEM_FULL_CODE.md](Docs/LEGACY_SYSTEM_FULL_CODE.md#L1546) | [Backend/HealthySystem.API/DesignPatterns/State/AppointmentLifecycleState.cs](Backend/HealthySystem.API/DesignPatterns/State/AppointmentLifecycleState.cs) |
| 11 | PaymentService | Giant switch-case by payment method | Strategy | PaymentProcessor | [Docs/LEGACY_SYSTEM_FULL_CODE.md](Docs/LEGACY_SYSTEM_FULL_CODE.md#L1691) | [Backend/HealthySystem.API/DesignPatterns/Strategy/PaymentStrategy.cs](Backend/HealthySystem.API/DesignPatterns/Strategy/PaymentStrategy.cs) |
| 12 | TreatmentPlanGenerator | Duplicated acute/chronic generation flow | Template Method | TreatmentPlanService (using TreatmentPlanTemplate) | [Docs/LEGACY_SYSTEM_FULL_CODE.md](Docs/LEGACY_SYSTEM_FULL_CODE.md#L1956) | [Backend/HealthySystem.API/DesignPatterns/TemplateMethod/TreatmentPlanTemplateMethod.cs](Backend/HealthySystem.API/DesignPatterns/TemplateMethod/TreatmentPlanTemplateMethod.cs) |

## Slide-ready Short View

| Legacy | Pattern | Refactor Main Class |
|---|---|---|
| SystemConfiguration | Singleton | SystemConfigurationProvider |
| ActorService | Factory Method | ActorFactoryMethodService |
| ReminderService | Abstract Factory | AppointmentCommunicationService |
| ClinicalNoteService | Builder | EncounterNoteDirector |
| InsuranceClaimService | Adapter | InsuranceGatewayAdapter |
| MedicalRecordService | Proxy | MedicalRecordProxyService |
| VisitManager | Facade | VisitWorkflowFacade |
| InvoiceCalculator | Decorator | InvoicePricingComposer |
| AppointmentService (Notify) | Observer | AppointmentStatusCoordinator |
| AppointmentManager (State) | State | AppointmentStateMachineService |
| PaymentService | Strategy | PaymentProcessor |
| TreatmentPlanGenerator | Template Method | TreatmentPlanService |
