import { resolve } from 'path-browserify'
import { resolveModule } from '../resolve'

export default function cachePlugin (files) {

    let vfs = files
    const updateFiles = newFiles => (vfs = newFiles)
   
    return {
        updateFiles,
        plugin: {
            name: 'cache',
            setup(build) {

                build.onResolve({ filter: /.*/ }, async ({ path, resolveDir }) => {
                    
                    const absPath = resolve(resolveDir, path)
                    // console.log('absPath', absPath)
                    const resolvedPath = resolveModule(absPath, vfs)
                    if(resolvedPath === undefined){
                        return { errors: [new Error(`Module '${resolve(resolveDir, path)}' not found.`)]}
                    }
                    return {
                        path: resolvedPath
                    }
                })
            
                build.onLoad({ filter: /.*/ }, async (args) => {
                    return {
                        contents: vfs[args.path],
                        loader: 'js',
                    }
                })
        
            }
        }
    }
}