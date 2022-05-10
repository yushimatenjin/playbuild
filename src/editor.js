import { isWatchableFile, diff2Op, findAsset, getBuildDir, getBuildFile, isPkgJson, resolvePath, isAmmo } from "./utils"
import * as DiffMatchPatch from 'diff-match-patch-js-browser-and-nodejs/diff_match_patch.js';
import { debounce } from 'debounce'
import path from 'path-browserify'
import { watchFile } from './utils/fs'
import { watchPkgJson } from './utils/package'
import PackageManagerSettings from './components/package-manager'
import initializeBundler from './codeeditor/bundler'

// editor.once('load', async progress => {

    // Watch for a pkg.json and any changes
    let bundler, packagePanel
console.log('wathcing')
    
    watchPkgJson(pkg => {
        if(!pkg) {
            if(packagePanel){
                console.log('Removing Package Manager')
                // bundler.destroy()
                packagePanel.destroy()
                packagePanel = null
            }
        } else  {
            if (!packagePanel) {
                const pkgObs = findAsset(isPkgJson)
                // const data = await watchFile(pkgObs)
                console.log('Adding Package Manager')
                // pkgObs.once('file.filename:set', _ => resolveData(asset));)
                packagePanel = new PackageManagerSettings(pkgObs)
                editor.call('layout.left').append(packagePanel)
                // bundler = initializeBundler()
            }
            packagePanel.updatePackages(pkg)
        }
    })

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