param(
    [string]$GitHubRepoUrl = $env:GITHUB_REPO_URL,
    [string]$UserName = $env:GIT_USER_NAME,
    [string]$UserEmail = $env:GIT_USER_EMAIL,
    [switch]$CreateRepo,
    [switch]$Push
)

function Write-Log {
    param([string]$Message)
    Write-Host "[setup-github] $Message"
}

function Run-Git {
    param([string[]]$Args)
    $result = git @Args 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Git failed: git $($Args -join ' ')`n$result"
    }
    return $result
}

# Ensure Git repository exists
if (-not (git rev-parse --is-inside-work-tree 2>$null)) {
    Write-Log "Git repository not found. Initializing..."
    Run-Git -Args @('init')
} else {
    Write-Log "Git repository already initialized."
}

# Ensure user identity is configured for this repository
if (-not $UserName) {
    $UserName = git config --local user.name 2>$null
}
if (-not $UserEmail) {
    $UserEmail = git config --local user.email 2>$null
}

if (-not $UserName) {
    $UserName = Read-Host 'Enter Git user.name'
    if (-not $UserName) { throw 'Git user.name is required.' }
    Run-Git -Args @('config', '--local', 'user.name', $UserName)
}

if (-not $UserEmail) {
    $UserEmail = Read-Host 'Enter Git user.email'
    if (-not $UserEmail) { throw 'Git user.email is required.' }
    Run-Git -Args @('config', '--local', 'user.email', $UserEmail)
}

Write-Log "Using Git identity: $UserName <$UserEmail>"

# Create initial commit if needed
$hasHead = $true
try {
    git rev-parse --verify HEAD >$null 2>&1
} catch {
    $hasHead = $false
}

if (-not $hasHead) {
    Write-Log 'Creating initial commit...'
    Run-Git -Args @('add', '.')
    Run-Git -Args @('commit', '-m', 'Initial commit')
    Run-Git -Args @('branch', '-M', 'main')
} else {
    Write-Log 'Repository already has commits.'
}

# Create GitHub repository if requested and GitHub CLI is available
if ($CreateRepo) {
    if (Get-Command gh -ErrorAction SilentlyContinue) {
        Write-Log 'Creating GitHub repository using gh...'
        $repoName = Split-Path -Leaf (Get-Location).Path
        gh repo create $repoName --public --source . --remote origin --push
        $GitHubRepoUrl = git remote get-url origin 2>$null
    } else {
        Write-Log 'GitHub CLI not found. Skipping automatic repository creation.'
    }
}

# Configure remote origin if a URL is provided
if ($GitHubRepoUrl) {
    $existing = git remote get-url origin 2>$null
    if ($existing) {
        if ($existing -ne $GitHubRepoUrl) {
            Write-Log "Updating existing origin remote to $GitHubRepoUrl"
            Run-Git -Args @('remote', 'set-url', 'origin', $GitHubRepoUrl)
        } else {
            Write-Log "Remote origin already set to $GitHubRepoUrl"
        }
    } else {
        Write-Log "Adding remote origin $GitHubRepoUrl"
        Run-Git -Args @('remote', 'add', 'origin', $GitHubRepoUrl)
    }
}

if ($Push -and $GitHubRepoUrl) {
    Write-Log 'Pushing main branch to origin...'
    Run-Git -Args @('push', '-u', 'origin', 'main')
}

Write-Log 'GitHub integration setup complete.'
Write-Log 'Run `./setup-github.ps1 -GitHubRepoUrl <url> -Push` to add a remote and push.'
