import { findAsset, isPkgJson } from './utils.js'
import path from 'path-browserify'

const resolvePath = (asset, altPath) => {
    const relativePath = (altPath ?? asset.get('path'))
        .map(id => editor.call('assets:get', id).get('name')).join('/')
    return path.resolve('/' + relativePath + '/' + asset.get('file.filename'))
}

const readFile = (asset) => {
    return new Promise((resolve, reject ) => {

        const resolveData = asset => editor.call('assets:contents:get', asset, (err, value) => {
            const key = resolvePath(asset)
            if(err) reject(err)
            else resolve({ key, value })
        })

        const uid = asset.get('id')
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

export const watchJson = async (jsonFile) => {
    const { value } = await readFile(jsonFile)
    return JSON.parse(value)
}

export const watchPkgJson = async onChange => {

    if(!onChange || typeof onChange !== 'function') throw new Error(`'watchPkgJson' expects a function parameter`)
    const connection = editor.call('realtime:connection')


    const onAssetRemoved = asset => {
        editor.unbind('assets:remove', onAssetRemoved)
        asset.unbind('file.hash:set', asset._onAssetContentChanged)
        editor.on('assets:add', onAssetAdded)
        asset._onAssetAdded = _ => onAssetAdded(asset)
        asset.once('name:set', asset._onAssetAdded)
        asset.once('path:set', asset._onAssetAdded)
        onChange(null)
    }

    const onAssetContentChanged = asset => {

        // const asset = findAsset(isPkgJson)
        const uid = asset.get('id')
        const doc = connection.get('documents', uid)
        if(doc?.data) onChange(JSON.parse(doc.data))
    }
    
    const onAssetAdded = async asset => {
        console.log(asset.get('name'), isPkgJson(asset))
        if(isPkgJson(asset)){
            editor.once('assets:remove', asset => isPkgJson(asset) && onAssetRemoved(asset))
            
            asset._onAssetContentChanged = _ => onAssetContentChanged(asset)
            asset.on('file.hash:set', asset._onAssetContentChanged)
            editor.unbind('assets:add', onAssetAdded)

            asset._onAssetRemoved = _ => onAssetRemoved(asset)
            asset.once('name:set', asset._onAssetRemoved)
            asset.once('path:set', asset._onAssetRemoved)
            const pkg = await watchJson(asset)
            onChange(pkg)

        } else {

            asset._onAssetAdded = _ => onAssetAdded(asset)

            asset.once('name:set', asset._onAssetAdded)
            asset.once('path:set', asset._onAssetAdded)
        }
    }
    
    const packageJson = findAsset(isPkgJson)
    if(packageJson) {
        onAssetAdded(packageJson)
    } else {
        editor.on('assets:add', onAssetAdded)
        const allJsonFiles = editor.call("assets:list").filter(asset => asset._data.type === 'json')
        allJsonFiles.forEach(onAssetAdded)
    }
}

export const createPackageJson = (pkg = { dependencies:{}}) => {
    return new Promise((resolve, reject) => {
        if (!editor.call('permissions:write')) reject()
        // if (findAsset(isPkgJson)) resolve(pkg)

        var assetDef = {
            name: 'package.json',
            type: 'json',
            source: false,
            filename: 'package.json',
            file: new Blob([JSON.stringify(pkg, null, 4)], { type: 'application/json' }),
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', assetDef, _ => {

            // Hack to deselect the package json if created here
            setTimeout(function () {
                editor.call('tabs:temp:lock');
                editor.call('editor:command:close');
                editor.call('tabs:temp:unlock');
            }, 10 )

            resolve(pkg)
        });
    })
}

/*
  Fetches package.json
*/
export const getPkgJson = _ => {

    return new Promise(async resolve => {
        let pkg = findAsset(isPkgJson)

        if (!pkg){
            resolve(null)
            return null
            // await createPackageJson()
            // pkg = findAsset(isPkgJson)
        }

        const connection = editor.call("realtime:connection");
        const packageDoc = connection.get("documents", pkg.get("id"));

        if(packageDoc.data) resolve(packageDoc)
        else {
            packageDoc.on('load', _ => {
                resolve(packageDoc)
            })
            packageDoc.subscribe()
        }
    })
}
