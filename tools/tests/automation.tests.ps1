[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$repositoryRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

function Invoke-AutomationScript {
	param(
		[string]$ScriptPath,
		[string[]]$Arguments
	)

	$output = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $ScriptPath @Arguments 2>&1 | Out-String
	if ($LASTEXITCODE -ne 0) {
		throw "Script failed: $ScriptPath`n$output"
	}
	return $output
}

function Assert-OutputContains {
	param(
		[string]$Output,
		[string]$Expected,
		[string]$Description
	)

	if ($Output -notmatch [regex]::Escape($Expected)) {
		throw "Expected $Description to contain '$Expected'.`nActual output:`n$Output"
	}
}

$verifyScript = Join-Path $repositoryRoot "tools/verify.ps1"
$devScript = Join-Path $repositoryRoot "tools/dev.ps1"

$fullDryRun = Invoke-AutomationScript -ScriptPath $verifyScript -Arguments @("-Scope", "Full", "-DryRun")
Assert-OutputContains -Output $fullDryRun -Expected "frontend lint" -Description "full verification"
Assert-OutputContains -Output $fullDryRun -Expected "backend typecheck" -Description "full verification"
Assert-OutputContains -Output $fullDryRun -Expected "src\frontend" -Description "frontend working directory"
Assert-OutputContains -Output $fullDryRun -Expected "src\backend" -Description "backend working directory"

$statusDryRun = Invoke-AutomationScript -ScriptPath $devScript -Arguments @("status", "-DryRun")
Assert-OutputContains -Output $statusDryRun -Expected "status" -Description "dev status dry-run"

Write-Output "Automation smoke tests passed."
