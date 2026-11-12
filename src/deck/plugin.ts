import streamDeck from '@elgato/streamdeck';
import { Usage, Open, Close, Toggle, NewChat, Prompt, Dashboard } from './action.ts';
streamDeck.logger.setLevel('info');
for(const Action of [Usage,Open,Close,Toggle,NewChat,Prompt,Dashboard]) streamDeck.actions.registerAction(new Action());
streamDeck.connect();
