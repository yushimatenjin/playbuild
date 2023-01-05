import { isWatchableFile, diff2Op, getBuildFile, resolvePath } from "../utils"
import * as DiffMatchPatch from 'diff-match-patch-js-browser-and-nodejs/diff_match_patch.js';
import { debounce } from 'debounce'
import { watchFile } from '../utils/fs'

export default function initialize(cache = {}, dependencies = {}) {

    const dmp = new DiffMatchPatch.diff_match_patch()
    const connection = editor.call('realtime:connection')

    const updateCache = ({ key, value }) => value ? cache[key] = value : delete cache[key]

    const triggerBuild = debounce((cache, deps) => {
        window.postMessage({ message:'pcpm:build', data: { cache, deps }})
    }, 200)

    const incrementalBuild = change => {
        updateCache(change)
        triggerBuild(cache, dependencies)
    }

    const watchFiles = async _ => {
        // Load the initial available files and listen for changes
        const initialFiles = await Promise.all(editor.call('assets:list')
            .filter(isWatchableFile)
            .map(asset => watchFile(asset, incrementalBuild)))

        // Update the cache with the initial files
        initialFiles.forEach(({ key, value }) => cache[key] = value)

        triggerBuild(cache, dependencies)
    }

    watchFiles()

    /*
    *  Listen for compiler events
    */
    const onWindowPostMessage =  async ({ data }) => {
        switch(data.message){
            case 'pcpm:build:done' :
                
                const buildFile = await getBuildFile(data.data)
                const doc = connection.get('documents', buildFile.get('id'))

                const save = _ => {
                    editor.call('realtime:send', 'doc:save:', parseInt(buildFile.get('id'), 10));
                }

                const submitOp = (doc, data) => {
                    if(doc.data === data) return
                    var diff = dmp.diff_main(doc.data, data);      
                    // console.log('Submitting OT')
                    // dmp.diff_cleanupSemantic(diff);
                    doc.once('op', _ => {
                        doc.hasPending() ? doc.once('nothing pending',  save) : save()
                    })

                    doc.submitOp(diff2Op(diff))
                }

                if(doc.data) submitOp(doc, data.data)

                doc.once('load', _ => {
                    submitOp(doc, data.data);
                    doc.destroy()
                })

                doc.subscribe()

                break;
            default : break
        }
    }

    
    // When an asset is added watch for changes and trigger an immediate incremental build
    const onAssetAddded = async asset => {
        
        // Source scripts included in the build must be excluded from PC launcher
        // const doc = connection.get('assets', asset.get('id'))
        // doc.submitOp({ p: ['exclude'], oi:true })
        if(!isWatchableFile(asset)) return
        watchFile(asset, incrementalBuild)
        
    }

    const onAssetRemoved = asset => {
        
        if(!isWatchableFile(asset)) return
        // Trigger some rebuild when files has been removed
        const key = resolvePath(asset)
        incrementalBuild({ key, value: null })
    }

    // Set app listeners
    window.addEventListener('message', onWindowPostMessage )
    editor.on('assets:add', onAssetAddded)
    editor.on('assets:remove', onAssetRemoved)
    
    //Trigger Initial Build
    // triggerBuild(cache, dependencies)

    return {
        updateDeps: (deps, shouldBuild = true) => {
            dependencies = deps
            if(shouldBuild && Object.keys(cache).length > 0 ) triggerBuild(cache, dependencies)    
        },
        destroy: _ => {

            window.removeEventListener('message', onWindowPostMessage )

            // Removed Asset Found/Lost Listeners
            editor.unbind('assets:add', onAssetAddded)
            editor.unbind('assets:remove', onAssetRemoved)

            editor.call('assets:list')
                .filter(isWatchableFile)
                .forEach(asset => {
                    asset.sync.unbind('sync')
                    asset.unbind('name:set')
                    asset.unbind('path:set')
                    asset.unbind('file.filename:set')
                })

            // Remove isolated world message listener
            window.removeEventListener('message', onWindowPostMessage )

            // notify contentscript 
            window.postMessage({ message:'pcpm:destroy'})
        }
    }
}