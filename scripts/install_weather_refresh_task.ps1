# Optional: one-time setup of daily local weather maintenance.
# Run only after confirming backend Python env and Supabase access.
# Uses the currently active python.exe so run from your working venv.
$ErrorActionPreference = 'Stop'
$backend = (Resolve-Path (Join-Path $PSScriptRoot '..\backend')).Path
$python = (Get-Command python -ErrorAction Stop).Source
$script = Join-Path $backend 'backfill_temperatures.py'
$action = New-ScheduledTaskAction -Execute $python `
    -Argument ('"' + $script + '" --apply --refresh-preliminary') `
    -WorkingDirectory $backend
$trigger = New-ScheduledTaskTrigger -Daily -At '19:00'
Register-ScheduledTask -TaskName 'NEERA Weather Maintenance' `
    -Description 'Refresh older preliminary weather and fill missing weather fields for NEERA, weather columns only.' `
    -Action $action -Trigger $trigger -Force | Out-Null
Write-Host 'Registered: NEERA Weather Maintenance (daily, 7:00 PM local computer time).'
Write-Host "Python: $python"
Write-Host 'Runs only when permitted by your Windows task settings and when computer is available.'
Write-Host 'To remove: Unregister-ScheduledTask -TaskName "NEERA Weather Maintenance" -Confirm:$false'
