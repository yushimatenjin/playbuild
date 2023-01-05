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

                    if (['fs', 'path'].includes(path)) {
                        return { external: true }    
                    }

                    const resolvedPath = resolveModule(absPath, vfs)
                    if(resolvedPath === undefined){
                        return { 
                            errors: [{ text: `Module '${resolve(resolveDir, path)}' not found.` }]
                        }
                    }

                    return {
                        path: resolvedPath
                    }
                })
            
                build.onLoad({ filter: /.*/ }, async (args) => {
                    return {
                        contents: vfs[args.path],
                        loader: 'jsx',
                    }
                })
            }
        }
    }
}