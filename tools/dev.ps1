[CmdletBinding()]
param(
	[ValidateSet("start", "stop", "status")]
	[string]$Command = "status",
	[ValidateSet("direct", "docker")]
	[string]$Mode = "direct",
	[switch]$DryRun
)

$ErrorActionPreference = "Stop"
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$frontendRoot = Join-Path $repositoryRoot "src/frontend"
$backendRoot = Join-Path $repositoryRoot "src/backend"
$composeFile = Join-Path $backendRoot "infrastructure/docker/docker-compose.dev.yml"
$stateDirectory = Join-Path $repositoryRoot ".dev"
$stateFile = Join-Path $stateDirectory "food-recipes-dev.json"
$apiHealthUrl = "http://127.0.0.1:3000/api/v1/health/ready"
$frontendHealthUrl = "http://localhost:5173/"

function Assert-CommandAvailable {
	param([string]$Name)

	if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
		throw "Required command '$Name' was not found in PATH."
	}
}

function Assert-BackendEnvironment {
	$backendEnv = Join-Path $backendRoot ".env"
	if (-not (Test-Path -LiteralPath $backendEnv)) {
		throw "Missing $backendEnv. Copy src/backend/.env.example to src/backend/.env and set local values before starting the API."
	}
}

function Read-DevState {
	if (-not (Test-Path -LiteralPath $stateFile)) {
		return $null
	}

	return Get-Content -Raw -LiteralPath $stateFile | ConvertFrom-Json
}

function Write-DevState {
	param([object]$State)

	if (-not (Test-Path -LiteralPath $stateDirectory)) {
		New-Item -ItemType Directory -Path $stateDirectory -Force | Out-Null
	}
	$State | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $stateFile -Encoding utf8
}

function Remove-DevState {
	if (Test-Path -LiteralPath $stateFile) {
		Remove-Item -LiteralPath $stateFile -Force
	}
}

function Start-ManagedPowerShell {
	param(
		[string]$Name,
		[string]$WorkingDirectory,
		[string]$CommandLine
	)

	Write-Host "Starting $Name in $WorkingDirectory"
	Write-Host "  $CommandLine"
	if ($DryRun) {
		Write-Host "  [dry-run] skipped"
		return $null
	}

	$escapedDirectory = $WorkingDirectory.Replace("'", "''")
	$childCommand = "Set-Location -LiteralPath '$escapedDirectory'; $CommandLine"
	return Start-Process -FilePath "powershell.exe" -WorkingDirectory $WorkingDirectory -ArgumentList @(
		"-NoProfile",
		"-NoExit",
		"-Command",
		$childCommand
	) -PassThru
}

function Test-ApiHealth {
	try {
		$response = Invoke-WebRequest -Uri $apiHealthUrl -UseBasicParsing -TimeoutSec 3
		return $response.StatusCode -ge 200 -and $response.StatusCode -lt 300
	} catch {
		return $false
	}
}

function Test-FrontendHealth {
	try {
		$response = Invoke-WebRequest -Uri $frontendHealthUrl -UseBasicParsing -TimeoutSec 3
		return $response.StatusCode -ge 200 -and $response.StatusCode -lt 300
	} catch {
		return $false
	}
}

function Wait-ForApi {
	$attempts = 60
	for ($attempt = 1; $attempt -le $attempts; $attempt++) {
		if (Test-ApiHealth) {
			Write-Host "API is healthy at $apiHealthUrl"
			return
		}
		Start-Sleep -Seconds 2
	}
	throw "API did not become healthy within 120 seconds. Check the backend process or Docker logs."
}

function Wait-ForFrontend {
	$attempts = 30
	for ($attempt = 1; $attempt -le $attempts; $attempt++) {
		if (Test-FrontendHealth) {
			Write-Host "Frontend is healthy at $frontendHealthUrl"
			return
		}
		Start-Sleep -Seconds 2
	}
	throw "Frontend did not become healthy within 60 seconds. Check the frontend process and Vite output."
}

function Invoke-Compose {
	param([string[]]$Arguments)

	Push-Location $backendRoot
	try {
		& docker compose --project-directory . -f $composeFile @Arguments
		if ($LASTEXITCODE -ne 0) {
			throw "Docker Compose failed with exit code $LASTEXITCODE."
		}
	} finally {
		Pop-Location
	}
}

function Get-ProcessIfAlive {
	param([object]$ProcessId)

	if (-not $ProcessId) {
		return $null
	}
	return Get-Process -Id ([int]$ProcessId) -ErrorAction SilentlyContinue
}

function Stop-ManagedProcess {
	param([int]$ProcessId)

	if ($env:OS -eq "Windows_NT") {
		& taskkill.exe /PID $ProcessId /T /F | Out-Null
		if ($LASTEXITCODE -ne 0) {
			throw "Could not stop managed process tree rooted at PID $ProcessId."
		}
	} else {
		Stop-Process -Id $ProcessId -Force
	}
}

function Start-Development {
	if ($Mode -eq "docker") {
		Assert-CommandAvailable -Name "docker"
	} else {
		Assert-CommandAvailable -Name "corepack"
	}
	Assert-BackendEnvironment

	$existingState = Read-DevState
	if ($existingState) {
		$existingProcesses = @(
			Get-ProcessIfAlive -ProcessId $existingState.backendPid
			Get-ProcessIfAlive -ProcessId $existingState.frontendPid
		) | Where-Object { $_ }
		if ($existingProcesses.Count -gt 0) {
			throw "A managed development session is already running. Use '.\tools\dev.ps1 status' or 'stop' first."
		}
		if (-not $DryRun) {
			Remove-DevState
		}
	}

	$backendProcess = $null
	if ($Mode -eq "docker") {
		Write-Host "Starting Docker-backed API and PostgreSQL"
		if (-not $DryRun) {
			Invoke-Compose -Arguments @("up", "-d", "--build")
		}
	} else {
		$backendProcess = Start-ManagedPowerShell -Name "backend" -WorkingDirectory $backendRoot -CommandLine 'cmd.exe /d /s /c "corepack pnpm@11.18.0 dev"'
	}

	$frontendProcess = Start-ManagedPowerShell -Name "frontend" -WorkingDirectory $frontendRoot -CommandLine 'cmd.exe /d /s /c "corepack pnpm@11.18.0 dev"'

	if ($DryRun) {
		return
	}

	Write-DevState -State ([pscustomobject]@{
		mode = $Mode
		startedAt = (Get-Date).ToString("o")
		backendPid = if ($backendProcess) { $backendProcess.Id } else { $null }
		frontendPid = $frontendProcess.Id
	})

	Wait-ForApi
	Wait-ForFrontend
	Write-Host "Development session started. Run '.\tools\dev.ps1 status' for state or 'stop' to shut it down."
}

function Stop-Development {
	$state = Read-DevState
	if (-not $state) {
		Write-Host "No managed development session found."
		return
	}

	Write-Host "Stopping managed development session (mode: $($state.mode))"
	if ($DryRun) {
		Write-Host "  [dry-run] would stop frontend PID $($state.frontendPid) and backend PID $($state.backendPid)"
		return
	}

	foreach ($processId in @($state.frontendPid, $state.backendPid)) {
		$process = Get-ProcessIfAlive -ProcessId $processId
		if ($process) {
			Stop-ManagedProcess -ProcessId $process.Id
			Write-Host "  stopped PID $($process.Id)"
		}
	}

	if ($state.mode -eq "docker") {
		Assert-CommandAvailable -Name "docker"
		Invoke-Compose -Arguments @("down")
	}
	Remove-DevState
}

function Show-DevelopmentStatus {
	Write-Host "Food Recipes dev status"
	$state = Read-DevState
	if (-not $state) {
		Write-Host "  No managed development session."
		return
	}

	Write-Host "  mode: $($state.mode)"
	Write-Host "  started: $($state.startedAt)"
	foreach ($entry in @(
		[pscustomobject]@{ Name = "backend"; Id = $state.backendPid },
		[pscustomobject]@{ Name = "frontend"; Id = $state.frontendPid }
	)) {
		$process = Get-ProcessIfAlive -ProcessId $entry.Id
		$processStatus = if ($process) { "running" } else { "stopped" }
		Write-Host "  $($entry.Name): $processStatus (PID $($entry.Id))"
	}

	if ($DryRun) {
		Write-Host "  [dry-run] health probe skipped"
	} else {
		$apiStatus = if (Test-ApiHealth) { "healthy" } else { "unavailable" }
		$frontendStatus = if (Test-FrontendHealth) { "healthy" } else { "unavailable" }
		Write-Host "  api: $apiStatus"
		Write-Host "  frontend: $frontendStatus"
	}
}

switch ($Command) {
	"start" { Start-Development }
	"stop" { Stop-Development }
	"status" { Show-DevelopmentStatus }
}
