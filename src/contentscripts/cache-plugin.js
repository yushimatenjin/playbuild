var path = require('path-browserify')

export default function cachePlugin (files) {
   
    return {
        name: 'cache',
        setup(build) {

            build.onResolve({ filter: /.*/ }, async ({ path, resolveDir }) => {
                // console.log('resolve', path.resolve(args.resolveDir, args.path ))
                const result = await build.resolve(path, { resolveDir })
                console.log(result)
                return {
                    path: path.resolve(resolveDir, path )
                }
            })
        
            build.onLoad({ filter: /.*/ }, async (args) => {
                // console.log("CACHE", args.path, !!files[args.path])
                return {
                    contents: files[args.path],
                    loader: 'js',
                }
            })
    
        }
    }
  }