import { diff2Op  } from '../../utils/utils'
import { getPkgJson } from '../../utils/package'
import PackageManagerSettings from '../components/package-manager'
import * as DiffMatchPatch from 'diff-match-patch-js-browser-and-nodejs/diff_match_patch.js';

class PackageJsonDriver {

    constructor(){
        this.dmp = new DiffMatchPatch.diff_match_patch()
        this.panel = new PackageManagerSettings()
        this.panel.on('add', p => this.addPackage(p))
        this.panel.on('remove', p => this.removePackage(p))
        editor.call('layout.left').append(this.panel)

        window.postMessage({message: "pcpm:enabled", data: true })
    }

    update(deps){
        this.panel.updatePackages(deps)
    }

    async addPackage(newPackage) {
        
        const pkg = await getPkgJson()
        
        pkg.once('op', _ => {
            editor.call('realtime:send', 'doc:save:', parseInt(pkg.id, 10));
        })
        
        const data = JSON.parse(pkg.data)
        const diff = this.dmp.diff_main(
            pkg.data, 
            JSON.stringify({ 
                ...data,
                dependencies:{
                    ...data.dependencies,
                    ...newPackage 
                }
            }, null, 4)
            )
        const op = diff2Op(diff)  

        pkg.submitOp(op)
        pkg.emit('op', op, false)
    }

    async removePackage(removedPackageName) {
        const pkg = await getPkgJson()
        
        pkg.once('op', _ => {
            editor.call('realtime:send', 'doc:save:', parseInt(pkg.id, 10))
        })

        const data = JSON.parse(pkg.data)
        if(!data.dependencies[removedPackageName]) return
        delete data.dependencies[removedPackageName]

        const diff = this.dmp.diff_main(pkg.data, JSON.stringify(data, null, 4))
        const op = diff2Op(diff)
        pkg.submitOp(op)

        // packageAsset.sync.emit('sync', op);
        pkg.emit('op', op, false)
    }

    destroy(){
        this.dmp = null
        editor.call('layout.left').remove(this.panel)
        this.panel.destroy()

        window.postMessage({message: "pcpm:enabled", data: false })
    }
}

export default PackageJsonDriver