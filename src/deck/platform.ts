import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { service, serviceId, type Settings } from './model.ts';
const exec = promisify(execFile);
const powershell = path.join(process.env.SystemRoot || 'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe');
export function psLiteral(value: string) { return `'${value.replace(/'/g,"''")}'`; }
export function processName(s: Settings) {
  const name=(s.processName || service(s).process).replace(/\.exe$/i,'');
  if(!/^[a-zA-Z0-9_.-]{1,80}$/.test(name) || /^(chrome|msedge|firefox|explorer|powershell|pwsh|System|svchost)$/i.test(name)) throw new Error('Kies een eigen AI-app; browserprocessen worden niet gesloten.');
  return name;
}
async function ps(script: string) {
  const encoded=Buffer.from(`$ErrorActionPreference='Stop'; ${script}`,'utf16le').toString('base64');
  return exec(powershell,['-NoProfile','-NonInteractive','-EncodedCommand',encoded],{windowsHide:true,timeout:15000,maxBuffer:65536});
}
export async function openApp(s: Settings): Promise<boolean> {
  if(s.appPath?.trim()) {
    const app=s.appPath.trim();
    if(!path.isAbsolute(app) || !/\.(exe|lnk)$/i.test(app)) throw new Error('Kies een volledig pad naar een .exe of .lnk.');
    await ps(`Start-Process -FilePath ${psLiteral(app)}`); return true;
  }
  const names: Record<string,string[]>={claude:['Claude'],chatgpt:['ChatGPT'],codex:['Codex'],microsoft:['Microsoft Copilot','Copilot']};
  const accepted=names[serviceId(s)]; if(!accepted) return false;
  const result=await ps(`$names=@(${accepted.map(psLiteral).join(',')}); $app=Get-StartApps | Where-Object { $names -contains $_.Name } | Select-Object -First 1; if($app){ Start-Process explorer.exe -ArgumentList ('shell:AppsFolder\\'+$app.AppID); 'opened' }`);
  return result.stdout.includes('opened');
}
export async function closeApp(s: Settings) {
  const result=await ps(`$apps=@(Get-Process -Name ${psLiteral(processName(s))} -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 }); $closed=0; foreach($app in $apps){ if($app.CloseMainWindow()){ $closed++ } }; $closed`);
  if(Number(result.stdout.trim())===0) throw new Error('Geen appvenster gevonden. Webtabs worden niet gesloten.');
}
export async function copyPrompt(s: Settings) {
  if(!s.prompt?.trim()) throw new Error('Vul eerst een prompt in.');
  await ps(`Set-Clipboard -Value ${psLiteral(s.prompt)}`);
}
/** Launch only the official installed sign-in command. Never accept user shell commands. */
export async function login(s: Settings): Promise<string> {
  const id=serviceId(s); const commands: Record<string,{exe:string;args:string[]}>={claude:{exe:'claude',args:['auth','login']},codex:{exe:'codex',args:['login']},github:{exe:'gh',args:['auth','login','--web','--hostname','github.com']}};
  const c=commands[id]; if(!c) return 'Deze dienst gebruikt de aanmelding in je browser of app. Automatisch verbruik is nog niet beschikbaar.';
  const found=await ps(`$c=Get-Command ${psLiteral(c.exe)} -ErrorAction SilentlyContinue; if($c){'found'}`);
  if(!found.stdout.includes('found')) return `De officiële ${c.exe}-aanmeldtool is niet geïnstalleerd. Gebruik de knop Installatiehulp. De gewone appacties werken wel.`;
  // An interactive login window is intentional; routine actions remain hidden.
  const script=`& ${c.exe} ${c.args.join(' ')}; Write-Host 'Je kunt dit venster sluiten en de verbinding controleren.'; Read-Host`;
  const child=spawn(powershell,['-NoProfile','-NoExit','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{detached:true,stdio:'ignore',windowsHide:false});
  child.on('error',()=>{});child.unref();
  return 'Rond de aanmelding af in het geopende venster. Klik daarna op Verbinding controleren.';
}
