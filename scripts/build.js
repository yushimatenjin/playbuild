import * as esbuild from "esbuild"
import common from './common.js'


esbuild.build({
    ...common,
    minify: true,
    mangleProps: /_$/,
}).then(result => {
    console.log('Build Successful...')
})

