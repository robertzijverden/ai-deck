import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
const root='com.keypilotlabs.ai-deck.sdPlugin';
export default [
 {input:'src/deck/plugin.ts',output:{file:`${root}/bin/plugin.js`,format:'es'},plugins:[typescript(),resolve({preferBuiltins:true}),commonjs(),{name:'module',generateBundle(){this.emitFile({fileName:'package.json',source:'{"type":"module"}',type:'asset'});}}]},
 {input:'src/deck/model.ts',output:{file:`${root}/ui/model.js`,format:'iife',name:'AiDeck'},plugins:[typescript()]}
];
