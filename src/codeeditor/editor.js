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

            if(enabled && !bundler){
                bundler = await initializeBundler()
            } else if(!enabled && bundler) {
                bundler.destroy()
                bundler = null
            }
            console.log('status:log', `PCPM is ${enabled ? 'enabled' : 'disabled'}`)
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

editor.once('assets:load', _ => {

    const init = async pkg => {

        console.log(pkg)

        const dmp = new DiffMatchPatch.diff_match_patch()
        const packagePanel = new PackageManagerSettings()
        editor.call('layout.left').append(packagePanel)

        if(pkg){
            bundler = await initializeBundler()
        }

        packagePanel.updatePackages(pkg?.dependencies)
        bundler?.updateDeps(pkg?.dependencies, false) // update deps but do not build

        let openedDoc
        editor.on('documents:close', id => {
            if(id !== openedDoc?.id) return
            openedDoc = null
        })

        editor.on('documents:load', (doc, asset) => {
            if(!isPkgJson(asset)) return
            openedDoc = doc
        })

        const getOperationalTransform = (previousState, newState) => {
            const diff = dmp.diff_main(previousState, newState);      
            // dmp.diff_cleanupSemantic(diff);
            return diff2Op(diff)
        }

        packagePanel.on('add', async newPackage => {

            const pkg = findAsset(isPkgJson)
            if(!pkg){
                await createPackageJson({ dependencies: { ...newPackage }})
            }

            const packageDoc = await getPkgJson() // find and create a pkg.json if none exist
            packageDoc.once('op', _ => {
                editor.call('realtime:send', 'doc:save:', parseInt(packageDoc.id, 10));
            })

            const data = JSON.parse(packageDoc.data)
            const op = getOperationalTransform(
                packageDoc.data, 
                JSON.stringify({ 
                    ...data,
                    dependencies:{
                        ...data.dependencies,
                        ...newPackage 
                    }
                }, null, 4)
            )

            packageDoc.submitOp(op)

            // findAsset(isPkgJson).sync.emit('sync', op);
            packageDoc.emit('op', op, false)
        })

        packagePanel.on('remove', async removedPackageName => {
            const packageAsset = findAsset(isPkgJson)
            if(!packageAsset) return 

            const packageDoc = await getPkgJson()
            
            packageDoc.once('op', _ => {
                editor.call('realtime:send', 'doc:save:', parseInt(packageDoc.id, 10));
            })

            const data = JSON.parse(packageDoc.data)
            if(!data.dependencies[removedPackageName]) return
            delete data.dependencies[removedPackageName]

            const op = getOperationalTransform(packageDoc.data, JSON.stringify(data, null, 4))
            packageDoc.submitOp(op)

            // packageAsset.sync.emit('sync', op);
            packageDoc.emit('op', op, false)
        })

        // Watch for any updates to the package.json
        watchPkgJson(async pkg => {
            // Don't trigger a rebuild if the package has been deleted
            const shouldRebuild = !!pkg
            packagePanel.updatePackages(pkg?.dependencies)
            bundler?.updateDeps(pkg?.dependencies, shouldRebuild)
        })

        window.postMessage({ message: 'pcpm:editor-loaded', data: window.config.project })
        window.postMessage({message: "pcpm:enabled", data: true })
    }

    
    const pkgJson = findAsset(isPkgJson)
    if(pkgJson) {
        editor.call('assets:contents:get', findAsset(isPkgJson), (err, value) => {
            if(err) return
            init(JSON.parse(value))
        })
    }/* else {
        init()
    }*/
})

// editor.once('load', async progress => {

    // Watch for a pkg.json and any changes
    // let bundler, packagePanel
    
    // watchPkgJson(async pkg => {
    //     // if(!pkg) {
    //     //     if(packagePanel){
    //     //         console.log('Removing Package Manager')
    //     //         bundler.destroy()
    //     //         packagePanel.destroy()
    //     //         packagePanel = null
    //     //     }
    //     // } else  {
    //         if (!packagePanel) {


    //             bundler = await initializeBundler({}, pkg.dependencies)

                
    //             editor.call('layout.left').append(packagePanel)

    //         }
    //         console.log('CHANGE IN PACKAGEKJSON', pkg)
    //         packagePanel.updatePackages(pkg)
    //         bundler.updateDeps(pkg.dependencies)
    //     // }
    // })
// })

    // if(pkgStr){
    //     initialisePackagePanel(JSON.parse(pkgStr.value))
    // }
// })

    /*
        package.json
    */

    // let packageDoc
    // const onPackageDocUpdated = _ => {
    //     if(!packageDoc?.data) return
    //     // installedPkgsCont.clear()
    //     const { dependencies } = JSON.parse(packageDoc.data)
    //     console.log('PACKAGE DEPS UPDATED', dependencies)

    //     // Object.keys(dependencies).forEach(async (name, i) => {
    //     //     // https://unpkg.com/math@0.0.3
    //     //     const code = cache[name] || await fetch(`https://unpkg.com/${name}@${dependencies[name]}`).then(r => r.text())
    //     //     cache[name] = code
    //     // })

    //     // triggerBuild()
    // }

    // editor.on('package:fs:change', doc => {
        
    //     // If we had a previous reference to the package, then unsubscribe to all events
    //     if(packageDoc){
    //         // packageDoc.unbind('op')
    //         packageDoc.unsubscribe()
    //     }
        
    //     // searchInput.hidden = !doc
    //     // installedPkgsCont.hidden = !doc
    //     // noPackageWarn.hidden = !!doc

    //     // subscribe to all new events
    //     // doc?.once("load", onPackageDocUpdated )
    //     doc?.on("op", onPackageDocUpdated )
    //     // doc?.subscribe(_ => console.log(_))
        
    //     packageDoc = doc

    //     onPackageDocUpdated()
    // })

    // /*
    //  *  Called when the file system updates
    //  */
    // let packageUID = null // important this is null on first run
    // const onFileSystemUpdate = _ => {
    
    //     const pkgAsset = findAsset(editor, isPkgJson)
    //     const uid = pkgAsset?.get('uniqueId')

    //     if(packageUID === uid) return

    //     const doc = connection.get('documents', uid.toString());     
    //     doc?.subscribe(err => !err && editor.emit('package:fs:change', doc))

    //     if(!doc) editor.emit('package:fs:change')
    // }
  
    // // // Listen for any changes to the event registry
    // editor.on('assets:add', onFileSystemUpdate)
    // editor.on('assets:remove', onFileSystemUpdate)
    // // // editor.on('move', onFileSystemUpdate)
    // // // editor.on('clear', onFileSystemUpdate)
    // onFileSystemUpdate(null)