import { isPkgJson, diff2Op, findAsset  } from '../utils'
import { watchPkgJson, getPkgJson, createPackageJson } from '../utils/package'
import PackageManagerSettings from '../components/package-manager'
import initializeBundler from '../codeeditor/bundler'
import * as DiffMatchPatch from 'diff-match-patch-js-browser-and-nodejs/diff_match_patch.js';

let bundler
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

            // if(enabled && !bundler){
            //     bundler = await initializeBundler()
            // } else if(!enabled && bundler) {
            //     bundler.destroy()
            //     bundler = null
            // }
            // console.log('status:log', `PCPM is ${enabled ? 'enabled' : 'disabled'}`)
            editor.call('status:log', `PCPM is ${enabled ? 'enabled' : 'disabled'}`)
    
            // if(enabled){
            //   editor.on('assets:scripts:add', onScriptAdded)
            // } else {
            //   editor.unbind('assets:scripts:add', onScriptAdded)
            // }
    
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


// const init = async pkg => {

//     if(!pkg) return
    
//     const dmp = new DiffMatchPatch.diff_match_patch()
//     const packagePanel = new PackageManagerSettings()
//     editor.call('layout.left').append(packagePanel)
//     bundler = await initializeBundler()

//     // packagePanel.updatePackages(pkg?.dependencies)
//     // bundler?.updateDeps(pkg?.dependencies, false) // update deps but do not build
    
//     // const getOperationalTransform = (previousState, newState) => {
//     //     const diff = dmp.diff_main(previousState, newState)    
//     //     // dmp.diff_cleanupSemantic(diff);
//     //     return diff2Op(diff)
//     // }

//     // let openedDoc
//     // const onDocClose = id => {
//     //     if(id !== openedDoc?.id) return
//     //     openedDoc = null
//     // }

//     // const onDocLoad =  (doc, asset) => {
//     //     if(!isPkgJson(asset)) return
//     //     openedDoc = doc
//     // }

//     const addPackage = async newPackage => {
        
//         const pkg = await getPkgJson()
        
//         pkg.once('op', _ => {
//             editor.call('realtime:send', 'doc:save:', parseInt(pkg.id, 10));
//         })
        
//         const data = JSON.parse(pkg.data)
//         const op = getOperationalTransform(
//             pkg.data, 
//             JSON.stringify({ 
//                 ...data,
//                 dependencies:{
//                     ...data.dependencies,
//                     ...newPackage 
//                 }
//             }, null, 4)
//             )
            
//         pkg.submitOp(op)
//         pkg.emit('op', op, false)
//     }

//     const removePackage = async removedPackageName => {
//         const pkg = await getPkgJson()
        
//         pkg.once('op', _ => {
//             editor.call('realtime:send', 'doc:save:', parseInt(pkg.id, 10))
//         })

//         const data = JSON.parse(pkg.data)
//         if(!data.dependencies[removedPackageName]) return
//         delete data.dependencies[removedPackageName]

//         const op = getOperationalTransform(pkg.data, JSON.stringify(data, null, 4))
//         pkg.submitOp(op)

//         // packageAsset.sync.emit('sync', op);
//         pkg.emit('op', op, false)
//     }

//     // editor.on('documents:load', onDocLoad)
//     // editor.on('documents:close', onDocClose)

//     packagePanel.on('add', addPackage)
//     packagePanel.on('remove', removePackage)

//     window.postMessage({ message: 'pcpm:editor-loaded', data: window.config.project })
//     window.postMessage({ message: "pcpm:enabled", data: true })

// }

// Initialize the compiler if a package.json is present on load
editor.once('assets:load', _ => {

    // Check if a package.json already exists
    // const pkgJson = findAsset(isPkgJson)
    // if(pkgJson) {
    //     editor.call('assets:contents:get', findAsset(isPkgJson), (err, value) => {
    //         if(err) return
    //         init(JSON.parse(value))
    //     })
    // }

    let driver, bundler

    watchPkgJson(async pkg => {

        const assetExists = !!pkg

        if(assetExists) {

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
