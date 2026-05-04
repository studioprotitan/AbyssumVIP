# ══════════════════════════════════════════════════════════════
#  DEPLOY_V1.5.ps1
#  Target: https://github.com/studioprotitan/Forge-Avatars.git
# ══════════════════════════════════════════════════════════════

$RepoUrl = "https://github.com/studioprotitan/Forge-Avatars.git"
$CommitMsg = "v1.5: CST deployment bridge — CharacterController, Mint-to-Deploy GLB, standalone HTML suite, workspace clean"

Write-Host "1. Configuring Remote: origin -> $RepoUrl"
$remotes = git remote
if ($remotes -contains "origin") {
    git remote set-url origin $RepoUrl
} else {
    git remote add origin $RepoUrl
}

Write-Host "2. Staging and Committing..."
git add .
git commit -m "$CommitMsg" *>&1 | Out-Null
if ($LASTEXITCODE -eq 0) { Write-Host "   Commit created." -ForegroundColor Green }
else { Write-Host "   (No changes to commit, proceeding...)" -ForegroundColor Gray }

Write-Host "3. Ensuring Main Branch..."
git branch -M main

Write-Host "4. Pushing to GitHub..."
git push -u origin main