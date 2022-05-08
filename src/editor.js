import { diff2Op, findAsset, getBuildDir, getBuildFile, isBuildDir, isBuildFile, isPkgJson, resolvePath, isAmmo } from "./utils"
import * as DiffMatchPatch from 'diff-match-patch-js-browser-and-nodejs/diff_match_patch.js';
import { debounce } from 'debounce'
import path from 'path-browserify'

editor.once('assets:load', async progress => {

    const cache = {}
    const dmp = new DiffMatchPatch.diff_match_patch()
    const connection = editor.call('realtime:connection')

    const updateCache = ({ key, value }) => value ? cache[key] = value : delete cache[key]

    const triggerBuild = debounce(cache => {
        window.postMessage({ message:'pcpm:build', data: cache })
    }, 200)

    const incrementalBuild = change => {
        updateCache(change)
        triggerBuild(cache)
    }

    const isScript = asset => asset.get('type') === 'script' && !isBuildFile(asset, editor)

    /*
     *  Resolves an assets contents and watches it for updates
     */
    const watchFile = (asset, onUpdate) => {
        return new Promise((resolve, reject ) => {
            if(!isScript(asset) || isBuildFile(asset) || isAmmo(asset)) return
            
            const name = asset.get('name')
            const uid = asset.get('id')
            console.log('Watching asset ', name, uid)

            // Source scripts included in the build must be excluded from PC launcher
            const doc = connection.get('assets', asset.get('id'))
            doc.submitOp({ p: ['exclude'], oi:true })
            doc.submitOp({ p: ['preload'], oi:false })

            asset.sync.on('sync', _ => {
                const doc = editor.call('documents:get', uid );
                const key = resolvePath(asset)
                if(doc?.data) onUpdate({ key, value: doc.data })
            })

            // If the name changes remove the old key from cache
            asset.on('name:set', (name, nameOld) => {
                const key = path.join(path.dirname(resolvePath(asset)), nameOld)
                console.log('name set. removing', key)
                updateCache({ key, value: null })
            })
            
            asset.on('path:set', (path, oldPath) => {
                const key = resolvePath(asset, oldPath)
                console.log('path set. removing', key)
                updateCache({ key, value: null })
            })

            const resolveData = asset => editor.call('assets:contents:get', asset, (err, value) => {
                const key = resolvePath(asset)
                if(err) reject(err)
                else resolve({ key, value })
            })

            if (editor.call('documents:get', uid )?.data) {
                const key = resolvePath(asset)
                resolve({ key, value: doc.data })
            } else if (asset.get('file.filename')) {
                resolveData(asset);
            } else {
                asset.once('file.filename:set', _ => resolveData(asset));
            }
        })
    }
    
    // Load the initial available files and listen for changes
    const initialFiles = await Promise.all(editor.call('assets:list')
        .filter(obs => obs.get('type') === 'script' && !isBuildFile(obs, editor) && !isAmmo(obs))
        .map(asset => watchFile(asset, incrementalBuild)))

    // Update the cache with the initial files
    initialFiles.forEach(({ key, value }) => cache[key] = value)

    /*
     *  Listen for compiler events
     */

    window.addEventListener('message', async ({ data }) => {
        switch(data.message){
            case 'onCompiled' :
                
                console.log('onCompiled')
                const buildFile = await getBuildFile(editor, data.data)
                const doc = connection.get('documents', buildFile.get('id'))

                const save = _ => {
                    console.log('saving', buildFile.get('id'))
                    editor.call('realtime:send', 'doc:save:', parseInt(buildFile.get('id'), 10));
                }

                const submitOp = (doc, data) => {
                    if(doc.data === data) return
                    var diff = dmp.diff_main(doc.data, data);      
                    console.log('submitting operation', diff)
                    // dmp.diff_cleanupSemantic(diff);
                    doc.once('op', _ => {
                        doc.hasPending() ? doc.once('nothing pending',  save) : save()
                    })

                    doc.submitOp(diff2Op(diff))
                }

                if(doc.data) submitOp(doc, data.data)

                doc.once('load', _ => {
                    // submitOp(doc, data.data)
                    console.log('Built File loaded')
                    submitOp(doc, data.data);
                    doc.destroy()
                })

                doc.subscribe()

                break;
            case 'onError' :
                console.log('onError  ', data.data)
                break;
            default : break
        }
    })


    triggerBuild(cache)

    // When an asset is added watch for changes and trigger an immediate incremental build
    editor.on('assets:add', async asset => {

        // Source scripts included in the build must be excluded from PC launcher
        // const doc = connection.get('assets', asset.get('id'))
        // doc.submitOp({ p: ['exclude'], oi:true })
        if(!isScript(asset) || isAmmo(asset)) return
        watchFile(asset, incrementalBuild)
        
    })

    editor.on('assets:remove', asset => {

        if(!isScript(asset)) return
        // Trigger some rebuild when files has been removed
        const key = resolvePath(asset)
        incrementalBuild({ key, value: null })
    })


    editor.on('assets:renamed**', asset => asset )
    editor.on('assets:moved**', asset => asset )
    
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
})