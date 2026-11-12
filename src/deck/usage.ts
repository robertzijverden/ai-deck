import { ClaudeProvider } from '../providers/claude/claude-provider.ts';
import { CodexProvider } from '../providers/codex/codex-provider.ts';
import { CopilotProvider } from '../providers/copilot/copilot-provider.ts';
import { UsageCache } from '../cache/ttl-cache.ts';
import type { Provider, UsageProvider } from '../providers/types.ts';
import { service, number, type Settings, type Meter } from './model.ts';
const providers=new Map<string,Provider>();
export async function getMeter(s: Settings, force=false): Promise<Meter> {
  if(s.source==='manual') return {session:number(s.manualPercent,0,0,100),weekly:number(s.manualWeekly,0,0,100),manual:true};
  const id=service(s).live;
  if(!id) return {session:null,weekly:null,status:'unsupported'};
  if(!s.enabled) return {session:null,weekly:null,status:'disabled'};
  let provider=providers.get(id);
  if(!provider) {
    // Account is the current official CLI login. Theme, thresholds and timers never split the cache.
    const options={cache:new UsageCache({provider:id as UsageProvider,ttlMs:300000,forceMinIntervalMs:60000})};
    provider=id==='claude'?new ClaudeProvider(options):id==='codex'?new CodexProvider(options):new CopilotProvider(options);
    providers.set(id,provider);
  }
  const snapshot=await provider.getUsage({force});
  return {session:snapshot.session.usedPercent,weekly:snapshot.weekly.usedPercent,reset:snapshot.session.resetAt,weeklyReset:snapshot.weekly.resetAt,status:snapshot.status,stale:snapshot.stale};
}
