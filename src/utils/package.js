import { findAsset, isPkgJson } from '../utils.js'
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

    const onAssetRenamed = name => {

        const asset = findAsset(isPkgJson)

        if(name === 'package.json') {
            onAssetAdded(asset)
        } else {
            // onAssetRemoved(asset)
        }
    }

    const onAssetRemoved = asset => {
        if(!isPkgJson(asset)) return
        editor.unbind('assets:remove', onAssetRemoved)
        asset.unbind('file.hash:set', onAssetContentChanged)
        editor.on('assets:add', onAssetAdded)
        onChange(null)
    }

    const onAssetContentChanged = _ => {

        const uid = asset.get('id')
        const doc = connection.get('documents', uid)
        // const key = resolvePath(asset)
        if(doc?.data) onChange(doc.data)
    }

    // const watch = async pkg => {    
    //     editor.on('assets:remove', onAssetRemoved)
    //     asset.on('file.hash:set', onAssetContentChanged)
    //     return readFile(pkg, onChange)
    // }
    
    const onAssetAdded = async asset => {
        if(isPkgJson(asset)){
            editor.unbind('assets:add', onAssetAdded)
            // const checkIfRenamedFromPackageJson = (a, b, c) => {
            //     console.log('isPGF A', isPkgJson(asset), a, b, c)
            //     if(!isPkgJson(asset)) {
            //         asset.unbind('name:set', checkIfRenamedFromPackageJson)
            //         onAssetRemoved(asset)
            //     }
            // }
            asset.on('name:set', checkIfRenamedFromPackageJson)
            asset.on('file.hash:set', onAssetContentChanged)
            editor.on('assets:remove', onAssetRemoved)
            const pkg = await readFile(asset)
            onChange(pkg)
        } else {
            // const checkIfRenamedToPackageJson = (a, b, c) => {
            //     console.log('isPGF B', isPkgJson(asset), a, b, c)
            //     if(isPkgJson(asset)) {
            //         asset.unbind('name:set', checkIfRenamedToPackageJson)
            //         onAssetAdded(asset)
            //     }
            // }
            // asset.on('name:set', checkIfRenamedToPackageJson)
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
