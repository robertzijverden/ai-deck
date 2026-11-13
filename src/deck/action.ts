import streamDeck, { action, SingletonAction } from '@elgato/streamdeck';
import type { KeyAction, WillAppearEvent, WillDisappearEvent, DidReceiveSettingsEvent, KeyDownEvent, KeyUpEvent, SendToPluginEvent } from '@elgato/streamdeck';
import { render, service, serviceId, number, statusText, type Settings, type Meter } from './model.ts';
import { openApp, closeApp, copyPrompt, login } from './platform.ts';
import { getMeter } from './usage.ts';
type Runtime={key:KeyAction;settings:Settings;meter?:Meter;timer?:ReturnType<typeof setInterval>;down?:number;generation:number;active:boolean};
export class DeckAction extends SingletonAction<Settings> {
  protected mode='open';
  private instances=new Map<string,Runtime>();
  private runtime(key:KeyAction,s:Settings) {
    let r=this.instances.get(key.id);
    if(!r){r={key,settings:s,generation:0,active:true};this.instances.set(key.id,r);}else {r.key=key;r.settings=s;r.generation++;}
    return r;
  }
  override async onWillAppear(ev:WillAppearEvent<Settings>) { if(!ev.action.isKey())return; const r=this.runtime(ev.action,ev.payload.settings); await this.draw(r); if(this.mode==='usage') this.poll(r); }
  override onWillDisappear(ev:WillDisappearEvent<Settings>) {const r=this.instances.get(ev.action.id);if(r){r.active=false;clearInterval(r.timer);this.instances.delete(ev.action.id);}}
  override async onDidReceiveSettings(ev:DidReceiveSettingsEvent<Settings>) {if(!ev.action.isKey())return; const old=this.instances.get(ev.action.id); if(old && (old.settings.service!==ev.payload.settings.service || old.settings.chatgptMode!==ev.payload.settings.chatgptMode || old.settings.source!==ev.payload.settings.source)) old.meter=undefined;const r=this.runtime(ev.action,ev.payload.settings);await this.draw(r);if(this.mode==='usage')this.poll(r);}
  private poll(r:Runtime){clearInterval(r.timer);void this.refresh(r);r.timer=setInterval(()=>void this.refresh(r),300000);}
  private async draw(r:Runtime) {if(!r.active)return;await r.key.setTitle('');await r.key.setImage(`data:image/svg+xml;base64,${Buffer.from(render(r.settings,this.mode,r.meter)).toString('base64')}`);}
  private async refresh(r:Runtime,force=false){const generation=r.generation;try{const meter=await getMeter(r.settings,force);if(r.active && r.generation===generation){r.meter=meter;await this.draw(r);}}catch{if(r.active && r.generation===generation){r.meter={session:null,weekly:null,status:'error'};await this.draw(r);}}}
  override async onKeyDown(ev:KeyDownEvent<Settings>){if(!ev.action.isKey())return;const r=this.runtime(ev.action,ev.payload.settings);if(this.mode==='toggle'){r.down=Date.now();return;}await this.perform(r,this.mode);}
  override async onKeyUp(ev:KeyUpEvent<Settings>){if(this.mode!=='toggle')return;const r=this.instances.get(ev.action.id);if(!r || r.down===undefined)return;const held=Date.now()-r.down>=number(r.settings.holdMs,650,300,3000);r.down=undefined;await this.perform(r,held?'close':'open');}
  private async perform(r:Runtime,mode:string){try{const s=r.settings;const info=service(s);switch(mode){case 'usage': if(!info.live && s.source!=='manual')await streamDeck.system.openUrl(info.usage);else await this.refresh(r,true);break;case 'open':if(!await openApp(s))await streamDeck.system.openUrl(info.url);break;case 'close':await closeApp(s);await r.key.showOk();break;case 'newchat':await streamDeck.system.openUrl(info.chat);break;case 'prompt':await copyPrompt(s);await r.key.showOk();break;case 'dashboard':await streamDeck.system.openUrl(info.usage);break;}}catch(err){await r.key.showAlert();await this.feedback((err instanceof Error?err.message:'Actie mislukt.').slice(0,220));}}
  private async feedback(message:string){await streamDeck.ui.sendToPropertyInspector({message});}
  override async onSendToPlugin(ev:SendToPluginEvent<string | number | boolean | null | { [key: string]: any },Settings>){
    if(!ev.action.isKey() || !ev.payload || typeof ev.payload!=='object' || Array.isArray(ev.payload))return;
    const s=await ev.action.getSettings();const command=ev.payload.command;
    try{
      if(command==='open'){if(!await openApp(s))await streamDeck.system.openUrl(service(s).url);await this.feedback('App of website geopend. Meld je daar aan.');}
      if(command==='login')await this.feedback(await login(s));
      if(command==='help'){const urls:Record<string,string>={claude:'https://code.claude.com/docs/en/setup',codex:'https://developers.openai.com/codex/cli',copilot:'https://cli.github.com/'};await streamDeck.system.openUrl(urls[service(s).live] ?? service(s).url);}
      if(command==='disconnect'){s.enabled=false;await ev.action.setSettings(s);await this.feedback('Koppeling uitgeschakeld.');const r=this.instances.get(ev.action.id);if(r){r.settings=s;r.meter=await getMeter(s);await this.draw(r);}return;}
      if(command==='check'){if(service(s).live && s.source!=='manual'){s.enabled=true;await ev.action.setSettings(s);}const meter=await getMeter(s,true);await this.feedback(s.source==='manual'?'Handmatige waarden actief. Kies Automatisch om verbruik te koppelen.':!service(s).live?'Automatisch verbruik is voor deze dienst nog niet beschikbaar.':!s.enabled?'Schakel Verbruik koppelen in om de verbinding te controleren.':meter.session!==null || meter.weekly!==null?meter.stale?'Eerdere gegevens beschikbaar; verversen wacht nog.':'Gekoppeld.':meter.status==='auth_required'?await login(s):statusText(meter.status));const r=this.instances.get(ev.action.id);if(r){r.settings=s;r.meter=meter;await this.draw(r);}}
    }catch{await this.feedback('Dit lukte niet. Controleer je app en aanmelding.');}
  }
}
@action({UUID:'com.keypilotlabs.ai-deck.usage'}) export class Usage extends DeckAction {protected override mode='usage';}
@action({UUID:'com.keypilotlabs.ai-deck.open'}) export class Open extends DeckAction {}
@action({UUID:'com.keypilotlabs.ai-deck.close'}) export class Close extends DeckAction {protected override mode='close';}
@action({UUID:'com.keypilotlabs.ai-deck.toggle'}) export class Toggle extends DeckAction {protected override mode='toggle';}
@action({UUID:'com.keypilotlabs.ai-deck.newchat'}) export class NewChat extends DeckAction {protected override mode='newchat';}
@action({UUID:'com.keypilotlabs.ai-deck.prompt'}) export class Prompt extends DeckAction {protected override mode='prompt';}
@action({UUID:'com.keypilotlabs.ai-deck.dashboard'}) export class Dashboard extends DeckAction {protected override mode='dashboard';}
