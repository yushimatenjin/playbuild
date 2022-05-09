import { watchFile } from './fs'
import { findAsset, isPkgJson } from '../utils.js'

export const watchPkgJson = onChange => {

    if(!onChange || typeof onChange !== 'function') throw new Error(`'watchPkgJson' expects a function parameter`)

    const watch = pkg => {
        editor.on('assets:remove', asset => {
            if(!isPkgJson(asset)) return
            console.log('pkg removed!')
            editor.on('assets:add', onAssetAdded)
            onChange(null)
        })
        watchFile(pkg, onChange)
    }

    const onAssetAdded = asset => {
        if(isPkgJson(asset)){
            editor.unbind('assets:add', onAssetAdded)
            watch(asset)
        }
    }
    
    const packageJson = findAsset(isPkgJson)
    if(packageJson) watch(packageJson)
    else editor.on('assets:add', onAssetAdded)

}

export const createPackageJson = _ => {
    return new Promise((resolve, reject) => {
        if (!editor.call('permissions:write')) return

        const pkg = {
            dependencies:{}
        }

        var asset = {
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

        editor.call('assets:create', asset, _ => resolve(pkg), true);
    })
}
