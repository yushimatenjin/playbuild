// import NoPackageJson from './no-package';
// import * as DiffMatchPatch from 'diff-match-patch-js-browser-and-nodejs/diff_match_patch.js';
// import { diff2Op, findAsset, isPkgJson } from '../utils';
import PackagePanel from './package-panel';
import { Panel, Container, TextInput, InfoBox } from '@playcanvas/pcui'

const MAX_RESULTS = 5
const MIN_SEARCH_NUM_CHAR = 3
const ATTRIBUTES = [
    {
        type:'string',
        alias: 'dep',
        args: {
            keyChange: true,
            placeholder: 'Add Dependency',
        }
    },
    {
        type: 'container',
        alias: 'results',
        args: {
            hidden: true
        }
    },
    {
        type: 'container',
        alias: 'installed'
    },
]
        
        
export default class PackageManagerSettings extends Panel {

    constructor(){
        super({
            collapsed: false,
            collapsible: true,
            removable: false,
            headerText: 'PACKAGES'
        })

        let currentSearch
        const searchInput = new TextInput({keyChange: true, placeholder: 'Add Dependency'})
        const resultsCont = new Container({ hidden: true })
        this.installedPkgsCont = new Container()
        this.deps = {}

        this.append(searchInput)
        this.append(resultsCont)
        this.append(this.installedPkgsCont)
        
        searchInput.style.width = 'calc(100% - 12px)'
        this.installedPkgsCont.style.margin = '3px 8px'

        const results = Array.from(new Array(MAX_RESULTS)).map(_ => {
            const info = new InfoBox({
                icon: 'E410',
                title: '',
                text: ''
            })
            info.style.cursor = 'pointer'
            resultsCont.append(info)
            return info
        })
  
        const addPackage = ({ name, version }) => {
            
            const pkg = {[name]: version}

            // Optimistic local update to give faster user feedback
            if(this.deps) this.updatePackages({ ...this.deps, ...pkg })
            
            this.emit('add', pkg)
        }


        searchInput.on('change', async searchTerm => {
            if(currentSearch === searchTerm) return
            currentSearch = searchTerm
            if(searchTerm.length < MIN_SEARCH_NUM_CHAR) return;  
            
            const { objects } = await fetch(`https://registry.npmjs.com/-/v1/search?text=${searchTerm}&size=${MAX_RESULTS}`).then(r => r.json())
            
            if(currentSearch !== searchTerm) return
            
            resultsCont.hidden = false
            results.forEach(info => info.hidden = true)
            
            objects.forEach((object, i) => {
                const info = results[i]
                info.hidden = false
                info.dom.onmousedown = e => {
                    searchInput.value = ''
                    searchInput.blur()
                    addPackage(object.package)
                    resultsCont.hidden = true
                }
                info.title = object.package.name
                info.text = object.package.description
                if(!info.parent) results.append(info)
            })
        })
        
        searchInput.on('blur', _ => {
            resultsCont.hidden = true
            searchInput.value = ''
        })

        this.packagePanels = {}

    }

    updatePackages (deps) {

        // dedupe the keys
        const uniqueDeps = [...new Set(Object.keys(deps ?? {}))];
        const currentDeps = Object.keys(this.deps)

        // Remove any packages in our current state that do not exist in the new state
        currentDeps?.forEach( name  => {
            if(!uniqueDeps?.includes(name)){
                const packagePanel = this.packagePanels[name]
                packagePanel?.parent.remove(packagePanel)
                packagePanel?.destroy()
            }
        })

        uniqueDeps.forEach(async (name, i) => {
            if(currentDeps.includes(name)) return
            const module = await fetch(`https://registry.npmjs.com/${name}/${deps[name]}`).then(r => r.json())
            const packagePanel = new PackagePanel(module)
            packagePanel.class.add('layers-settings-panel-layer-panel');
            packagePanel.on('click:remove', _ => {
                packagePanel.parent.remove(packagePanel)
                delete this.packagePanels[name]
                this.emit('remove', module.name )
            })
            this.packagePanels[name] = packagePanel
            this.installedPkgsCont.append(packagePanel)
        })

        this.deps = deps ?? {}
    }

    destroy(){
        this.updatePackages({})
        super.destroy()
    }

}
