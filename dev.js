import * as esbuild from "esbuild"
import { WebSocketServer } from 'ws';
 
const wss = new WebSocketServer({ port: 8080 })
let ws
wss.on('connection', localWs => {
    console.log('Websocket running')
    ws = localWs
})

esbuild.build({
    entryPoints: ['./src/contentscripts', './src/serviceworkers', './src/ipcpm', './src/editor', './src/error-handler' ],
    outdir: 'build',
    bundle: true,
    external: ['path', 'fs', 'os'],
watch: {
    onRebuild(error, result) {
        if (error) console.error('watch build failed:', error)
        else {
            console.log('watch build succeeded:')
            // ws && ws.send('rebuild')
        }
    },
},
}).then(result => {
    console.log('watching...')
    ws && ws.send('Hello! Message From Server!!')
})
