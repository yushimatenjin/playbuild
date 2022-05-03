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
    
    
    console.log('compile scripts', files)
    // console.log(files, chrome.runtime.getURL('./esbuild.wasm'))
    !esBuildInitialised && await esbuild.initialize({
        worker: false,
        wasmURL: chrome.runtime.getURL('./esbuild.wasm')
    })
    
    esBuildInitialised = true
    // esbuild.transform(code, options).then(result => { ... })
    // esbuild.build(options).then(result => { ... })
    // const index = await esbuild.transform(constructIndex(files))
    // console.log('index', index)

    const plugin = cachePlugin({
        '/index.js' : constructIndex(files),
        ...files
    })

    const { outputFiles, errors } = await esbuild.build({
        entryPoints: ['/index.js'],
        plugins: [plugin],
        bundle: true,
        write: false
    })

    // console.log(outputFiles[0].text)
    const source = outputFiles[0].text
    console.log('errors', errors)
    if(!errors.length) window.postMessage({ message: 'onCompiled', data: source })
    else window.postMessage({ message: 'onError', data: errors })

}

window.onmessage = ({ data }) => {
    // console.log(message)
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