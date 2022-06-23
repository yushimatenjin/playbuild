import { sep } from 'path-browserify'

export default unpkgPathPlugin = (p) => {

    const cache = {}

    let packages = p
    const updatePackages = p => (packages = p)
    const filter = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/
    const namespace = 'http-url'

    return {
        updatePackages,
        plugin: {
            name: 'unpkg-path-plugin',
            setup(build) {

                build.onResolve({ filter }, ({ path }) => {
                    const module = path.split(sep)[0]
                    const subpath = path.split(sep).slice(1).join(sep)
                    const version = packages[module]
                    
                    if(!!version){
                        return { 
                            path: `https://esm.sh/${module}@${version}${subpath ? '/' + subpath : ''}`,
                            namespace
                        }
                    } else {
                        return {
                            errors: [{ text: `Could not resolve '${path}'. Did you add it to the Package Manager?`}]
                        }
                    }
                })

                build.onResolve({ filter: /.*/, namespace }, ({ importer, path }) => {
                    return {
                        path: new URL(path, importer).toString(),
                        namespace,
                    }
                })


                build.onLoad({ filter: /.*/, namespace }, async ({ path }) => {
                    
                    const contents = cache[path] || await fetch(path).then(resp => resp.arrayBuffer())
                    cache[path] = contents

                    return {
                        loader: "jsx",
                        contents: new Uint8Array(contents),
                    };
                });
            }
        }
    }
};
  