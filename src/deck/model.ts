import { logos } from './logos.ts';
export const SERVICES = {
  claude: { name: 'Claude', short: 'CL', color: '#d97757', url: 'https://claude.ai', chat: 'https://claude.ai/new', usage: 'https://claude.ai/settings/usage', process: 'Claude', live: 'claude' },
  chatgpt: { name: 'ChatGPT', short: 'GPT', color: '#10a37f', url: 'https://chatgpt.com', chat: 'https://chatgpt.com/', usage: 'https://chatgpt.com', process: 'ChatGPT', live: '' },
  codex: { name: 'Codex', short: 'CX', color: '#ffffff', url: 'https://chatgpt.com/codex', chat: 'https://chatgpt.com/codex', usage: 'https://chatgpt.com/codex/settings/usage', process: 'Codex', live: 'codex' },
  gemini: { name: 'Gemini', short: 'GE', color: '#8e75ff', url: 'https://gemini.google.com', chat: 'https://gemini.google.com/app', usage: 'https://gemini.google.com', process: '', live: '' },
  grok: { name: 'Grok', short: 'GR', color: '#ffffff', url: 'https://grok.com', chat: 'https://grok.com', usage: 'https://grok.com', process: '', live: '' },
  microsoft: { name: 'Microsoft Copilot', short: 'MC', color: '#69baff', url: 'https://copilot.microsoft.com', chat: 'https://copilot.microsoft.com', usage: 'https://copilot.microsoft.com', process: 'Copilot', live: '' },
  github: { name: 'GitHub Copilot', short: 'GH', color: '#c5a3ff', url: 'https://github.com/copilot', chat: 'https://github.com/copilot', usage: 'https://github.com/settings/copilot', process: '', live: 'copilot' },
} as const;
export type ServiceId = keyof typeof SERVICES;
export type Settings = {
  service?: string; chatgptMode?: string; theme?: string; background?: string; foreground?: string; track?: string;
  fill?: string; warningColor?: string; criticalColor?: string; thresholdColors?: boolean;
  warning?: number; critical?: number; layout?: string; iconStyle?: string; label?: string;
  showLabel?: boolean; showPercent?: boolean; showActionMark?: boolean; remaining?: boolean; window?: string;
  resetInfo?: boolean; fontSize?: number; source?: string; enabled?: boolean;
  manualPercent?: number; manualWeekly?: number; refreshSeconds?: number;
  appPath?: string; processName?: string; prompt?: string; holdMs?: number; customIcon?: string;
};
export function service(s: Settings) {
  const info=SERVICES[serviceId(s)];
  return serviceId(s)==='chatgpt' && s.chatgptMode==='work'
    ? {...info,name:'ChatGPT Work',live:'codex',usage:SERVICES.codex.usage} : info;
}
export function serviceId(s: Settings): ServiceId { return s.service && s.service in SERVICES ? s.service as ServiceId : 'claude'; }
export function number(v: unknown, fallback: number, min: number, max: number) {
  return typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;
}
export function color(v: unknown, fallback: string) { return typeof v === 'string' && /^#[\da-f]{6}$/i.test(v) ? v : fallback; }
export function palette(s: Settings) {
  const brand = s.theme === 'brand'; const light = s.theme === 'light';
  return { background: color(s.background, light ? '#ffffff' : '#000000'), foreground: color(s.foreground, light ? '#000000' : '#ffffff'),
    track: color(s.track, light ? '#cccccc' : '#303030'), fill: color(s.fill, brand ? service(s).color : light ? '#000000' : '#ffffff'),
    warning: color(s.warningColor, '#ffcc00'), critical: color(s.criticalColor, '#ff5544') };
}
export function escape(s: unknown) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!)); }
export type Meter = { session: number | null; weekly: number | null; reset?: string | null; weeklyReset?: string | null; status?: string; stale?: boolean; manual?: boolean };
export function statusText(status?: string) {
  return ({auth_required:'Aanmelden',rate_limited:'Even wachten',error:'Geen verbinding',disabled:'Koppelen',unsupported:'Niet beschikbaar',loading:'Laden…',ok:'Geen gegevens'} as Record<string,string>)[status ?? ''] ?? status ?? '';
}
/** Existing brand artwork; colors are changed only for the user's monochrome theme. */
export function glyph(id: ServiceId, ink: string, variant='mono') {
 const artwork=logos[id][variant==='brand'?'color':variant==='wordmark'?'wordmark':'mono'];
 // Stream Deck's SVG renderer does not reliably display nested SVG viewports.
 // Preserve the source paths and presentation attributes in a scaled group.
 const root = artwork.match(/<svg([^>]*)>/)!;
 const box = root[1].match(/viewBox="([^"]+)"/)![1].split(/\s+/).map(Number);
 const scale = 96 / Math.max(box[2], box[3]);
 const x = 24 + (96 - box[2] * scale) / 2;
 const y = 24 + (96 - box[3] * scale) / 2;
 const attrs = root[1].replace(/\s(?:width|height|viewBox|xmlns|style)="[^"]*"/g, '');
 return `<g transform="translate(${x} ${y}) scale(${scale}) translate(${-box[0]} ${-box[1]})"${attrs}>${artwork.slice(root[0].length).replace(/<\/svg>\s*$/, '')}</g>`.replaceAll('currentColor',ink);
}
export function render(s: Settings, action: string, meter?: Meter): string {
  const p = palette(s); const id = serviceId(s); const info = service(s);
  const text = (x:number,y:number,value:unknown,size=18,anchor='middle',ink=p.foreground)=>`<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial,sans-serif" font-weight="700" font-size="${size}" fill="${ink}">${escape(value)}</text>`;
  let body = `<rect width="144" height="144" fill="${p.background}"/>`;
  const label = (s.label || info.name).slice(0,20);
  if (action !== 'usage') {
    const style = s.iconStyle ?? 'symbol'; const ink = style === 'brand' ? info.color : p.foreground;
    if (style === 'custom' && s.customIcon && s.customIcon.length < 200000 && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(s.customIcon)) body += `<image x="16" y="8" width="112" height="104" href="${s.customIcon}"/>`;
    else if (style === 'initials' || style === 'text') body += text(72,80,style === 'initials' ? info.short : label,style === 'initials' ? 42 : 19);
    else body += `<g transform="translate(14 4) scale(.80)">${glyph(id,ink,style)}</g>`;
    if (style === 'badge') body += `<rect x="8" y="8" width="128" height="128" rx="24" fill="none" stroke="${p.fill}" stroke-width="3"/>`;
    if (s.showLabel !== false && style !== 'text') body += text(72,124,label,label.length>13?12:16);
    const marks: Record<string,string> = {open:'↗',close:'×',toggle:'↕',newchat:'+',prompt:'≡',dashboard:'◷'};
    if (s.showActionMark === true) body += text(129,21,marks[action] ?? '',18);
  } else if (!meter || (meter.status && meter.session === null && meter.weekly === null)) {
    body += text(72,52,label,17) + text(72,85,statusText(meter?.status ?? 'loading'),16);
    if (meter?.status === 'unsupported') body += text(72,110,'Open dienst ↗',12);
  } else {
    const layout = s.layout ?? 'bars'; const weekly = s.window === 'weekly' && id !== 'github';
    const raw = weekly ? meter.weekly : meter.session;
    const val = (n:number|null) => n === null ? null : Math.round(s.remaining ? 100-n : n);
    const paint = (n:number|null) => s.thresholdColors && n !== null ? n >= number(s.critical,90,0,100) ? p.critical : n >= number(s.warning,70,0,100) ? p.warning : p.fill : p.fill;
    const bar = (y:number,n:number|null,title:string)=> {
      const value = val(n); const ink=paint(n);
      return text(12,y,title,17,'start')+(s.showPercent!==false?text(132,y,value===null?'—':`${value}%`,21,'end'): '')+`<rect x="12" y="${y+9}" width="120" height="12" rx="5" fill="${p.track}"/>`+(value!==null?`<rect x="12" y="${y+9}" width="${120*value/100}" height="12" rx="5" fill="${ink}"/>`:'');
    };
    if (s.showLabel !== false) body+=text(72,20,label,14);
    if (layout === 'bars') body += id==='github' ? bar(74,meter.session,'Maand') : bar(49,meter.session,'5H')+bar(103,meter.weekly,'Week');
    else if (layout === 'bar') body += bar(74,raw,weekly?'Week':id==='github'?'Maand':'5H');
    else {
      const value=val(raw), ink=paint(raw);
      if(layout==='ring') body+=`<circle cx="72" cy="76" r="40" fill="none" stroke="${p.track}" stroke-width="10"/>`+(value!==null?`<circle cx="72" cy="76" r="40" fill="none" stroke="${ink}" stroke-width="10" stroke-dasharray="${251.327*value/100} 251.327" transform="rotate(-90 72 76)"/>`:'');
      const percentage=value===null?'—':`${value}%`;
      // Leave space inside the ring even for 100% and older oversized settings.
      const size=layout==='ring'?Math.min(number(s.fontSize,24,18,32),percentage.length>3?24:30):number(s.fontSize,32,18,48);
      body+=text(72,layout==='ring'?76+size*0.35:86,percentage,size,'middle',ink);
      if(layout==='percent') body+=text(72,109,weekly?'Week':id==='github'?'Maand':'5 uur',16);
    }
    const reset = weekly ? meter.weeklyReset : meter.reset;
    const minutes = reset ? Math.max(0,Math.ceil((Date.parse(reset)-Date.now())/60000)) : NaN;
    let footer = meter.manual ? 'HANDMATIG' : meter.stale ? 'VEROUDERD' : s.remaining ? 'RESTEREND' : '';
    if(s.resetInfo && Number.isFinite(minutes) && layout!=='bars') footer=`Reset ${Math.floor(minutes/60)}u ${minutes%60}m`;
    if(footer) body+=text(72,139,footer,9);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">${body}</svg>`;
}
