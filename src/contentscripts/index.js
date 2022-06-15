import * as esbuild from 'esbuild-wasm'
import cachePlugin from './cache-plugin'
import unpkgPathPlugin from './unpkg-path-plugin'

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
let updateFileCache, updateModules
const build = async (files, deps) => {

    if(!esBuildInitialised){
        await esbuild.initialize({
            worker: false,
            wasmURL: chrome.runtime.getURL('./compiler.wasm')
        })
        esBuildInitialised = true
    }
    
    try {

        const { plugin : filePlugin, updateFiles } = cachePlugin(withIndex(files))
        const { plugin : unpkgPlugin, updatePackages } = unpkgPathPlugin(deps)

        updateFileCache = files => updateFiles(withIndex(files))
        updateModules = updatePackages  

        console.time('Full Build')
        const { outputFiles, errors, warnings, rebuild } = await esbuild.build({
            entryPoints: ['/index.js'],
            plugins: [unpkgPlugin, filePlugin],
            bundle: true,
            platform: 'browser',
            external: ['fs', 'path'],
            // logLevel: 'silent',
            sourcemap: 'inline',
            sourceRoot: 'https://launch.playcanvas.com/api/assets/files/',
            write: false,
            incremental: true,
            banner: {
                js: `/* Bundled by PCPM */`,
            },
        })
        console.timeEnd('Full Build')
        incrementalBuild = rebuild

        if(!errors.length) window.postMessage({ message: 'onCompiled', data: outputFiles[0].text })
        else window.postMessage({ message: 'onError', data: errors })

    } catch(e) {
        console.timeEnd('Full Build')
        // console.warn(e)
    }
    
}

// Performs an incremental build
const rebuild = async ({ cache, deps }) => {

    try{

        if(!incrementalBuild) build(cache, deps)
        else{
            updateFileCache(cache)
            updateModules(deps)
            console.time('Incremental Build')
            const { outputFiles, errors } = await incrementalBuild()
            console.timeEnd('Incremental Build')

            if(!errors.length) window.postMessage({ message: 'pcpm:build:done', data: outputFiles[0].text })
            else window.postMessage({ message: 'onError', data: errors })
        }

    } catch(e) {
        console.timeEnd('Incremental Build')
        // console.warn(e)
    }
}

window.onmessage = ({ data }) => {
    switch(data?.message){
        case 'pcpm:build' :
            rebuild(data.data)
            chrome.runtime.sendMessage(data)
            break
        case 'pcpm:build:done' :
        case 'pcpm:editor-loaded' :
            chrome.runtime.sendMessage(data)
            break
        default: break
    }
}

chrome.runtime.onMessage.addListener(({ message, data }) => {
    if (message === "pcpm:enabled") {
        window.postMessage({ message, data })
    }
})


// inject script
const isCodeEditor = location.href.includes('/editor/code')
// const isLauncher = !isEditor && location.href.includes('://launch.playcanvas.com/')
var s = document.createElement('script');
s.src = chrome.runtime.getURL(isCodeEditor ? './codeeditor/editor.js' : 'ipcpm.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);