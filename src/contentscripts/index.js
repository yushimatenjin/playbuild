import * as esbuild from 'esbuild-wasm'
import cachePlugin from './cache-plugin'

const constructIndex = files => {
    const imports = Object.keys(files ?? []).map(path =>{
        return `import "${path}";`
    })
    return imports.join('');
}

let esBuildInitialised = false
const compileScripts = async files => {
    
    !esBuildInitialised && await esbuild.initialize({
        worker: false,
        wasmURL: chrome.runtime.getURL('./esbuild.wasm')
    })
    
    esBuildInitialised = true

    const plugin = cachePlugin({
        '/index.js' : constructIndex(files),
        ...files
    })

    console.time('build')
    const { outputFiles, errors } = await esbuild.build({
        entryPoints: ['/index.js'],
        plugins: [plugin],
        bundle: true,
        resolveExtensions: ['.ts', '.js'],
        write: false
    })
    console.timeEnd('build')

    if(!errors.length) window.postMessage({ message: 'onCompiled', data: outputFiles[0].text })
    else window.postMessage({ message: 'onError', data: errors })

}

window.onmessage = ({ data }) => {
    switch(data?.message){
        case 'compile' :
            const files = data.data
            compileScripts(files)
            break
        default: break
    }
}


// inject script
const isEditor = location.href.includes('/editor/code')
var s = document.createElement('script');
s.src = chrome.runtime.getURL(isEditor ? 'editor.js' : 'ipcpm.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);