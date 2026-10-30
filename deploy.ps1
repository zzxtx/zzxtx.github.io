# ---------------------------------------------------------------------------
#  Hexo deployment with automatic proxy detection.
#
#  Why this exists:
#    ~/.gitconfig pins a proxy for https://github.com (http://127.0.0.1:7897).
#    When the VPN is off, nothing listens on that port and git fails with
#    "Failed to connect to github.com port 443 via 127.0.0.1".
#    Git has no built-in "try proxy, fall back to direct" logic, so this
#    script probes the local proxy port first and configures git accordingly.
#
#  NOTE: This file is intentionally ASCII-only. Windows PowerShell 5.1
#        decodes BOM-less files as ANSI, which would garble Chinese text.
#        All user-facing Chinese lives in deploy.bat instead.
#
#  Exit codes:
#    0  success
#    3  no local proxy was found AND the direct connection failed
#    4  a local proxy was found but both proxy and direct attempts failed
# ---------------------------------------------------------------------------

$ErrorActionPreference = 'Continue'

$ProjectRoot = $PSScriptRoot
if ($ProjectRoot) { Set-Location -LiteralPath $ProjectRoot }

# Key that scopes the proxy to github.com only (other hosts stay direct).
$CfgKey = 'http.https://github.com.proxy'

# Well-known local HTTP proxy ports, in priority order:
# 7897 Clash Verge / Clash for Windows (mixed), 7890 Clash, 7891 alt,
# 10809 v2rayN, 10808 v2rayN socks, 1080 generic, 2080 legacy.
$CandidatePorts = @(7897, 7890, 7891, 10809, 10808, 1080, 2080)

function Test-LocalPort {
    param(
        [int]$Port,
        [int]$TimeoutMs = 300
    )
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $client.BeginConnect('127.0.0.1', $Port, $null, $null)
        $signaled = $async.AsyncWaitHandle.WaitOne($TimeoutMs, $false)
        if (-not $signaled) { return $false }
        $client.EndConnect($async)
        return $true
    }
    catch {
        return $false
    }
    finally {
        try { $client.Close() } catch { }
    }
}

function Get-AliveProxyPort {
    foreach ($p in $CandidatePorts) {
        if (Test-LocalPort -Port $p) { return $p }
    }
    return 0
}

function Set-GitProxy {
    param([int]$Port)
    if ($Port -gt 0) {
        & git config --global $CfgKey "http://127.0.0.1:$Port" 2>$null | Out-Null
    }
    else {
        & git config --global --unset $CfgKey 2>$null | Out-Null
    }
}

function Invoke-HexoDeploy {
    & cmd /c "npx hexo deploy"
    return $LASTEXITCODE
}

# --- 1. probe -------------------------------------------------------------
$proxyPort = Get-AliveProxyPort
Set-GitProxy -Port $proxyPort

if ($proxyPort -gt 0) {
    Write-Host ("[proxy] 127.0.0.1:{0} is alive -> routing github through it" -f $proxyPort) -ForegroundColor DarkGray
}
else {
    Write-Host "[proxy] nothing listening locally -> trying direct connection" -ForegroundColor DarkGray
}

# --- 2. deploy ------------------------------------------------------------
$code = Invoke-HexoDeploy

# --- 3. one fallback attempt ---------------------------------------------
if ($code -ne 0 -and $proxyPort -gt 0) {
    Write-Host "[retry] proxy attempt failed, switching to direct connection" -ForegroundColor DarkYellow
    Set-GitProxy -Port 0
    $code = Invoke-HexoDeploy
}

# --- 4. report ------------------------------------------------------------
if ($code -eq 0) {
    Write-Host "[ok] deploy finished" -ForegroundColor Green
    exit 0
}
if ($proxyPort -eq 0) {
    Write-Host "[fail] no proxy available and direct connection failed" -ForegroundColor Red
    exit 3
}
Write-Host "[fail] both proxy and direct attempts failed" -ForegroundColor Red
exit 4
