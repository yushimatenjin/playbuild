import * as esbuild from 'esbuild-wasm'
import cachePlugin from './cache-plugin'

const withIndex = files => {
    const imports = Object.keys(files ?? []).map(path =>{
        return `import "${path}";`
    })

    return {
        '/index.js': imports.join(''),
        ...files
    }
}

let esBuildInitialised = false
let incrementalBuild
const build = async files => {

    if(!esBuildInitialised){
        await esbuild.initialize({
            worker: false,
            wasmURL: chrome.runtime.getURL('./esbuild.wasm')
        })
        esBuildInitialised = true
    }

    const { plugin, updateFiles } = cachePlugin(withIndex(files))

    updateFileCache = files => updateFiles(withIndex(files))

    console.time('Full Build')
    const { outputFiles, errors, rebuild } = await esbuild.build({
        entryPoints: ['/index.js'],
        plugins: [plugin],
        bundle: true,
        platform: 'browser',
        sourcemap: 'inline',
        // resolveExtensions: ['.ts', '.js'],
        write: false,
        incremental: true
    })
    console.timeEnd('Full Build')

    incrementalBuild = rebuild

    if(!errors.length) window.postMessage({ message: 'onCompiled', data: outputFiles[0].text })
    else window.postMessage({ message: 'onError', data: errors })
    
}

// Performs an incremental build
const rebuild = async files => {
    if(!incrementalBuild) build(files)
    else{
        updateFileCache(files)
        console.time('Incremental Build')
        const { outputFiles, errors } = await incrementalBuild()
        console.timeEnd('Incremental Build')

        if(!errors.length) window.postMessage({ message: 'onCompiled', data: outputFiles[0].text })
        else window.postMessage({ message: 'onError', data: errors })
    }
}

window.onmessage = ({ data }) => {
    switch(data?.message){
        case 'pcpm:build' :
            rebuild(data.data)
            break
        // case 'pcpm:rebuild' :
        //     rebuild(data.data)
        //     break
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