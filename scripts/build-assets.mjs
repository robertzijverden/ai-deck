import fs from 'node:fs';
import vm from 'node:vm';
import { Resvg } from '@resvg/resvg-js';
const root='com.keypilotlabs.ai-deck.sdPlugin';
const scope={};vm.runInNewContext(fs.readFileSync(`${root}/ui/model.js`,'utf8'),scope);const {render}=scope.AiDeck;
const png=(svg,size)=>new Resvg(svg,{fitTo:{mode:'width',value:size}}).render().asPng();
const badge='<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144"><g fill="none" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><rect x="21" y="21" width="102" height="102" rx="24"/><path d="M46 92L72 46L98 92M57 75H87"/></g></svg>';
for(const [name,size] of [['category',28],['action',20],['plugin',256]])for(const scale of [1,2])fs.writeFileSync(`${root}/imgs/${name}${scale===2?'@2x':''}.png`,png(badge,size*scale));
for(const action of ['usage','open','close','toggle','newchat','prompt','dashboard'])for(const scale of [1,2])fs.writeFileSync(`${root}/imgs/${action}${scale===2?'@2x':''}.png`,png(render({label:'AI Deck'},action,action==='usage'?{session:null,weekly:null,status:'disabled'}:undefined),72*scale));
const manifest=JSON.parse(fs.readFileSync(`${root}/manifest.json`));for(const a of manifest.Actions){a.Icon='imgs/action';a.UserTitleEnabled=false;a.SupportURL='https://github.com/robertzijverden/ai-deck/issues';if(a.UUID.endsWith('.toggle'))a.SupportedInKeyLogicActions=false;}fs.writeFileSync(`${root}/manifest.json`,JSON.stringify(manifest,null,2));
fs.mkdirSync('docs',{recursive:true});
let grid='';const demo={session:57,weekly:18};const variants=[...['bars','bar','ring','percent'].map(layout=>({mode:'usage',s:{layout,service:'claude'}})),...['claude','chatgpt','codex','gemini','grok','microsoft','github'].map(service=>({mode:'open',s:{service}})),{mode:'usage',s:{service:'gemini',layout:'ring',theme:'brand'}}];
for(let i=0;i<variants.length;i++){const v=variants[i];const x=40+(i%4)*174,y=115+Math.floor(i/4)*174;grid+=`<g transform="translate(${x} ${y})"><rect x="-3" y="-3" width="150" height="150" rx="20" fill="#454545"/>${render(v.s,v.mode,demo)}</g>`;}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="756" height="680"><rect width="100%" height="100%" fill="#202022"/><text x="40" y="48" font-family="Arial" font-size="28" font-weight="bold" fill="white">AI Deck · KeyPilot Labs</text><text x="40" y="80" font-family="Arial" font-size="16" fill="#bcbcbc">Stijlvoorbeelden · geen live verbruiksgegevens</text>${grid}</svg>`;
fs.writeFileSync('docs/preview.png',png(svg,1000));
