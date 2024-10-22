import * as esbuild from 'esbuild-wasm'
import { equals } from '../utils/utils'
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

const allowedOpts = new Set(['define', 'drop', 'ignoreAnnotations', 'inject', 'keepNames', 'mangleProps', 'minify', 'pure', 'treeShaking'])
const sanitizeCompilerOpts = opts => {
  const sanitized = {}
  Object.keys(opts).forEach(key => !!allowedOpts.has(key) && (sanitized[key] = opts[key]))
  return sanitized
}

let esBuildInitialised = false
let incrementalBuild
let updateFileCache, updateModules, options
const build = async (files, deps, opts) => {

  options = opts

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
    const ctx =await esbuild.context({
      ...sanitizeCompilerOpts(options),
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
      // incremental: true,
      banner: {
        js: `/* Made with PlayBuild */`,
      },
    })
    console.time('Full Build')
    const { outputFiles, errors }= await ctx.rebuild()
    console.timeEnd('Full Build')
    incrementalBuild = ctx.rebuild

    if(!errors.length) window.postMessage({ message: 'pcpm:build:done', data: outputFiles[0].text })

  } catch(e) {
    //   console.timeEnd('Full Build')
      window.postMessage({ message: 'pcpm:build:error', data: e.errors })
  }
    
}

// Performs an incremental build
const rebuild = async ({ cache, deps, opts }) => {

  const requiresFullBuild = !equals(options, opts)

  try{

    if(!incrementalBuild || requiresFullBuild) build(cache, deps, opts)
    else{
      updateFileCache(cache)
      updateModules(deps)
      console.time('Build')
      const { outputFiles, errors } = await incrementalBuild()
      console.timeEnd('Build')

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