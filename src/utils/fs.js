import path from 'path-browserify'

const resolvePath = (asset, altPath) => {
    const relativePath = (altPath ?? asset.get('path'))
        .map(id => editor.call('assets:get', id).get('name')).join('/')
    return path.resolve('/' + relativePath + '/' + asset.get('file.filename'))
}


/*
 *  Resolves an assets contents and watches it for updates
 */
    
export const watchFile = (asset, onUpdate) => {
    return new Promise((resolve, reject ) => {

        if(!editor.isCodeEditor) reject(`'watchFile' only works in the code editor page`)
        
        const connection = editor.call('realtime:connection')
        const uid = asset.get('id')

        // Source scripts included in the build must be excluded from PC launcher
        const doc = connection.get('assets', uid)
        doc.submitOp({ p: ['exclude'], oi:true })
        doc.submitOp({ p: ['preload'], oi:false })

        asset.sync.on('sync', _ => {
            // const doc = editor.call('documents:get', uid );
            const doc = connection.get('documents', uid)
            const key = resolvePath(asset)
            if(doc?.data) onUpdate({ key, value: doc.data })
        })

        // If the name changes remove the old key from cache
        asset.on('name:set', (name, nameOld) => {
            const key = path.join(path.dirname(resolvePath(asset)), nameOld)
            console.log('name set. removing', key)
            onUpdate({ key, value: null })
        })
        
        // If the assets moves
        asset.on('path:set', (path, oldPath) => {
            const key = resolvePath(asset, oldPath)
            console.log('path set. removing', key)
            onUpdate({ key, value: null })
        })

        const resolveData = asset => editor.call('assets:contents:get', asset, (err, value) => {
            const key = resolvePath(asset)
            if(err) reject(err)
            else resolve({ key, value })
        })

        const editorDoc = editor.call('documents:get', uid )
        if (editorDoc?.data) {
            const key = resolvePath(asset)
            resolve({ key, value: editorDoc.data })
        } else if (asset.get('file.filename')) {
            resolveData(asset);
        } else {
            asset.once('file.filename:set', _ => resolveData(asset));
        }
    })
}