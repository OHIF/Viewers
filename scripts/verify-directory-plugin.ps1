<#
WS4.3 — Windows HMR/watch + duplicate-React verification recipe for a `directory` plugin (~ path).

Validates WS4.1 (dedupe aliases in .rspack/resolveConfig.js) and WS4.2 (Tailwind content
globs for declared directory plugins, platform/app/tailwind.config.js:24) by running
@ohif/extension-cornerstone as an out-of-tree copy under $env:USERPROFILE\ohif-plugins.

What the recipe exercises:
  - '~' path form            platform/app/.rspack/writePluginImportsFile.js:213 (homedir expansion);
                             a `directory` field wins over the in-tree workspace lookup (:276-283)
  - watch                    the external dir is outside WATCH_IGNORED
                             (platform/app/.rspack/rspack.pwa.js:14,263 and rsbuild.config.ts:36,138)
  - fast refresh             react-refresh dev rules exclude node_modules by path substring,
                             so the copy must NOT live under any folder named node_modules
  - out-of-repo transpile    project-wide babel config (rootMode 'upward' + platform/app/babel.config.js)
  - dedupe aliases           .rspack/resolveConfig.js:39-47 (spread into `alias` at :50)

Usage (from the repo root, PowerShell on Windows):
  .\scripts\verify-directory-plugin.ps1                    # full interactive recipe (steps 1-7)
  .\scripts\verify-directory-plugin.ps1 -Step setup        # steps 1-2 only (copy + pluginConfig override)
  .\scripts\verify-directory-plugin.ps1 -Step plant-react  # step 6 planting
  .\scripts\verify-directory-plugin.ps1 -Step assert-clean # step 6a grep (expects 0 hits)
  .\scripts\verify-directory-plugin.ps1 -Step break-aliases
  .\scripts\verify-directory-plugin.ps1 -Step assert-dup   # step 6b grep (expects > 0 hits)
  .\scripts\verify-directory-plugin.ps1 -Step restore-aliases
  .\scripts\verify-directory-plugin.ps1 -Step cleanup      # step 7 (revert pluginConfig, delete copy)

All edits are temporary: pluginConfig.json is backed up and restored, the alias toggle is
reversed, and the out-of-tree copy is deleted. Hard gates (the recipe IS the verification):
  - step 4 fast refresh works on BOTH `pnpm dev` (rspack) and `pnpm dev:fast` (rsbuild)
  - step 5 computed font-size of the probe is exactly 13.7px on both pipelines
  - step 6a grep count is exactly 0 with no 'Invalid hook call' in the console
  - step 6b grep count is > 0 AND 'Invalid hook call' observed (the test can fail)
  - step 7 leaves `git status` clean except intended WS4 files
#>

[CmdletBinding()]
param(
  [ValidateSet('all', 'setup', 'plant-react', 'assert-clean', 'break-aliases', 'assert-dup',
    'restore-aliases', 'cleanup')]
  [string]$Step = 'all',
  [string]$RepoRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'

$PluginDir = Join-Path $env:USERPROFILE 'ohif-plugins\cornerstone'
$PluginConfig = Join-Path $RepoRoot 'platform\app\pluginConfig.json'
$PluginConfigBak = "$PluginConfig.ws43.bak"
$ResolveConfig = Join-Path $RepoRoot '.rspack\resolveConfig.js'
$DistGlobs = @(
  (Join-Path $RepoRoot 'platform\app\dist\*.js'),
  (Join-Path $RepoRoot 'platform\app\dist\*.js.map')
)
# Bundle-level duplicate-React probe: any module compiled from a react copy that
# lives inside the out-of-tree plugin's own node_modules.
$DupPattern = 'ohif-plugins[\\/](.*[\\/])?node_modules[\\/]react'
$AliasSpread = '  ...dedupeAlias,'
$AliasSpreadOff = '  // ...dedupeAlias, // WS4.3 step 6b negative control - restore before finishing'
$OverlayRelPath = 'src\Viewport\Overlays\CustomizableViewportOverlay.tsx'

$script:Gates = [System.Collections.Generic.List[object]]::new()

# BOM-free UTF-8 on both Windows PowerShell 5.1 and PowerShell 7 (Set-Content's
# default encoding differs between them and 5.1 would re-encode non-ASCII comments).
$Utf8NoBom = [System.Text.UTF8Encoding]::new($false)

function Read-Text([string]$Path) { [System.IO.File]::ReadAllText($Path) }
function Write-Text([string]$Path, [string]$Text) { [System.IO.File]::WriteAllText($Path, $Text, $Utf8NoBom) }

function Add-Gate([string]$Name, [bool]$Passed, [string]$Detail = '') {
  $script:Gates.Add([pscustomobject]@{ Gate = $Name; Passed = $Passed; Detail = $Detail })
  $status = if ($Passed) { 'PASS' } else { 'FAIL' }
  Write-Host ("  [{0}] {1}  {2}" -f $status, $Name, $Detail)
}

function Confirm-Gate([string]$Name, [string]$Question) {
  $answer = Read-Host "$Question (y/n)"
  Add-Gate $Name ($answer -match '^[Yy]')
}

function Get-DupHitCount {
  # Dev server writes dist to disk (devMiddleware.writeToDisk: true, rspack.pwa.js:234),
  # so the bundle and its source maps are grep-able while the server runs.
  if (-not (Get-ChildItem -Path $DistGlobs -ErrorAction SilentlyContinue)) {
    throw "no bundles found under platform\app\dist - start the dev server (writeToDisk) or run a build first"
  }
  $hits = Select-String -Path $DistGlobs -Pattern $DupPattern -ErrorAction SilentlyContinue
  return ($hits | Measure-Object).Count
}

function Invoke-Setup {
  Write-Host '== Step 1: out-of-tree copy (~/ohif-plugins/cornerstone) =='
  robocopy (Join-Path $RepoRoot 'extensions\cornerstone') $PluginDir /E /XD node_modules dist | Out-Null
  if ($LASTEXITCODE -ge 8) { throw 'copy failed' }  # robocopy 0-7 = success
  Write-Host "  copied extensions\cornerstone -> $PluginDir"

  Write-Host '== Step 2: declare the directory override in pluginConfig.json =='
  $raw = Read-Text $PluginConfig
  if ($raw -match 'ohif-plugins/cornerstone') {
    Write-Host '  directory override already present, skipping edit'
  } else {
    $needle = '"packageName": "@ohif/extension-cornerstone"'
    $count = ([regex]::Matches($raw, [regex]::Escape($needle))).Count
    if ($count -ne 1) { throw "expected exactly one bare '$needle' entry, found $count" }
    if (-not (Test-Path $PluginConfigBak)) { Copy-Item $PluginConfig $PluginConfigBak }
    $replacement = $needle + ",`n      ""directory"": ""~/ohif-plugins/cornerstone"""
    Write-Text $PluginConfig ($raw.Replace($needle, $replacement))
    Write-Host "  added directory: ~/ohif-plugins/cornerstone (backup: $PluginConfigBak)"
  }

  Write-Host '== Static check: Tailwind content glob for the external copy (WS4.2) =='
  Push-Location $RepoRoot
  try {
    $globs = node -e "const path=require('path');const c=require(path.resolve('platform/app/tailwind.config.js'));console.log(c.content.filter(g=>String(g).includes('ohif-plugins')).join('\n'))"
  } finally { Pop-Location }
  $hasGlob = $globs -match 'ohif-plugins/cornerstone/src'
  Add-Gate 'setup-tailwind-glob' ([bool]$hasGlob) ($globs | Out-String).Trim()
}

function Invoke-PlantReact {
  Write-Host '== Step 6: plant a plugin-local React (no package manager run) =='
  New-Item -ItemType Directory -Force (Join-Path $PluginDir 'node_modules') | Out-Null
  foreach ($pkg in 'react', 'react-dom') {
    $dest = Join-Path $PluginDir "node_modules\$pkg"
    if (-not (Test-Path $dest)) {
      Copy-Item -Recurse (Join-Path $RepoRoot "node_modules\$pkg") $dest
    }
  }
  Write-Host "  planted react + react-dom under $PluginDir\node_modules"
}

function Invoke-AssertClean {
  Write-Host '== Step 6a: bundle grep, aliases ACTIVE (expect 0) =='
  $count = Get-DupHitCount
  Add-Gate 'step6a-grep-zero' ($count -eq 0) "hit count = $count (must be 0)"
  Write-Host '  secondary runtime check (React DevTools): __REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.size === 1'
}

function Invoke-BreakAliases {
  Write-Host '== Step 6b: negative control - disable the dedupe alias spread =='
  $raw = Read-Text $ResolveConfig
  if ($raw.Contains($AliasSpreadOff)) {
    Write-Host '  spread already disabled'
    return
  }
  if (-not $raw.Contains($AliasSpread)) { throw "could not find '$AliasSpread' in $ResolveConfig" }
  Write-Text $ResolveConfig ($raw.Replace($AliasSpread, $AliasSpreadOff))
  Write-Host "  commented out '...dedupeAlias,' in .rspack\resolveConfig.js - restart the dev server"
}

function Invoke-AssertDup {
  Write-Host '== Step 6b: bundle grep, aliases DISABLED (expect > 0) =='
  $count = Get-DupHitCount
  Add-Gate 'step6b-grep-nonzero' ($count -gt 0) "hit count = $count (must be > 0)"
}

function Invoke-RestoreAliases {
  Write-Host '== Restore the dedupe alias spread =='
  $raw = Read-Text $ResolveConfig
  if ($raw.Contains($AliasSpreadOff)) {
    Write-Text $ResolveConfig ($raw.Replace($AliasSpreadOff, $AliasSpread))
    Write-Host '  restored - restart the dev server and re-run -Step assert-clean'
  } else {
    Write-Host '  spread already active, nothing to restore'
  }
}

function Invoke-Cleanup {
  Write-Host '== Step 7: cleanup =='
  Invoke-RestoreAliases
  if (Test-Path $PluginConfigBak) {
    Move-Item -Force $PluginConfigBak $PluginConfig
    Write-Host '  restored platform\app\pluginConfig.json'
  }
  if (Test-Path $PluginDir) {
    Remove-Item -Recurse -Force $PluginDir
    Write-Host "  deleted $PluginDir"
  }
  $pluginsRoot = Split-Path -Parent $PluginDir
  if ((Test-Path $pluginsRoot) -and -not (Get-ChildItem -Force $pluginsRoot)) {
    Remove-Item -Force $pluginsRoot
  }
  Write-Host '  git status (must be clean except intended WS4 files):'
  git -C $RepoRoot status --short
}

function Invoke-All {
  Invoke-Setup

  Write-Host ''
  Write-Host '== Step 3: boot with local data (rspack pipeline) =='
  Write-Host '  In another terminal, from the repo root:'
  Write-Host '    pnpm test:data                                (once)'
  Write-Host '    pnpm --filter @ohif/app run test:e2e:serve    (APP_CONFIG=config/e2e.js, local studies)'
  Write-Host '  Open any CT/MR study. The viewport overlay rendering proves the external copy'
  Write-Host '  compiled (bare react/@ohif/core imports resolved via the dedupe aliases; deep'
  Write-Host '  subpaths like @ohif/ui-next/lib/* via moduleSearchPaths - the copy has no node_modules).'
  Confirm-Gate 'step3-boot' 'Does the study load with the viewport overlay rendered'

  Write-Host ''
  Write-Host '== Step 4: HMR probe =='
  Write-Host "  Edit $PluginDir\$OverlayRelPath"
  Write-Host '  Add a visible literal inside the rendered JSX, e.g.:'
  Write-Host '    <span className="text-[13.7px]">HMR-PROBE</span>'
  Write-Host '  On save: recompile triggers (watch not ignored) and the string appears via'
  Write-Host '  fast refresh WITHOUT a full page reload.'
  Confirm-Gate 'step4-hmr-rspack' 'Did HMR-PROBE appear via fast refresh (no full reload) on the rspack server'

  Write-Host ''
  Write-Host '== Step 5: Tailwind glob proof =='
  Write-Host '  In DevTools, inspect the probe element: computed font-size must be exactly 13.7px.'
  Write-Host '  Arbitrary-value utilities are generated ONLY if the content globs scanned the'
  Write-Host '  external file, so this cannot false-pass.'
  Confirm-Gate 'step5-fontsize-rspack' 'Is the computed font-size exactly 13.7px'

  Write-Host ''
  Write-Host '== Steps 3-5 on the second pipeline (rsbuild) =='
  Write-Host '  Stop the rspack server, then from the repo root:'
  Write-Host '    cross-env APP_CONFIG=config/e2e.js pnpm dev:fast'
  Confirm-Gate 'step3-boot-rsbuild' 'Does the study load with the overlay rendered on dev:fast'
  Confirm-Gate 'step4-hmr-rsbuild' 'Did the probe edit fast-refresh (no full reload) on dev:fast'
  Confirm-Gate 'step5-fontsize-rsbuild' 'Is the computed font-size exactly 13.7px on dev:fast'

  Write-Host ''
  Invoke-PlantReact
  Write-Host '  (6a) Aliases ACTIVE: restart the rspack dev server (pnpm dev / test:e2e:serve),'
  Write-Host '  open a study, and check the console.'
  Confirm-Gate 'step6a-no-hook-error' "Is the console free of 'Invalid hook call'"
  Invoke-AssertClean

  Write-Host ''
  Invoke-BreakAliases
  Write-Host '  Restart the dev server, open a study. The importer-relative walk-up now picks'
  Write-Host '  the plugin-local React copy.'
  Read-Host '  Press Enter once the server has rebuilt and the study page was opened'
  Invoke-AssertDup
  Confirm-Gate 'step6b-hook-error-observed' "Did the viewer throw the React 'Invalid hook call' / null-dispatcher error"

  Write-Host ''
  Invoke-RestoreAliases
  Write-Host '  Restart the dev server and confirm 6a passes again.'
  Read-Host '  Press Enter once the server has rebuilt and the study page was opened'
  $count = Get-DupHitCount
  Add-Gate 'step6a-repass-grep-zero' ($count -eq 0) "hit count = $count (must be 0)"
  Confirm-Gate 'step6a-repass-no-hook-error' "Is the console free of 'Invalid hook call' again"

  Write-Host ''
  Invoke-Cleanup
  Confirm-Gate 'step7-clean-tree' 'Is git status clean except intended WS4 files'

  Write-Host ''
  Write-Host '== Summary =='
  $script:Gates | Format-Table -AutoSize | Out-String | Write-Host
  if ($script:Gates | Where-Object { -not $_.Passed }) {
    Write-Host 'RESULT: FAIL'
    exit 1
  }
  Write-Host 'RESULT: PASS'
}

switch ($Step) {
  'setup' { Invoke-Setup }
  'plant-react' { Invoke-PlantReact }
  'assert-clean' { Invoke-AssertClean }
  'break-aliases' { Invoke-BreakAliases }
  'assert-dup' { Invoke-AssertDup }
  'restore-aliases' { Invoke-RestoreAliases }
  'cleanup' { Invoke-Cleanup }
  default { Invoke-All }
}

if ($Step -ne 'all' -and ($script:Gates | Where-Object { -not $_.Passed })) { exit 1 }
