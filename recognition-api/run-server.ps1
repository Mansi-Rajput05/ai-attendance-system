param(
    [string]$HostAddress = "127.0.0.1",
    [int]$Port = 8000,
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $ScriptDir

$VenvDir = Join-Path $ScriptDir ".venv"
$Python = Join-Path $VenvDir "Scripts\python.exe"

if (-not (Test-Path -LiteralPath $Python)) {
    "Creating local Python virtual environment..."
    py -m venv $VenvDir
}

if (-not $SkipInstall) {
    "Installing recognition API dependencies..."
    & $Python -m pip install --upgrade pip
    & $Python -m pip install -r requirements.txt
}

"Starting recognition API at http://$HostAddress`:$Port"
& $Python -m uvicorn api:app --reload --host $HostAddress --port $Port
