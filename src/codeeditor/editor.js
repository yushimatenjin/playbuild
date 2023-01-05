import { isPkgJson, diff2Op, findAsset  } from '../utils'
import { watchPkgJson, getPkgJson, createPackageJson } from '../utils/package'
import PackageManagerSettings from '../components/package-manager'
import initializeBundler from '../codeeditor/bundler'
import * as DiffMatchPatch from 'diff-match-patch-js-browser-and-nodejs/diff_match_patch.js';

window.addEventListener('message', async ({ data }) => {
    switch(data?.message){
        case 'pcpm:build' :
            editor.call('status:log', `Compiling scripts...`)
            break
        case 'pcpm:build:done' :
            editor.call('status:log', `✔️ Code compiled`)
            break
        case 'pcpm:build:error' :
            const error = data.data[0]
            editor.call('status:error', `❌ Error ${error.text} @ ${error.location?.file}:${error.location?.line}:${error.location?.column}`)
            break
        case 'pcpm:enabled' :
  
            const enabled = data.data
            editor.call('status:log', `PCPM is ${enabled ? 'enabled' : 'disabled'}`)
    
            break
        default: break
    }
})


class PackageJsonDriver {

    constructor(){
        this.dmp = new DiffMatchPatch.diff_match_patch()
        this.panel = new PackageManagerSettings()
        this.panel.on('add', p => this.addPackage(p))
        this.panel.on('remove', p => this.removePackage(p))
        editor.call('layout.left').append(this.panel)

        window.postMessage({message: "pcpm:enabled", data: true })
    }

    update(deps){
        this.panel.updatePackages(deps)
    }

    async addPackage(newPackage) {
        
        const pkg = await getPkgJson()
        
        pkg.once('op', _ => {
            editor.call('realtime:send', 'doc:save:', parseInt(pkg.id, 10));
        })
        
        const data = JSON.parse(pkg.data)
        const diff = this.dmp.diff_main(
            pkg.data, 
            JSON.stringify({ 
                ...data,
                dependencies:{
                    ...data.dependencies,
                    ...newPackage 
                }
            }, null, 4)
            )
        const op = diff2Op(diff)  

        pkg.submitOp(op)
        pkg.emit('op', op, false)
    }

    async removePackage(removedPackageName) {
        const pkg = await getPkgJson()
        
        pkg.once('op', _ => {
            editor.call('realtime:send', 'doc:save:', parseInt(pkg.id, 10))
        })

        const data = JSON.parse(pkg.data)
        if(!data.dependencies[removedPackageName]) return
        delete data.dependencies[removedPackageName]

        const diff = this.dmp.diff_main(pkg.data, JSON.stringify(data, null, 4))
        const op = diff2Op(diff)
        pkg.submitOp(op)

        // packageAsset.sync.emit('sync', op);
        pkg.emit('op', op, false)
    }

    destroy(){
        this.dmp = null
        editor.call('layout.left').remove(this.panel)
        this.panel.destroy()

        window.postMessage({message: "pcpm:enabled", data: false })
    }
}

// Initialize the compiler if a package.json is present on load
editor.once('assets:load', _ => {

    let driver, bundler

    watchPkgJson(async pkg => {

        if(!!pkg) {

            if(!driver && !bundler) {
                driver = new PackageJsonDriver()
                bundler = initializeBundler()
                // window.postMessage({message: "pcpm:enabled", data: true })
            }
            console.log(bundler)
            driver.update(pkg?.dependencies)
            bundler.updateDeps(pkg?.dependencies, true)
            
        } else if (driver && bundler) {

            initialize = false
            driver.destroy()
            bundler.destroy()
            driver = null
            bundler = null
        }
    })
})
