import * as esbuild from "esbuild"
import common, { plugins } from './common.js'
import manifestPlugin from './manifest-plugin.js'
import { zip } from 'zip-a-folder';

esbuild.build({
    ...common,
    plugins: [...plugins, manifestPlugin(false)],
    minify: true,
    mangleProps: /_$/,
    // write: false,
    // out: 'out'
}).then(async result => {
    await zip('./build', './pcpm.zip');
    console.log('Build Successful...')
})

