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
        console.log('pkg removed!')
        editor.on('assets:add', onAssetAdded)
        onChange(null)
    }

    const watch = pkg => {    
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
        onChange(watch(packageJson))
    }
    else editor.on('assets:add', onAssetAdded)
}

export const createPackageJson = _ => {
    return new Promise((resolve, reject) => {
        if (!editor.call('permissions:write')) reject()
        if (findAsset(isPkgJson)) resolve(pkg)

        const pkg = {
            dependencies:{}
        }

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

        editor.call('assets:create', assetDef, _ => resolve(pkg), true);
    })
}
