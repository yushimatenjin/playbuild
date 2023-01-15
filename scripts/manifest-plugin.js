import { promises as fs } from 'fs'

export default debug => ({
    name: 'manifest-plugin',
    setup(build) {

        // build.onResolve({ filter:  /manifest.json$/ }, args => ({
        //     path: args.path,
        //     namespace: 'manifest-ns',
        // }))
    
        // build.onLoad({ filter: /manifest.json$/, namespace: 'manifest-ns' }, async ({ path }) => {
        //     const source = await fs.readFile(path, "utf8");
        //     const manifest = JSON.parse(source)
        //     manifest.permissions = [] // set the array to emppty for production
        //     console.log(manifest)
            
        //     const contents = JSON.stringify(manifest)
        //     return { 
        //         contents,
        //         loader: 'json'
        //     }
        // })

        build.onEnd(async result => {

            const source = await fs.readFile( './src/manifest.json', "utf8");
            const pkgJson = await fs.readFile( './package.json', "utf8");

            const { version } = JSON.parse(pkgJson)
            const manifest = JSON.parse(source)
            manifest.version = version

            if(!debug) {
                delete manifest.permissions // set the array to emppty for production
            }

            const content = JSON.stringify(manifest)

            await fs.writeFile('./build/manifest.json', content, {encoding:'utf8',flag:'w'})
        })
    }
})