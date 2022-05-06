export default {
    entryPoints: ['./src/contentscripts', './src/serviceworkers', './src/ipcpm', './src/editor', './src/error-handler' ],
    outdir: 'build',
    bundle: true
}