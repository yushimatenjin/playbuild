import { findPackageJson } from "./utils"

editor.once('assets:load', progress => {

    const cache = {}
    const connection = editor.call('realtime:connection')
    const getFQN = obs => obs.get('path').map(id => editor.call('assets:get', id).get('name')).join('/') + '/' + obs.get('name')

    // Populate the cache and listen for any invalidate if any updates occur
    editor.call('assets:list')
        .filter(obs => obs.get('type') === 'script')
        .forEach(obs => {

            const doc = connection.get('documents', obs.get('id'))
            doc.on('load', _ => {
                cache[getFQN(obs)] = doc.data
                doc.destroy()
            })
            doc.subscribe()
        
            // on file update
            obs.sync.on('sync', _ => {
                cache[getFQN(obs)] = doc.data
                // console.log('on sync', connection.get('documents', obs.get('id')).data)
            })
        })

    // detect any changes to fs

    // console.log(cache)

    // get contents doc of an asset by id
    // editor.call('realtime:connection').get('documents', id)

    // subscribe to changes
    // doc.on('op', _ => _)

    // const triggerRebuild = _ => _
  
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
    
    //     const pkgAsset = findPackageJson(editor)
            
    //     const uid = pkgAsset?.get('uniqueId')

    //     if(packageUID === uid) return

    //     const doc = uid && editor.call('realtime:connection').get('documents', uid.toString());     
    //     doc?.subscribe(err => !err && editor.emit('package:fs:change', doc))

    //     if(!doc) editor.emit('package:fs:change')
    // }
  
    // // Listen for any changes to the event registry
    // editor.on('assets:add', onFileSystemUpdate)
    // editor.on('assets:remove', onFileSystemUpdate)
    // // editor.on('move', onFileSystemUpdate)
    // // editor.on('clear', onFileSystemUpdate)
    // onFileSystemUpdate(null)
})