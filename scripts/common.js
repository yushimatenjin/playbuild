import copyStaticFiles from 'esbuild-copy-static-files'

export default {
    entryPoints: ['./src/contentscripts', './src/serviceworkers', './src/ipcpm', './src/codeeditor/editor'],
    outdir: 'build',
    treeShaking: true,
    define: { DEBUG: 'false' },
    bundle: true
}

export const plugins = [copyStaticFiles({
    src: './static',
    dest: './build'
})]