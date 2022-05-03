import { findPackageJson } from "./utils"
var path = require('path-browserify')

editor.once('assets:load', async progress => {

    //USE THIS TO GET ASSET CONtENtS
    //'assets:contents:get'

    const cache = {}
    const connection = editor.call('realtime:connection')
    const getFQN = obs => path.resolve('/' + obs.get('path').map(id => editor.call('assets:get', id).get('name')).join('/') + '/' + obs.get('name'))
    window.cache = cache

    const isBuildFile = asset => asset.get('type') === 'script' &&
        asset.get('name') === 'index.build.js' &&
        asset.get('path').length === 1
        // editor.call('assets:get', asset.get('path')[0]).get('name') === '.build'


    const triggerRebuild = cache => window.postMessage({ message:'compile', data: cache })

    window.addEventListener('message', ({ data }) => {
        switch(data.message){
            case 'onCompiled' :
                console.log('onCompiled', data.data)
                break;
            case 'onError' :
                console.log('onError', data.data)
                break;
            default : break
        }
    })

    const watchFile = obs => {
        return new Promise((resolve, reject) => {
            if(obs.get('type') !== 'script' ||) reject()
            
            obs.sync.on('sync', _ => {
                if(!doc.data) return
                cache[getFQN(obs)] = doc.data
                console.log('on sync', obs.get('name'), doc.data)
                triggerRebuild(cache)
            })

            const doc = connection.get('documents', obs.get('id'))
            doc.on('load', _ => {
                console.log('new file')
                cache[getFQN(obs)] = doc.data
                doc.destroy()
                resolve(doc.data)
            })

            // if(shouldFetch){
                // There is a race condition where locally created files trigger 'assets:add' before the sharedb ha the correct file contents
                editor.call('assets:contents:get', obs, (_, d) => console.log('from narive', _, d))
                setTimeout(_ => doc.subscribe(), 1000)
            // }
        })
    }

    // Populate the cache and listen for any invalidate if any updates occur
    await Promise.all(editor.call('assets:list')
        .filter(obs => obs.get('type') === 'script' && obs.get('name') !== 'build.js')
        .map(watchFile))

    triggerRebuild(cache)
  
    editor.on('assets:add', asset => watchFile(asset, true))
    editor.on('assets:remove', asset => {
        delete cache[getFQN(asset)]
    })

    console.log(cache)
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
    
    //     const pkgAsset = findPackageJson(editor)            
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