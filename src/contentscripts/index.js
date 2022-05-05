import * as esbuild from 'esbuild-wasm'
import cachePlugin from './cache-plugin'

const constructIndex = files => {
    const imports = Object.keys(files ?? []).map(path =>{
        return `import "${path}";`
    })
    return imports.join('');
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

    const plugin = cachePlugin({
        '/index.js' : constructIndex(files),
        ...files
    })

    console.time('build')
    const { outputFiles, errors } = await esbuild.build({
        entryPoints: ['/index.js'],
        plugins: [plugin],
        bundle: true,
        // resolveExtensions: ['.ts', '.js'],
        write: false,
        // incremental: true
    })
    console.timeEnd('build')

    // incrementalBuild = rebuild

    if(!errors.length) window.postMessage({ message: 'onCompiled', data: outputFiles[0].text })
    else window.postMessage({ message: 'onError', data: errors })
    
}

// Performs an incremental build
const rebuild = async files => {
    // if(!incrementalBuild) build(files)
    // else{
    //     console.time('incremental build')
    //     const { outputFiles, errors } = await incrementalBuild()
    //     console.timeEnd('incremental build')
    //     if(!errors.length) window.postMessage({ message: 'onCompiled', data: outputFiles[0].text })
    //     else window.postMessage({ message: 'onError', data: errors })
    // }
}

window.onmessage = ({ data }) => {
    switch(data?.message){
        case 'pcpm:build' :
            build(data.data)
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