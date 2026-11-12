import fs from 'node:fs';
const slugs={claude:'claude',chatgpt:'openai',codex:'codex',gemini:'gemini',grok:'grok',microsoft:'copilot',github:'githubcopilot'};
const logos={};
for(const [id,slug]of Object.entries(slugs)){
 const read=suffix=>fs.readFileSync(`node_modules/@lobehub/icons-static-svg/icons/${slug}${suffix}.svg`,'utf8');
 logos[id]={mono:read(''),color:fs.existsSync(`node_modules/@lobehub/icons-static-svg/icons/${slug}-color.svg`)?read('-color'):read(''),wordmark:read('-text')};
}
fs.writeFileSync('src/deck/logos.ts','// Brand assets from @lobehub/icons-static-svg 1.102.0. MIT; trademarks belong to their owners.\nexport const logos = '+JSON.stringify(logos)+' as const;\n');
let source=fs.readFileSync('src/deck/model.ts','utf8');
const begin=source.indexOf('/** Original geometric symbols;');const end=source.indexOf('export function render(',begin);
if(begin>=0)source=source.slice(0,begin)+`/** Existing brand artwork; colors are changed only for the user's monochrome theme. */
export function glyph(id: ServiceId, ink: string, variant='mono') {
 const artwork=logos[id][variant==='brand'?'color':variant==='wordmark'?'wordmark':'mono'];
 return artwork.replace(/<svg[^>]*>/, tag=>tag.replace(/width="[^"]*"/, 'width="96"').replace(/height="[^"]*"/, 'height="96"').replace('<svg','<svg x="24" y="24"')).replaceAll('currentColor',ink);
}
`+source.slice(end);
if(!source.includes("import { logos }")) source="import { logos } from './logos.ts';\n"+source;
source=source.replace('glyph(id,ink)','glyph(id,ink,style)').replace("body += text(72,124,label,16)","body += text(72,124,label,label.length>13?12:16)");
fs.writeFileSync('src/deck/model.ts',source);
const license=fs.readFileSync('LICENSE','utf8').replace('Copyright © 2026 David Utyuganov','Copyright (c) 2023 LobeHub');
fs.mkdirSync('com.keypilotlabs.ai-deck.sdPlugin/licenses',{recursive:true});fs.writeFileSync('com.keypilotlabs.ai-deck.sdPlugin/licenses/LobeHub-MIT.txt',license);
fs.appendFileSync('com.keypilotlabs.ai-deck.sdPlugin/THIRD-PARTY-NOTICES.txt','Brand SVG artwork: LobeHub lobe-icons, MIT, copyright 2023 LobeHub. Source: https://github.com/lobehub/lobe-icons. Brand names and logos remain the trademarks of their owners; no affiliation is implied.\n');
