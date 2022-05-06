import * as esbuild from "esbuild"
import common, { plugins } from './common.js'
import manifestPlugin from './manifest-plugin.js'

esbuild.build({
    ...common,
    plugins: [...plugins, manifestPlugin(false)],
    // minify: true,
    // mangleProps: /_$/,
}).then(result => {
    console.log('Build Successful...')
})

