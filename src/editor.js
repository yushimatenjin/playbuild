import { diff2Op, findAsset, getBuildDir, getBuildFile, isBuildDir, isBuildFile, isPkgJson, resolvePath } from "./utils"
import * as DiffMatchPatch from 'diff-match-patch-js-browser-and-nodejs/diff_match_patch.js';

editor.once('assets:load', async progress => {

    const cache = {}
    const dmp = new DiffMatchPatch.diff_match_patch()
    const connection = editor.call('realtime:connection')

    const updateCache = ({ key, value }) => cache[key] = value
    const triggerRebuild = cache => window.postMessage({ message:'compile', data: cache })
    const incrementalBuild = change => {
        console.log('incremental build', change)
        updateCache(change)
        triggerRebuild(cache)
    }

    /*
     *  Resolves an assets contents and watches it for updates
     */

    const watchFile = (asset, onUpdate) => {
        return new Promise((resolve, reject ) => {
            if(asset.get('type') !== 'script' || isBuildFile(asset, editor)) return
            
            const key = resolvePath(asset)
            const name = asset.get('name')
            const uid = asset.get('id')

            console.log('Watching asset ', name, uid)
            const doc = connection.get('documents', uid)
            
            // doc.on('op', op => console.log("DOC HSA OP", _))

            asset.sync.on('sync', _ => {

                // editor.call('assets:contents:get', asset, function (err, content){
                const { data } = editor.call('documents:get', asset.get('id') );//connection.get('documents', uid)
                // console.log('update', content === dd.data)
                onUpdate({ key, value: data })
                
                // })
                // if(!doc.data) return
            })
            doc.on('error', error => reject(error))

            if(doc.data) resolve({ key, value: doc.data })
            else {

                /*
                 * Currently when an asset:add is called the data is not on sharedb
                 */

                const assetDoc = connection.get('assets', uid);
                assetDoc.once('op', _ => {
                    // doc.destroy()
                    console.log("HAS OP")
                    resolve({ key, value: doc.data })
                })

                // There is a race condition where locally created files trigger 'assets:add' before the sharedb updates
                // setTimeout(_ => doc.subscribe(), 1000)
            }
        })
    }
    
    // Load the initial available files and listen for changes
    const initialFiles = await Promise.all(editor.call('assets:list')
        .filter(obs => obs.get('type') === 'script' && !isBuildFile(obs, editor))
        .map(asset => watchFile(asset, incrementalBuild)))

    // Update the cache with the initial files
    initialFiles.forEach(({ key, value }) => cache[key] = value)

    // initialize the compiler
    window.postMessage({ message: 'pcpm:init', data: cache })


    /*
     *  Listen for compiler events
     */

    window.addEventListener('message', async ({ data }) => {
        switch(data.message){
            case 'onCompiled' :
                
                console.log('onCompiled')
                const buildFile = await getBuildFile(editor, data.data)
                const doc = connection.get('documents', buildFile.get('id'))

                const doSave = _ => {
                    console.log('saving', buildFile.get('id'))
                    const uid = parseInt(buildFile.get('id'), 10)
                    editor.call('realtime:send', 'doc:save:', uid);
                }

                const submitOp = (doc, data) => {
                    var diff = dmp.diff_main(doc.data, data);      
                    console.log('submitting', diff)
                    // dmp.diff_cleanupSemantic(diff);
                    doc.once('op', _ => {
                        if (doc.hasPending()) {
                            // wait for pending data to be sent and
                            // acknowledged by the server before saving
                            doc.once('nothing pending',  doSave);
                        } else {
                            doSave();
                        }
                    })

                    doc.submitOp(diff2Op(diff))
                }

                if(doc.data){
                    submitOp(doc, data.data)
                    // return
                }

                doc.once('load', _ => {
                    // submitOp(doc, data.data)
                    console.log('loaded', name)
                    submitOp(doc, data.data);
                    doc.destroy()
                })

                // // There is a race condition where locally created files trigger 'assets:add' before the sharedb ha the correct file contents
                    doc.subscribe()

                break;
            case 'onError' :
                console.log('onError  ', data.data)
                break;
            default : break
        }
    })


    triggerRebuild(cache)

    // When an asset is added watch for changes and trigger an immediate incremental build
    editor.on('assets:add', async asset => {

        // Source scripts included in the build must be excluded from PC launcher
        const doc = connection.get('assets', asset.get('id'))
        doc.submitOp({ p: ['exclude'], oi:true })

        watchFile(asset, incrementalBuild)
        
    })

    editor.on('assets:remove', asset => {
        // Trigger some rebuild when files has been removed
        delete cache[resolvePath(asset)]
        incrementalBuild(cache)
    })
    
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

    //     // triggerRebuild()
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