import { execFile } from 'child_process';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

export interface PowerShellResult {
  stdout: string;
  stderr: string;
}

const POWERSHELL = 'powershell.exe';
let processElevated: Promise<boolean> | null = null;

export function encodePowerShell(script: string): string {
  return Buffer.from(script, 'utf16le').toString('base64');
}

export function isCurrentProcessElevated(): Promise<boolean> {
  if (process.platform !== 'win32') {
    return Promise.resolve(false);
  }

  if (!processElevated) {
    const script = `
([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
`;
    processElevated = runPowerShellDirect(script)
      .then((result) => result.stdout.trim().toLowerCase() === 'true')
      .catch(() => false);
  }

  return processElevated;
}

export async function requestElevation(): Promise<void> {
  const exePath = process.execPath;
  const args = process.argv.slice(1).map(arg => `'${escapeSingle(arg)}'`).join(', ');

  const script = `
Start-Process -FilePath '${escapeSingle(exePath)}' -ArgumentList @(${args}) -Verb RunAs
`;

  await runPowerShellDirect(script);
}

export function runPowerShell(script: string, elevated = false): Promise<PowerShellResult> {
  if (!elevated) {
    return runPowerShellDirect(script);
  }

  return isCurrentProcessElevated().then((isElevated) => (isElevated ? runPowerShellDirect(script) : runElevatedScript(script)));
}

function runPowerShellDirect(script: string): Promise<PowerShellResult> {
  return new Promise((resolve, reject) => {
    execFile(
      POWERSHELL,
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encodePowerShell(script)],
      { windowsHide: true, maxBuffer: 1024 * 1024 * 12 },
      (error, stdout, stderr) => {
        if (error) {
          const details = [stderr, stdout, error.message, `退出码：${error.code ?? '未知'}`]
            .filter((item) => item && item.trim())
            .join('\n')
            .trim();
          const failure = new Error(details || 'PowerShell 命令执行失败，但没有返回可读错误。');
          reject(failure);
          return;
        }

        resolve({ stdout, stderr });
      }
    );
  });
}

function runElevatedScript(script: string): Promise<PowerShellResult> {
  const dir = path.join(tmpdir(), 'LightQualityTool');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const id = randomUUID();
  const scriptPath = path.join(dir, `${id}.ps1`);
  const stdoutPath = path.join(dir, `${id}.out.txt`);
  const stderrPath = path.join(dir, `${id}.err.txt`);
  const exitPath = path.join(dir, `${id}.exit.txt`);

  const wrapped = `
$ErrorActionPreference = 'Stop'
try {
  $result = & {
${script}
  } *>&1 | Out-String
  Set-Content -LiteralPath '${escapeSingle(stdoutPath)}' -Value $result -Encoding UTF8
  Set-Content -LiteralPath '${escapeSingle(exitPath)}' -Value '0' -Encoding UTF8
} catch {
  $message = if ($_.Exception -and $_.Exception.Message) { $_.Exception.Message } else { $_ | Out-String }
  if (!$message -or ([string]$message).Trim() -eq '[object Object]') {
    $message = $_ | Format-List * -Force | Out-String
  }
  [string]$message | Set-Content -LiteralPath '${escapeSingle(stderrPath)}' -Encoding UTF8
  Set-Content -LiteralPath '${escapeSingle(exitPath)}' -Value '1' -Encoding UTF8
}
`;

  writeUtf16LeWithBom(scriptPath, wrapped);

  const launcher = `
$p = Start-Process -FilePath powershell.exe -ArgumentList @(
  '-NoProfile',
  '-ExecutionPolicy',
  'Bypass',
  '-File',
  '${escapeSingle(scriptPath)}'
) -Verb RunAs -Wait -PassThru -WindowStyle Hidden
if ($null -ne $p.ExitCode -and !(Test-Path -LiteralPath '${escapeSingle(exitPath)}')) {
  Set-Content -LiteralPath '${escapeSingle(exitPath)}' -Value $p.ExitCode -Encoding UTF8
}
`;

  return runPowerShell(launcher, false).then(async () => {
    const reader = `
$stdout = if (Test-Path -LiteralPath '${escapeSingle(stdoutPath)}') { Get-Content -LiteralPath '${escapeSingle(stdoutPath)}' -Raw } else { '' }
$stderr = if (Test-Path -LiteralPath '${escapeSingle(stderrPath)}') { Get-Content -LiteralPath '${escapeSingle(stderrPath)}' -Raw } else { '' }
$exit = if (Test-Path -LiteralPath '${escapeSingle(exitPath)}') { [int](Get-Content -LiteralPath '${escapeSingle(exitPath)}' -Raw) } else { 1 }
[pscustomobject]@{ stdout = $stdout; stderr = $stderr; exitCode = $exit } | ConvertTo-Json -Compress
`;
    const result = await runPowerShell(reader, false);
    const parsed = JSON.parse(result.stdout || '{}') as { stdout?: string; stderr?: string; exitCode?: number };
    if (parsed.exitCode !== 0) {
      const details = [parsed.stderr, parsed.stdout].filter(Boolean).join('\n').trim();
      throw new Error(details || `管理员操作未完成，退出码：${parsed.exitCode ?? '未知'}。如果没有看到 UAC 弹窗，请右键以管理员身份运行本软件后重试。`);
    }

    return { stdout: parsed.stdout || '', stderr: parsed.stderr || '' };
  });
}

export function psString(value: string): string {
  return `'${escapeSingle(value)}'`;
}

function escapeSingle(value: string): string {
  return value.replace(/'/g, "''");
}

function writeUtf16LeWithBom(filePath: string, content: string): void {
  const body = Buffer.from(content, 'utf16le');
  writeFileSync(filePath, Buffer.concat([Buffer.from([0xff, 0xfe]), body]));
}
