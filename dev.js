import * as esbuild from "esbuild"
import { WebSocketServer } from 'ws';
import common from './common.js'
 
const wss = new WebSocketServer({ port: 8080 })
let ws
wss.on('connection', localWs => {
    console.log('Websocket running')
    ws = localWs
})

esbuild.build({
    ...common,
    watch: {
        onRebuild(error, result) {
            if (error) console.error('watch build failed:', error)
            else {
                console.log('watch build succeeded:')
                // ws && ws.send('rebuild')
            }
        },
    }
}).then(result => {
    console.log('watching...')
    ws && ws.send('Hello! Message From Server!!')
})

