[CmdletBinding()]
param(
	[ValidateSet("Changed", "Full", "Frontend", "Backend", "E2E")]
	[string]$Scope = "Changed",
	[switch]$IncludeE2E,
	[switch]$SkipBuild,
	[switch]$DryRun
)

$ErrorActionPreference = "Stop"
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$frontendRoot = Join-Path $repositoryRoot "src/frontend"
$backendRoot = Join-Path $repositoryRoot "src/backend"

function Get-ToolPath {
	param(
		[string]$WorkingDirectory,
		[string]$ToolName
	)

	$binaryName = $ToolName
	if ($env:OS -eq "Windows_NT") {
		$binaryName += ".cmd"
	}
	return Join-Path (Join-Path $WorkingDirectory "node_modules/.bin") $binaryName
}

function Invoke-ToolStep {
	param(
		[string]$Name,
		[string]$WorkingDirectory,
		[string]$ToolName,
		[string[]]$Arguments
	)

	$toolPath = Get-ToolPath -WorkingDirectory $WorkingDirectory -ToolName $ToolName
	$displayCommand = "$toolPath $($Arguments -join ' ')"
	Write-Host "`n>>> $Name"
	Write-Host "    $displayCommand"
	Write-Host "    cwd: $WorkingDirectory"

	if ($DryRun) {
		Write-Host "    [dry-run] skipped"
		return
	}
	if (-not (Test-Path -LiteralPath $toolPath)) {
		throw "Missing local tool '$ToolName' for $Name. Run 'corepack pnpm@11.18.0 install' once from $WorkingDirectory, then retry."
	}

	$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
	Push-Location $WorkingDirectory
	try {
		& $toolPath @Arguments

		if ($LASTEXITCODE -ne 0) {
			throw "$Name failed with exit code $LASTEXITCODE."
		}
	} finally {
		Pop-Location
		$stopwatch.Stop()
	}

	Write-Host ("    completed in {0:n1}s" -f $stopwatch.Elapsed.TotalSeconds)
}

function Get-ChangedPaths {
	$trackedChanges = @(git diff --name-only HEAD --)
	$untrackedChanges = @(git ls-files --others --exclude-standard)
	return @($trackedChanges + $untrackedChanges | Where-Object { $_ } | Sort-Object -Unique)
}

function Select-VerificationSteps {
	param([string[]]$ChangedPaths)

	$runFrontend = $false
	$runBackend = $false
	$runE2E = $IncludeE2E

	switch ($Scope) {
		"Full" {
			$runFrontend = $true
			$runBackend = $true
		}
		"Frontend" {
			$runFrontend = $true
		}
		"Backend" {
			$runBackend = $true
		}
		"E2E" {
			$runE2E = $true
		}
		"Changed" {
			$crossPackageChange = $ChangedPaths | Where-Object {
				$_ -like ".github/*" -or
				$_ -eq "AGENTS.md" -or
				$_ -like ".husky/*"
			}
			$runFrontend = [bool]($crossPackageChange -or ($ChangedPaths | Where-Object { $_ -like "src/frontend/*" }))
			$runBackend = [bool]($crossPackageChange -or ($ChangedPaths | Where-Object { $_ -like "src/backend/*" }))
			$runE2E = $runE2E -or [bool]($ChangedPaths | Where-Object { $_ -like "src/frontend/e2e/*" })
		}
	}

	return [pscustomobject]@{
		Frontend = $runFrontend
		Backend = $runBackend
		E2E = $runE2E
	}
}

$changedPaths = @()
if ($Scope -eq "Changed") {
	$changedPaths = Get-ChangedPaths
	Write-Host "Detected $($changedPaths.Count) changed path(s)."
	if ($changedPaths.Count -gt 0) {
		$changedPaths | ForEach-Object { Write-Host "  $_" }
	}
}

$selection = Select-VerificationSteps -ChangedPaths $changedPaths

if (-not ($selection.Frontend -or $selection.Backend -or $selection.E2E)) {
	Write-Host "No frontend/backend package changes detected; nothing to verify."
	exit 0
}

if ($selection.Frontend) {
	Invoke-ToolStep -Name "frontend lint" -WorkingDirectory $frontendRoot -ToolName "eslint" -Arguments @("--config", "eslint.config.mjs", ".")
	Invoke-ToolStep -Name "frontend typecheck" -WorkingDirectory $frontendRoot -ToolName "tsc" -Arguments @("--noEmit")
	Invoke-ToolStep -Name "frontend unit tests" -WorkingDirectory $frontendRoot -ToolName "vitest" -Arguments @("run")
	if (-not $SkipBuild) {
		Invoke-ToolStep -Name "frontend build" -WorkingDirectory $frontendRoot -ToolName "vite" -Arguments @("build")
	}
}

if ($selection.Backend) {
	Invoke-ToolStep -Name "backend Prisma validate" -WorkingDirectory $backendRoot -ToolName "prisma" -Arguments @("validate", "--config", "prisma.config.ts")
	Invoke-ToolStep -Name "backend Prisma generate" -WorkingDirectory $backendRoot -ToolName "prisma" -Arguments @("generate", "--config", "prisma.config.ts")
	Invoke-ToolStep -Name "backend typecheck" -WorkingDirectory $backendRoot -ToolName "tsc" -Arguments @("-p", "tsconfig.json", "--noEmit")
	Invoke-ToolStep -Name "backend unit tests" -WorkingDirectory $backendRoot -ToolName "jest" -Arguments @("--runInBand")
	if (-not $SkipBuild) {
		Invoke-ToolStep -Name "backend build" -WorkingDirectory $backendRoot -ToolName "tsc" -Arguments @("-p", "tsconfig.build.json")
	}
}

if ($selection.E2E) {
	Invoke-ToolStep -Name "frontend E2E" -WorkingDirectory $frontendRoot -ToolName "playwright" -Arguments @("test", "--config", "e2e/playwright.config.js")
}

Write-Host "`nVerification completed for scope '$Scope'."
