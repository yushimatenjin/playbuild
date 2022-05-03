import { diff2Op, findAsset, getBuildDir, getBuildFile, isBuildDir, isBuildFile, isPkgJson, resolvePath } from "./utils"
import * as DiffMatchPatch from 'diff-match-patch-js-browser-and-nodejs/diff_match_patch.js';
var path = require('path-browserify')



editor.once('assets:load', async progress => {

    const dmp = new DiffMatchPatch.diff_match_patch()

    //USE THIS TO GET ASSET CONtENtS
    //'assets:contents:get'

    const cache = {}
    const connection = editor.call('realtime:connection')
    window.cache = cache

    const triggerRebuild = cache => window.postMessage({ message:'compile', data: cache })

    window.addEventListener('message', async ({ data }) => {
        switch(data.message){
            case 'onCompiled' :
                
                console.log('onCompiled ')
                const buildFile = await getBuildFile(editor, data.data)
                const doc = connection.get('documents', buildFile.get('id'))

                // console.log('doc', doc.data)

                // buildFile.sync.on('sync', _ => {

                // })
                const doSave = _ => {
                    console.log('do save', buildFile.get('id'))
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
                    return
                }

                doc.once('load', _ => {
                    // submitOp(doc, data.data)
                    console.log('loaded')
                    doc.destroy()
                })
                // There is a race condition where locally created files trigger 'assets:add' before the sharedb ha the correct file contents
                setTimeout(_ => {
                    console.log('calling subscribe')
                    doc.subscribe()
                }, 2000)

                break;
            case 'onError' :
                console.log('onError  ', data.data)
                break;
            default : break
        }
    })

    const watchFile = obs => {
        console.log('attampting to watching ', obs.get('name'))
        return new Promise((resolve) => {
            if(obs.get('type') !== 'script' || isBuildFile(obs, editor)) return
            
            

            obs.sync.on('sync', _ => {
                if(!doc.data) return
                cache[resolvePath(obs)] = doc.data
                console.log('on sync', obs.get('name'), doc.data)
                triggerRebuild(cache)
            })

            const doc = connection.get('documents', obs.get('id'))
            doc.on('load', _ => {
                // console.log('new file')
                cache[resolvePath(obs)] = doc.data
                doc.destroy()
                resolve(doc.data)
            })

            // if(shouldFetch){
                // There is a race condition where locally created files trigger 'assets:add' before the sharedb ha the correct file contents
                setTimeout(_ => doc.subscribe(), 2000)
            // }
        })
    }

    // Populate the cache and listen for any invalidate if any updates occur
    editor.call('assets:list')
        .filter(obs => obs.get('type') === 'script' && obs.get('name') !== 'build.js')
        .map(watchFile)

    triggerRebuild(cache)
  
    editor.on('assets:add', asset => {
        console.log('herllo')
        watchFile(asset)
    })
    editor.on('assets:remove', asset => {
        delete cache[resolvePath(asset)]
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