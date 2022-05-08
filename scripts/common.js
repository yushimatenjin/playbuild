import copyStaticFiles from 'esbuild-copy-static-files'

export default {
    entryPoints: ['./src/contentscripts', './src/serviceworkers', './src/ipcpm', './src/editor', './src/error-handler' ],
    outdir: 'build',
    bundle: true
}

export const plugins = [copyStaticFiles({
    src: './static',
    dest: './build'
})]