# ==============================================================================
# LearnQuest - Secret Leaks & Key Safety Verification Script (PowerShell)
# ==============================================================================

Write-Host "🔍 Starting Secret Leak & Key Safety Scan for LearnQuest..." -ForegroundColor Cyan

$fail = $false

# 1. Check if backend/.env is tracked
$gitEnv = git ls-files backend/.env 2>$null
if ($gitEnv) {
    Write-Host "❌ CRITICAL: backend/.env is tracked in git!" -ForegroundColor Red
    $fail = $true
} else {
    Write-Host "✅ backend/.env is properly ignored." -ForegroundColor Green
}

# 2. Check if .env.example contains non-empty secrets
if (Test-Path "backend/.env.example") {
    $envEx = Get-Content "backend/.env.example" -Raw
    if ($envEx -match "AI_API_KEY=\S+") {
        Write-Host "❌ backend/.env.example contains non-empty AI_API_KEY!" -ForegroundColor Red
        $fail = $true
    } else {
        Write-Host "✅ backend/.env.example has empty secret templates." -ForegroundColor Green
    }
}

# 3. Check for API key patterns in frontend src and dist
$patterns = @("AIza[0-9A-Za-z_-]{35}", "sk-[0-9A-Za-z_-]{20,}")

foreach ($pat in $patterns) {
    $matchesSrc = Get-ChildItem -Path "frontend/src", "frontend/dist" -Recurse -File -ErrorAction SilentlyContinue | 
        Select-String -Pattern $pat

    if ($matchesSrc) {
        Write-Host "❌ CRITICAL: Found suspicious secret pattern in frontend:" -ForegroundColor Red
        $matchesSrc | ForEach-Object { Write-Host $_.Line }
        $fail = $true
    }
}

if (-not $fail) {
    Write-Host "🎉 SUCCESS: 0 secrets or API keys found in frontend or git-tracked files." -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ FAILED: Secrets detected." -ForegroundColor Red
    exit 1
}
