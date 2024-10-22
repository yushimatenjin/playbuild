import { isWatchableFile, diff2Op, getBuildFile, resolvePath } from "../utils/utils"
import * as DiffMatchPatch from 'diff-match-patch-js-browser-and-nodejs/diff_match_patch.js';
import { debounce } from 'debounce'
import { watchFile } from '../utils/fs'

export default function initialize(cache = {}, dependencies = {}, opts = {}) {

    const dmp = new DiffMatchPatch.diff_match_patch()
    const connection = editor.call('realtime:connection')

    const updateCache = ({ key, value }) => value ? cache[key] = value : delete cache[key]

    const triggerBuild = debounce((cache, deps, opts) => {
        
        editor.call('assets:list')
            .filter(isWatchableFile)
            .forEach(asset => {
                // Mark source files to be excluded from the launcher
                const uid = asset.get('id')
                const doc = connection.get('assets', uid)
                if (!asset.get('exclude')) doc.submitOp({ p: ['exclude'], oi:true })
                if (asset.get('preload')) doc.submitOp({ p: ['preload'], oi:false })
            })

        window.postMessage({ message:'pcpm:build', data: { cache, deps, opts }})
    }, 200)

    const incrementalBuild = change => {
        updateCache(change)
        triggerBuild(cache, dependencies, opts)
    }

    const watchAllExistingFiles = async _ => {
        // Load the initial available files and listen for changes

        const initialFiles = await Promise.all(editor.call('assets:list')
            .filter(isWatchableFile)
            .map(asset => watchFile(asset, incrementalBuild)))

        // Update the cache with the initial files
        initialFiles.forEach(({ key, value }) => cache[key] = value)

        triggerBuild(cache, dependencies, opts)
    }

    watchAllExistingFiles()

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

    return {
        update: (deps, opts = {}) => {
            dependencies = deps
            if( Object.keys(cache).length > 0 ) triggerBuild(cache, dependencies, opts)    
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