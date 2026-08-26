<#
.SYNOPSIS
  Installs the dsh-workspace-explorer-picker plugin into DeepSeek
  Harness Desktop's user profile.

.DESCRIPTION
  DeepSeek Harness Desktop plugin installer. Copies the plugin package into
  $DSH_HOME\profiles\node_modules and applies the activation rows to the
  desktop profile's cordis.patch.yml. Idempotent: safe to re-run.

  After installing, restart DeepSeek Harness Desktop. "Add workspace" will then
  open the native Windows Explorer folder picker instead of the in-app
  directory browser.

.PARAMETER RepoRoot
  The plugin repository root (defaults to this script's directory).

.PARAMETER DSHHome
  The harness home directory (defaults to $env:DSH_HOME or ~/.dsh).
#>
param(
  [string]$RepoRoot = (Split-Path -Parent $MyInvocation.MyCommand.Path),
  [string]$DSHHome = $(if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $HOME '.dsh' })
)
$ErrorActionPreference = 'Stop'
$Name = 'dsh-workspace-explorer-picker'
$ProfileName = 'desktop'

$profilesNodeModules = Join-Path $DSHHome 'profiles
ode_modules'
$profileDir = Join-Path $DSHHome ("profiles" + $ProfileName)
$target = Join-Path $profilesNodeModules $Name

if (-not (Test-Path $profilesNodeModules)) {
  throw "Profile node_modules not found: $profilesNodeModules (is DSH_HOME correct?)"
}
if (-not (Test-Path $profileDir)) {
  throw "Desktop profile not found: $profileDir"
}

Write-Host "Installing $Name -> $target"
New-Item -ItemType Directory -Force -Path $target | Out-Null
Copy-Item -Force -Recurse (Join-Path $RepoRoot 'lib'), (Join-Path $RepoRoot 'package.json'), (Join-Path $RepoRoot 'README.md'), (Join-Path $RepoRoot 'LICENSE') -Destination $target

$patchPath = Join-Path $profileDir 'cordis.patch.yml'
$marker = $Name
$content = Get-Content -Raw $patchPath
if ($content -match [regex]::Escape($marker)) {
  Write-Host "Patch already applied in $patchPath (nothing to do)"
} else {
  $rows = @"

# --- Added by dsh-workspace-explorer-picker (install.ps1) ---
# DeepSeek Harness Desktop: open the Windows Explorer folder picker directly
# for "Add workspace", replacing the in-app directory browser.
- id: directory-picker
  disabled: true
- insert:
    - id: directory-picker-explorer
      name: '$Name'
"@
  $lines = Get-Content $patchPath
  $cleaned = $lines | Where-Object { $_.Trim() -ne '[]' }
  Set-Content -Path $patchPath -Value $cleaned -Encoding UTF8
  Add-Content -Path $patchPath -Value $rows -Encoding UTF8
  Write-Host "Patched $patchPath"
}

Write-Host ""
Write-Host "Done. Restart DeepSeek Harness Desktop for the change to take effect."
