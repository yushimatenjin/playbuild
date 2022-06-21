import { isPkgJson, diff2Op, findAsset  } from '../utils'
import { watchPkgJson, getPkgJson } from '../utils/package'
import PackageManagerSettings from '../components/package-manager'
import initializeBundler from '../codeeditor/bundler'
import * as DiffMatchPatch from 'diff-match-patch-js-browser-and-nodejs/diff_match_patch.js';


editor.once('realtime:authenticated', _ => {

    let bundler = null
    const dmp = new DiffMatchPatch.diff_match_patch()
    const packagePanel = new PackageManagerSettings(/*findAsset(isPkgJson)*/)
    editor.call('layout.left').append(packagePanel)

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

        findAsset(isPkgJson).sync.emit('sync', op);
        packageDoc.emit('op', op, false)
    })

    packagePanel.on('remove', async removedPackageName => {
        const packageAsset = findAsset(isPkgJson)
        if(!packageAsset) return 

        const packageDoc = await getPkgJson()
        
        packageDoc.once('op', _ => {
            console.log('save')
            editor.call('realtime:send', 'doc:save:', parseInt(packageDoc.id, 10));
        })

        const data = JSON.parse(packageDoc.data)
        if(!data.dependencies[removedPackageName]) return
        delete data.dependencies[removedPackageName]

        const op = getOperationalTransform(packageDoc.data, JSON.stringify(data, null, 4))
        packageDoc.submitOp(op)

        packageAsset.sync.emit('sync', op);
        packageDoc.emit('op', op, false)
    })

    // packagePanel.on('update', async newPkg => {

    //     // if(!packageDoc) return
    //     const packageDoc = await getPkgJson()

    //     // Optimistically render the local packages assuming the operation succeeds

    //     // Save doc on local op
    //     packageDoc.once('op', _ => {
    //         onPackageDocUpdated(packageDoc.data)
    //         editor.call('realtime:send', 'doc:save:', parseInt(pkg.get('id'), 10));
    //     })

    //     const op = diff2Op(diff)
    //     packageDoc.submitOp(op)

    //     // KLUDGE: Submitting an op to shareDB won't updated the local state.
    //     // This hack triggers an internal update. Ideally we can hook into some local api to update
    //     if (openedDoc) {
    //         // pkg.sync.unbind('sync', onPackageDocUpdated)
    //         openedDoc.emit('op', op, false)
    //         // pkg.sync.on('sync', onPackageDocUpdated)
    //     }
    // })

    // Watch for any updates to the package.json
    editor.on('assets:load', _ => {
        watchPkgJson(async pkg => {
            // If the package.json exists update the UI and trigger a rebuild
            if(pkg){

                packagePanel.updatePackages(pkg.dependencies)
                bundler?.updateDeps(pkg.dependencies)
            }
        })
    })

    window.addEventListener('message', async ({ data }) => {
        switch(data?.message){
        case 'pcpm:build' :
            // rebuild(data.data)
            break
        case 'pcpm:enabled' :
    
            const enabled = data.data
    
            if(enabled){
                bundler = await initializeBundler()
            } else {
                bundler.destroy()
                bundler = null
            }
    
            break
        default: break
        }
    })
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