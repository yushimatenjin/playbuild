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

    const { plugin : filePlugin, updateFiles } = cachePlugin(withIndex(files))
    const { plugin : unpkgPlugin, updatePackages } = unpkgPathPlugin(deps)
    
    updateFileCache = files => updateFiles(withIndex(files))
    updateModules = updatePackages  
    
    try {
        console.time('Full Build')
        const { outputFiles, errors, rebuild } = await esbuild.build({
                entryPoints: ['/index.js'],
                plugins: [unpkgPlugin, filePlugin],
                bundle: true,
                platform: 'browser',
                external: ['fs', 'path'],
                loader: { '.js': 'tsx' },
                target: ['es6'],
                // logLevel: 'silent',
                // sourcemap: 'inline',
                // sourceRoot: 'https://launch.playcanvas.com/api/assets/files/',
                write: false,
                incremental: true,
                banner: {
                    js: `/* Bundled by PCPM */`,
                },
            })
        console.timeEnd('Full Build')
        incrementalBuild = rebuild
    
        if(!errors.length) window.postMessage({ message: 'pcpm:build:done', data: outputFiles[0].text })

    } catch(e) {
        console.timeEnd('Full Build')
        window.postMessage({ message: 'pcpm:build:error', data: e.errors })
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
        }

    } catch(e) {
        console.timeEnd('Incremental Build')
        window.postMessage({ message: 'pcpm:build:error', data: e.errors })
    }
}

let enabled = false

// From the page/window
window.addEventListener('message', ({ data }) => {
    switch(data?.message){
        case 'pcpm:enabled' :
            enabled = data.data
            break;
        case 'pcpm:build' :
            if(!enabled) return
            rebuild(data.data)
        // case 'pcpm:build:done' :
        // case 'pcpm:build:error' :
        // case 'pcpm:editor-loaded' :
            // chrome.runtime.sendMessage(data)
            break
        default: break
    }
})


// inject script
const isCodeEditor = location.href.includes('/editor/code')

// Apply CSS
if (isCodeEditor) {
    var css = document.createElement('link');
    css.type = 'text/css';
    css.rel = 'stylesheet';
    css.href = chrome.runtime.getURL('./codeeditor/editor.css');
    (document.head || document.documentElement).appendChild(css);
}

const s = document.createElement('script');
s.src = chrome.runtime.getURL(isCodeEditor ? './codeeditor/editor.js' : 'ipcpm.js');
s.onload = function() { this.remove() };
(document.head || document.documentElement).appendChild(s);