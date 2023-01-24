import * as esbuild from "esbuild"
import { WebSocketServer } from 'ws';
import common, { plugins } from './common.js'
import manifestPlugin from './manifest-plugin.js'
 
const context = await esbuild.context({
    ...common,
    plugins: [...plugins, manifestPlugin(true)],
    define: { DEBUG: 'true' }
})

await context.watch()
console.log('Watching...')