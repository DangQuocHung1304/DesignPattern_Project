$ErrorActionPreference = 'Stop'

$baseUrl = 'http://localhost:5000/api'
$repoRoot = 'D:\1.MTKPM_TT_Done\LyThuyet\Project'
$logFile = Join-Path $repoRoot 'Docs\SmokeTest_12Patterns_20260406.log'

$logs = New-Object System.Collections.Generic.List[string]

function Add-PatternLog {
    param(
        [string]$Pattern,
        [string]$Action,
        [string]$Status,
        [string]$Observation
    )

    $line = "[$Pattern] - [$Action] - [Status: $Status] - [$Observation]"
    $logs.Add($line) | Out-Null
    Write-Output $line
}

function Invoke-Api {
    param(
        [ValidateSet('GET', 'POST', 'PUT', 'DELETE')]
        [string]$Method,
        [string]$Path,
        [hashtable]$Headers,
        [object]$Body
    )

    $uri = "$baseUrl$Path"
    $invokeParams = @{
        Uri = $uri
        Method = $Method
        SkipHttpErrorCheck = $true
    }

    if ($Headers) {
        $invokeParams.Headers = $Headers
    }

    if ($PSBoundParameters.ContainsKey('Body') -and $null -ne $Body) {
        $invokeParams.ContentType = 'application/json'
        $invokeParams.Body = ($Body | ConvertTo-Json -Depth 20)
    }

    $response = Invoke-WebRequest @invokeParams

    $parsed = $null
    if (-not [string]::IsNullOrWhiteSpace($response.Content)) {
        try {
            $parsed = $response.Content | ConvertFrom-Json -Depth 30
        }
        catch {
            $parsed = $response.Content
        }
    }

    return [pscustomobject]@{
        StatusCode = [int]$response.StatusCode
        Ok = ([int]$response.StatusCode -ge 200 -and [int]$response.StatusCode -lt 300)
        Data = $parsed
        Raw = $response.Content
    }
}

function Get-Token {
    param(
        [string]$Email,
        [string[]]$Passwords
    )

    foreach ($password in $Passwords) {
        $resp = Invoke-Api -Method 'POST' -Path '/auth/login' -Body @{ email = $Email; password = $password }
        if ($resp.Ok -and $resp.Data.token) {
            return [pscustomobject]@{ Token = $resp.Data.token; Password = $password; Role = $resp.Data.user.role }
        }
    }

    return $null
}

function Get-Header {
    param([string]$Token)
    return @{ Authorization = "Bearer $Token" }
}

# Login set
$doctor = Get-Token -Email 'dr.an@clinic.local' -Passwords @('Doctor@123', '123456')
$admin = Get-Token -Email 'admin@healthysystem.com' -Passwords @('Admin@123', 'admin123')
$patient = Get-Token -Email 'nguyenvana@test.com' -Passwords @('Password123!', '123456')

if (-not $doctor) { throw 'Cannot login as doctor.' }
if (-not $admin) { throw 'Cannot login as admin.' }
if (-not $patient) { throw 'Cannot login as patient.' }

$doctorHeaders = Get-Header -Token $doctor.Token
$adminHeaders = Get-Header -Token $admin.Token

# Prepare appointment context
$appointmentsResp = Invoke-Api -Method 'GET' -Path '/appointments' -Headers $doctorHeaders
if (-not $appointmentsResp.Ok -or -not $appointmentsResp.Data) {
    throw 'Cannot load doctor appointments for smoke test.'
}

$appointments = @($appointmentsResp.Data)
$candidate = $appointments | Where-Object { $_.status -in @('scheduled', 'confirmed', 'checked-in') } | Select-Object -First 1
if (-not $candidate) {
    $candidate = $appointments | Select-Object -First 1
}
if (-not $candidate) {
    throw 'No appointment candidate found.'
}

$appointmentId = [int64]$candidate.id
$appointmentDetail = (Invoke-Api -Method 'GET' -Path "/appointments/$appointmentId" -Headers $doctorHeaders).Data

$patientCode = $null
if ($appointmentDetail -and $appointmentDetail.patient) {
    $patientCode = $appointmentDetail.patient.publicId
}
if (-not $patientCode) {
    $patientCode = $patient.Data.user.publicId
}

# 1) State + Observer
$stateResp = Invoke-Api -Method 'PUT' -Path "/appointments/$appointmentId/status/pattern" -Headers $doctorHeaders -Body @{
    targetStatus = 'checked-in'
    notes = 'Smoke test State + Observer'
}

$toastWired = Select-String -Path (Join-Path $repoRoot 'Web\HealthySystem-Frontend\assets\js\design-patterns\appointment-notification-observer.js') -Pattern 'notification\.info|handlePatternObserverEvent' -Quiet
$stateOk = $stateResp.Ok -and $stateResp.Data.success -eq $true -and $stateResp.Data.data.currentStatus -eq 'checked-in' -and $toastWired
if ($stateOk) {
    Add-PatternLog -Pattern 'State + Observer' -Action 'Check-in appointment and observe UI bridge' -Status 'PASS' -Observation "Appointment #$appointmentId moved to '$($stateResp.Data.data.currentStatus)'; observer payload returned and toast bridge is wired."
}
else {
    Add-PatternLog -Pattern 'State + Observer' -Action 'Check-in appointment and observe UI bridge' -Status 'FAIL' -Observation "HTTP=$($stateResp.StatusCode), currentStatus='$($stateResp.Data.data.currentStatus)', toastWired=$toastWired"
}

# 2) Facade + Builder
$examPayload = @{
    appointmentCode = "APT-$appointmentId"
    doctorCode = $appointmentDetail.doctor.publicId
    patientCode = $patientCode
    doctorName = $appointmentDetail.doctor.fullName
    patientName = $appointmentDetail.patient.fullName
    currentAppointmentState = 'checked-in'
    symptomSummary = 'Sot nhe, dau hong'
    diagnosis = 'Nghi viem hong cap'
    visitTime = (Get-Date).ToUniversalTime().AddHours(1).ToString('o')
    initialFee = 250000
    consultationFee = 250000
    labFee = 100000
    isAfterHours = $false
    hasInsurance = $true
    isLoyalPatient = $true
    room = 'General'
    prescriptions = @('Paracetamol')
    labRequests = @('CBC')
}
$examResp = Invoke-Api -Method 'POST' -Path '/examinations/start/pattern' -Headers $doctorHeaders -Body $examPayload
$soap = $examResp.Data.data.soapNote
$hasSoapStructure = $soap.header -and $soap.subjectiveSection -and $soap.assessmentSection -and $soap.planSection -and $soap.footer
$hasFacadeResult = $examResp.Data.data.visitWorkflow.encounterCode -and $examResp.Data.data.visitWorkflow.invoiceCode
$facadeBuilderOk = $examResp.Ok -and $examResp.Data.success -eq $true -and $hasSoapStructure -and $hasFacadeResult
if ($facadeBuilderOk) {
    Add-PatternLog -Pattern 'Facade + Builder' -Action 'Start visit workflow and render SOAP note payload' -Status 'PASS' -Observation "Facade returned Encounter=$($examResp.Data.data.visitWorkflow.encounterCode), Invoice=$($examResp.Data.data.visitWorkflow.invoiceCode); SOAP sections are complete."
}
else {
    Add-PatternLog -Pattern 'Facade + Builder' -Action 'Start visit workflow and render SOAP note payload' -Status 'FAIL' -Observation "HTTP=$($examResp.StatusCode), hasFacade=$hasFacadeResult, hasSOAP=$hasSoapStructure"
}

# 3) Proxy
$proxy1 = Invoke-Api -Method 'GET' -Path ("/medicalhistory/secure-summary/{0}" -f [uri]::EscapeDataString($patientCode)) -Headers $doctorHeaders
Start-Sleep -Milliseconds 1500
$proxy2 = Invoke-Api -Method 'GET' -Path ("/medicalhistory/secure-summary/{0}" -f [uri]::EscapeDataString($patientCode)) -Headers $doctorHeaders
$ts1 = [datetime]$proxy1.Data.data.lastUpdatedAtUtc
$ts2 = [datetime]$proxy2.Data.data.lastUpdatedAtUtc
$sameTimestamp = $ts1.ToUniversalTime().ToString('o') -eq $ts2.ToUniversalTime().ToString('o')
$cacheBannerWired = Select-String -Path (Join-Path $repoRoot 'Web\HealthySystem-Frontend\patient-lookup.html') -Pattern 'Du lieu duoc lay tu Cache' -Quiet
$proxyOk = $proxy1.Ok -and $proxy2.Ok -and $ts1 -and $ts2 -and $sameTimestamp -and $cacheBannerWired
if ($proxyOk) {
    Add-PatternLog -Pattern 'Proxy' -Action 'Fetch same patient medical summary twice' -Status 'PASS' -Observation "Second read reused cached payload (lastUpdatedAtUtc unchanged: $($ts2.ToUniversalTime().ToString('o'))) and UI cache banner text is wired."
}
else {
    Add-PatternLog -Pattern 'Proxy' -Action 'Fetch same patient medical summary twice' -Status 'FAIL' -Observation "HTTP1=$($proxy1.StatusCode), HTTP2=$($proxy2.StatusCode), sameTimestamp=$sameTimestamp, ts1='$($ts1.ToUniversalTime().ToString('o'))', ts2='$($ts2.ToUniversalTime().ToString('o'))', bannerWired=$cacheBannerWired"
}

# 4) Factory Method
$stamp = Get-Date -Format 'yyyyMMddHHmmss'
$staffPayload = @{
    role = 'reception'
    firstName = 'Smoke'
    lastName = 'Staff'
    email = "smoke.staff.$stamp@test.local"
    phone = '0900000001'
    password = 'Smoke@123'
    department = 'FrontDesk'
}
$patientPayload = @{
    role = 'patient'
    firstName = 'Smoke'
    lastName = 'Patient'
    email = "smoke.patient.$stamp@test.local"
    phone = '0900000002'
    password = 'Smoke@123'
    address = 'Test Address'
}
$factoryStaffResp = Invoke-Api -Method 'POST' -Path '/account/create' -Headers $adminHeaders -Body $staffPayload
$factoryPatientResp = Invoke-Api -Method 'POST' -Path '/account/create' -Headers $adminHeaders -Body $patientPayload
$staffCode = $factoryStaffResp.Data.data.staffCode
$staffMrn = $factoryStaffResp.Data.data.medicalRecordNumber
$patientCodeMrn = $factoryPatientResp.Data.data.medicalRecordNumber
$patientStaffCode = $factoryPatientResp.Data.data.staffCode
$factoryOk = $factoryStaffResp.Ok -and $factoryPatientResp.Ok -and $staffCode -and (-not $staffMrn) -and $patientCodeMrn -and (-not $patientStaffCode)
if ($factoryOk) {
    Add-PatternLog -Pattern 'Factory Method' -Action 'Create staff and patient accounts by role' -Status 'PASS' -Observation "Reception profile has StaffCode=$staffCode; patient profile has MedicalRecordNumber=$patientCodeMrn."
}
else {
    Add-PatternLog -Pattern 'Factory Method' -Action 'Create staff and patient accounts by role' -Status 'FAIL' -Observation "staffCode='$staffCode', staffMRN='$staffMrn', patientMRN='$patientCodeMrn', patientStaffCode='$patientStaffCode'"
}

# 5) Singleton
$key = 'Clinic:MaxAppointmentsPerHour'
$encodedKey = [uri]::EscapeDataString($key)
$singletonBefore = Invoke-Api -Method 'GET' -Path "/design-patterns/singleton/config/$encodedKey" -Headers $adminHeaders
$currentValue = [int]($singletonBefore.Data.value)
if (-not $currentValue) { $currentValue = 8 }
$newValue = [string]($currentValue + 1)
$singletonUpdate = Invoke-Api -Method 'POST' -Path '/design-patterns/singleton/config' -Headers $adminHeaders -Body @{ key = $key; value = $newValue }
$singletonAfter = Invoke-Api -Method 'GET' -Path "/design-patterns/singleton/config/$encodedKey" -Headers $adminHeaders
$afterValue = [string]$singletonAfter.Data.value
$singletonOk = $singletonUpdate.Ok -and $singletonAfter.Ok -and ($afterValue -eq $newValue)
if ($singletonOk) {
    Add-PatternLog -Pattern 'Singleton' -Action 'Update and re-read MaxAppointmentsPerHour' -Status 'PASS' -Observation "Value changed from '$currentValue' to '$afterValue' and persisted across subsequent read."
}
else {
    Add-PatternLog -Pattern 'Singleton' -Action 'Update and re-read MaxAppointmentsPerHour' -Status 'FAIL' -Observation "before='$currentValue', requested='$newValue', after='$afterValue', updateHTTP=$($singletonUpdate.StatusCode)"
}

# 6) Strategy + Decorator
$previewInput = @{
    consultationFee = 250000
    labFee = 100000
    isAfterHours = $true
    hasInsurance = $true
    isLoyalPatient = $true
}
$previewResp = Invoke-Api -Method 'POST' -Path '/invoice/pricing/preview' -Headers $adminHeaders -Body $previewInput
$pricing = $previewResp.Data.data
$expectedTotal = [decimal]($pricing.subtotal - $pricing.discount + $pricing.surcharge)
$previewOk = $previewResp.Ok -and ($pricing.total -eq $expectedTotal)

$cardPayResp = Invoke-Api -Method 'POST' -Path '/invoice/1/pay' -Headers $adminHeaders -Body @{ method = 'card'; amount = 150000; diagnosis = 'R69' }
$insPayResp = Invoke-Api -Method 'POST' -Path '/invoice/2/pay' -Headers $adminHeaders -Body @{ method = 'insurance'; amount = 180000; diagnosis = 'R51' }
$strategyOk = $cardPayResp.Ok -and $insPayResp.Ok -and $cardPayResp.Data.success -eq $true -and $insPayResp.Data.success -eq $true -and $cardPayResp.Data.data.payment.method -eq 'card' -and $insPayResp.Data.data.payment.method -eq 'insurance' -and $insPayResp.Data.data.insuranceClaim.externalReference

if ($previewOk -and $strategyOk) {
    Add-PatternLog -Pattern 'Strategy + Decorator' -Action 'Preview pricing and pay by card/insurance' -Status 'PASS' -Observation "Decorator total=$($pricing.total) matches formula; cardTxn=$($cardPayResp.Data.data.payment.transactionCode), insuranceRef=$($insPayResp.Data.data.insuranceClaim.externalReference)."
}
else {
    Add-PatternLog -Pattern 'Strategy + Decorator' -Action 'Preview pricing and pay by card/insurance' -Status 'FAIL' -Observation "previewOk=$previewOk, strategyOk=$strategyOk, previewHTTP=$($previewResp.StatusCode), cardHTTP=$($cardPayResp.StatusCode), insHTTP=$($insPayResp.StatusCode)"
}

# 7) Template Method + Adapter
$templatePayload = @{
    encounterCode = "ENC-SMOKE-$stamp"
    patientCode = $patientCode
    diagnosis = 'Viem hong cap'
    symptoms = @('sot', 'dau hong')
}
$templateResp = Invoke-Api -Method 'POST' -Path '/examinations/treatment-plan/acute/pattern' -Headers $doctorHeaders -Body $templatePayload
$claimPayload = @{
    claimCode = "CLM-SMOKE-$stamp"
    patientCode = $patientCode
    amount = 300000
    diagnosis = 'R69'
    visitDate = (Get-Date).ToString('o')
}
$adapterResp = Invoke-Api -Method 'POST' -Path '/examinations/insurance-claim/pattern' -Headers $doctorHeaders -Body $claimPayload
$templateOk = $templateResp.Ok -and $templateResp.Data.success -eq $true -and $templateResp.Data.data.actions.Count -ge 3
$adapterOk = $adapterResp.Ok -and $adapterResp.Data.success -eq $true -and $adapterResp.Data.data.accepted -eq $true -and $adapterResp.Data.data.externalReference
if ($templateOk -and $adapterOk) {
    Add-PatternLog -Pattern 'Template Method + Adapter' -Action 'Generate treatment plan and submit insurance claim' -Status 'PASS' -Observation "PlanType=$($templateResp.Data.data.planType), actions=$($templateResp.Data.data.actions.Count); adapter returned externalRef=$($adapterResp.Data.data.externalReference)."
}
else {
    Add-PatternLog -Pattern 'Template Method + Adapter' -Action 'Generate treatment plan and submit insurance claim' -Status 'FAIL' -Observation "templateHTTP=$($templateResp.StatusCode), adapterHTTP=$($adapterResp.StatusCode), templateOk=$templateOk, adapterOk=$adapterOk"
}

$logs | Set-Content -Path $logFile -Encoding UTF8
Write-Output "\nSmoke test log written to: $logFile"