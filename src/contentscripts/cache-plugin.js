var path = require('path-browserify')

export default function cachePlugin (files) {
   
    return {
        name: 'cache',
        setup(build) {

            build.onResolve({ filter: /.*/ }, args => {
                // console.log('resolve', path.resolve(args.resolveDir, args.path ))
                return {
                    path: path.resolve(args.resolveDir, args.path )
                }
            })
        
            build.onLoad({ filter: /.*/ }, async (args) => {
                // console.log("CACHE", args.path, !!files[args.path])
                return {
                    contents: files[args.path],//JSON.stringify(text.split(/\s+/)),
                    loader: 'js',
                }
            })
    
        }
    }
  }