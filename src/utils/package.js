import { watchFile } from './fs'
import { findAsset, isPkgJson } from '../utils.js'

export const watchJson = async (jsonFile, onChange) => {
    const { value } = await watchFile(jsonFile, ({ value }) => onChange(JSON.parse(value)))
    return JSON.parse(value)
}

export const watchPkgJson = async onChange => {

    if(!onChange || typeof onChange !== 'function') throw new Error(`'watchPkgJson' expects a function parameter`)

    const onAssetRemoved = asset => {
        if(!isPkgJson(asset)) return
        editor.unbind('assets:remove', onAssetRemoved)
        editor.on('assets:add', onAssetAdded)
        onChange(null)
    }

    const watch = async pkg => {    
        editor.on('assets:remove', onAssetRemoved)
        return watchJson(pkg, onChange)
    }
    
    const onAssetAdded = async asset => {
        if(isPkgJson(asset)){
            editor.unbind('assets:add', onAssetAdded)
            const pkg = await watch(asset)
            onChange(pkg)
        }
    }
    
    const packageJson = findAsset(isPkgJson)
    if(packageJson) {
        await watch(packageJson)
        // onChange(result)
    }
    else editor.on('assets:add', onAssetAdded)
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
  UPSERT OP on package.json file. Fetches and creates one if none exists
*/
export const getPkgJson = _ => {

    return new Promise(async resolve => {
        let pkg = findAsset(isPkgJson)

        if (!pkg){
            await createPackageJson()
            pkg = findAsset(isPkgJson)
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
