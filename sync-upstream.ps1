# Sync Upstream Automation Script
# Auto-detect Backend or Frontend and sync from developer's repos

param([switch]$DryRun = $false)

function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }

Write-Info "========================================="
Write-Info "  SYNC UPSTREAM AUTOMATION"
Write-Info "========================================="
Write-Host ""

# Detect project type
$currentPath = Get-Location
$projectType = $null
$upstreamUrl = $null

if ($currentPath -match "Backend_APP_AGENT") {
    $projectType = "Backend"
    $upstreamUrl = "https://github.com/Kevinfal383/Backend_APP_AGENT"
    Write-Success "[OK] Detected: BACKEND"
} elseif ($currentPath -match "Frontend_APP_AGENT") {
    $projectType = "Frontend"
    $upstreamUrl = "https://github.com/Kevinfal383/Frontend_APP_AGENT"
    Write-Success "[OK] Detected: FRONTEND"
} else {
    Write-Error "[ERROR] You must be in Backend_APP_AGENT or Frontend_APP_AGENT"
    Write-Warning "Current directory: $currentPath"
    exit 1
}

Write-Info "Upstream URL: $upstreamUrl"
Write-Host ""

# Switch to angelinah-creator account
Write-Info "-> Configuring Git account..."
git config user.name "angelinah-creator"
git config user.email "angelinah@info.code-talent.fr"
$currentUser = git config user.name
Write-Success "[OK] Active account: $currentUser"
Write-Host ""

# Check and add upstream remote
Write-Info "-> Checking 'upstream' remote..."
$existingRemotes = git remote -v | Select-String "upstream"

if ($existingRemotes) {
    Write-Success "[OK] Remote 'upstream' already exists"
    $currentUpstream = git remote get-url upstream 2>$null
    if ($currentUpstream -and $currentUpstream -ne $upstreamUrl) {
        Write-Warning "[!] Current upstream URL differs"
        Write-Info "-> Updating URL..."
        git remote set-url upstream $upstreamUrl
        Write-Success "[OK] Upstream URL updated"
    }
} else {
    Write-Info "-> Adding remote 'upstream'..."
    git remote add upstream $upstreamUrl
    Write-Success "[OK] Remote 'upstream' added"
}
Write-Host ""

# Fetch upstream
Write-Info "-> Fetching upstream updates..."
git fetch upstream 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Success "[OK] Fetch upstream successful"
} else {
    Write-Error "[ERROR] Fetch upstream failed"
    exit 1
}
Write-Host ""

# Detect main branch
Write-Info "-> Detecting upstream main branch..."
$upstreamBranches = git branch -r | Select-String "upstream/"
$mainBranch = $null

if ($upstreamBranches -match "upstream/main") {
    $mainBranch = "main"
    Write-Success "[OK] Detected: upstream/main"
} elseif ($upstreamBranches -match "upstream/master") {
    $mainBranch = "master"
    Write-Success "[OK] Detected: upstream/master"
} else {
    Write-Error "[ERROR] No main/master branch found in upstream"
    exit 1
}
Write-Host ""

# Save current branch
$currentBranch = git branch --show-current
Write-Info "-> Current branch: $currentBranch"

# Create/switch to sync-upstream branch
Write-Info "-> Creating/switching to 'sync-upstream'..."
git checkout -B sync-upstream 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Success "[OK] Switched to sync-upstream"
} else {
    Write-Error "[ERROR] Failed to switch to sync-upstream"
    exit 1
}
Write-Host ""

# Merge upstream
Write-Info "-> Merging upstream/$mainBranch into sync-upstream..."
Write-Warning "   (Conflicts will be detected automatically)"
Write-Host ""

if (-not $DryRun) {
    git merge upstream/$mainBranch --no-commit --no-ff 2>&1 | Out-Null
    $mergeStatus = $LASTEXITCODE
    
    $conflictFiles = git diff --name-only --diff-filter=U 2>$null
    
    if ($mergeStatus -ne 0 -or $conflictFiles) {
        Write-Warning "========================================="
        Write-Warning "  [!] CONFLICTS DETECTED"
        Write-Warning "========================================="
        Write-Host ""
        
        if ($conflictFiles) {
            Write-Error "Conflicting files:"
            $conflictFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
        }
        
        Write-Host ""
        Write-Warning "-> You must resolve conflicts manually"
        Write-Info "  1. Resolve conflicts in listed files"
        Write-Info "  2. Run: git add <resolved-files>"
        Write-Info "  3. Run: git commit"
        Write-Host ""
    } else {
        Write-Success "[OK] Merge successful without conflicts"
        git commit -m "chore: sync upstream/$mainBranch - $(Get-Date -Format 'yyyy-MM-dd')" 2>&1 | Out-Null
        Write-Success "[OK] Sync commit created"
    }
} else {
    Write-Info "[DRY RUN] Merge simulated (no changes)"
}

Write-Host ""

# Analyze sensitive files
Write-Info "========================================="
Write-Info "  SENSITIVE FILES ANALYSIS"
Write-Info "========================================="
Write-Host ""

$sensitivePatterns = @("*.env*", "*config.prod*", "*docker-compose*", "*nginx*", "*.secret*", "*serviceAccountKey*", "*.pem", "*.key")
$allModifiedFiles = git diff --name-only upstream/$mainBranch...HEAD 2>$null
$sensitiveMatches = @()

foreach ($pattern in $sensitivePatterns) {
    $matches = $allModifiedFiles | Where-Object { $_ -like $pattern }
    if ($matches) {
        $sensitiveMatches += $matches
    }
}

if ($sensitiveMatches) {
    Write-Warning "[!] Sensitive files detected in modifications:"
    $sensitiveMatches | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    Write-Warning ""
    Write-Warning "-> WARNING: Check these files before merging to main!"
} else {
    Write-Success "[OK] No sensitive files modified"
}

Write-Host ""

# Show new commits
Write-Info "========================================="
Write-Info "  NEW UPSTREAM COMMITS"
Write-Info "========================================="
Write-Host ""

$commitLog = git log --oneline --graph --decorate HEAD...upstream/$mainBranch -20 2>$null

if ($commitLog) {
    $commitLog | ForEach-Object { Write-Info $_ }
} else {
    Write-Success "No new upstream commits"
}

Write-Host ""

# Statistics
Write-Info "========================================="
Write-Info "  MODIFICATION STATISTICS"
Write-Info "========================================="
Write-Host ""

$stats = git diff --stat upstream/$mainBranch...HEAD 2>$null

if ($stats) {
    $stats | ForEach-Object { Write-Info $_ }
} else {
    Write-Success "No differences with upstream"
}

Write-Host ""

# Risk estimation
$riskLevel = "LOW"
$riskColor = "Green"
$riskReasons = @()

if ($conflictFiles) {
    $riskLevel = "HIGH"
    $riskColor = "Red"
    $riskReasons += "Conflicts detected"
}

if ($sensitiveMatches) {
    if ($riskLevel -eq "LOW") { $riskLevel = "MEDIUM" }
    $riskColor = "Yellow"
    $riskReasons += "Sensitive files modified"
}

$filesChanged = ($allModifiedFiles | Measure-Object).Count
if ($filesChanged -gt 50) {
    if ($riskLevel -eq "LOW") { $riskLevel = "MEDIUM" }
    $riskColor = "Yellow"
    $riskReasons += "Many files changed ($filesChanged)"
}

Write-Info "========================================="
Write-Host "  RISK LEVEL: " -NoNewline
Write-Host $riskLevel -ForegroundColor $riskColor
Write-Info "========================================="
Write-Host ""

if ($riskReasons) {
    Write-Warning "Reasons:"
    $riskReasons | ForEach-Object { Write-Host "  * $_" -ForegroundColor Yellow }
    Write-Host ""
}

# Final summary
Write-Info "========================================="
Write-Info "  SYNCHRONIZATION SUMMARY"
Write-Info "========================================="
Write-Host ""

Write-Success "[OK] Project type: $projectType"
Write-Success "[OK] Upstream: $upstreamUrl"
Write-Success "[OK] Upstream branch: $mainBranch"
Write-Success "[OK] Sync branch: sync-upstream"
Write-Success "[OK] Files changed: $filesChanged"
Write-Success "[OK] Risk level: $riskLevel"
Write-Host ""

Write-Info "========================================="
Write-Info "  NEXT STEPS"
Write-Info "========================================="
Write-Host ""

Write-Warning "[!] DO NOT AUTO-MERGE TO MAIN!"
Write-Host ""

if ($conflictFiles) {
    Write-Info "1. Resolve conflicts listed above"
    Write-Info "2. git add <resolved-files>"
    Write-Info "3. git commit"
    Write-Info "4. Test application locally"
    Write-Info "5. If OK: git checkout main && git merge sync-upstream"
} else {
    Write-Info "1. Test application locally on sync-upstream branch"
    Write-Info "2. Verify sensitive files if listed"
    Write-Info "3. If everything OK:"
    Write-Info "   -> git checkout main"
    Write-Info "   -> git merge sync-upstream"
    Write-Info "   -> git push origin main"
}

Write-Host ""
Write-Info "========================================="
Write-Success "  SYNCHRONIZATION COMPLETE!"
Write-Info "========================================="
