import NoPackageJson from './no-package';
import { watchPkgJson } from '../utils/package'
import { findAsset, isPkgJson } from '../utils'
// import { InfoBox } from 'pcui'

export default class PackageManagerSettings extends pcui.BaseSettingsPanel {

    constructor(){
        super({
            assets: editor.call('assets:raw'),
            entities: editor.call('entities:list'),
            history: editor.call('editor:history'),
            settings: editor.call('settings:projectUser'),
            projectSettings: editor.call('settings:project'),
            userSettings: editor.call('settings:user'),
            sceneSettings: editor.call('sceneSettings'),
            sessionSettings: editor.call('settings:session'),
            attributes: [],
            headerText: 'PACKAGE MANANGER'
        })
 
        const noPackageWarn = new NoPackageJson()
        const pkgInstalledBox = new pcui.InfoBox({
            title: 'PCPM Initialized',
            text: 'A package.json was found and the package manager is available and running for this project.',
            icon: 'E151'
        })
        this.append(pkgInstalledBox)

        const invalidateWarning = show => {
            if (!show && noPackageWarn.parent){
                this.remove(noPackageWarn)
                this.append(pkgInstalledBox)
            }
            else if (show && !noPackageWarn.parent ){
                this.append(noPackageWarn)
                this.remove(pkgInstalledBox)
            }
        }
  
        watchPkgJson(pkg => invalidateWarning(!pkg))

        this.on('parent', _ => {
            const hasPkg = !!findAsset(isPkgJson)
            invalidateWarning(!hasPkg)
        })

    }
}
