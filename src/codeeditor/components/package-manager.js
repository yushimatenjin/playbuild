// import NoPackageJson from './no-package';
import PackagePanel from './package-panel';
import { Container, TextInput, InfoBox } from '@playcanvas/pcui'
import '../styles/main.css'

const MAX_RESULTS = 5
const MIN_SEARCH_NUM_CHAR = 3
        
export default class PackageManagerSettings extends Container {

    constructor(){

        super()

        let currentSearch
        const searchInput = new TextInput({ keyChange: true, placeholder: 'Add Library' })
        const resultsCont = new Container({ hidden: true })
        this.info = new InfoBox({
            icon: 'E138',
            unsafe: true,
            title: 'No Libraries installed',
            text: "Use the search above to find and install libs from the <a href='https://www.npmjs.com/' target='_blank'>npm</a> registry"
        })
        this.noResults = new InfoBox({
            icon: 'E395',
            // unsafe: true,
            // title: 'No Dependencies installed',
            hidden : true,
            text: "It looks like there aren't any matches for that query"
        })

        this.installedPkgsCont = new Container()
        this.deps = {}
        
        this.append(searchInput)
        this.append(this.info)
        this.append(this.noResults)
        this.append(resultsCont)
        this.append(this.installedPkgsCont)
        
        // Set Input styles
        searchInput.dom.setAttribute('data-icon', String.fromCodePoint(parseInt('E129', 16)));
        searchInput.style.width = 'calc(100% - 12px)'
        this.installedPkgsCont.style.margin = '3px 8px'

        resultsCont.style['background-color'] = '#1d292c'

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

        searchInput.on('focus', _ => {
            this.info.hidden = true
        })

        searchInput.on('blur', _ => {
            this.noResults.hidden = true
            this.info.hidden = Object.keys(this.deps).length > 0
        })


        searchInput.on('change', async searchTerm => {
            if(currentSearch === searchTerm) return
            currentSearch = searchTerm
            if(searchTerm.length < MIN_SEARCH_NUM_CHAR) return;  
            
            const { objects } = await fetch(`https://registry.npmjs.com/-/v1/search?text=${searchTerm}&size=${MAX_RESULTS}`).then(r => r.json())
            
            if(currentSearch !== searchTerm) return
            
            this.noResults.hidden = objects.length > 0

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

        this.info.hidden = uniqueDeps.length > 0

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
            const reqOpts = { headers: { 'Accept': 'application/vnd.npm.install-v1+json' }}
            const module = await fetch(`https://registry.npmjs.com/${name}`, reqOpts).then(r => r.json())
            const packagePanel = new PackagePanel(module, deps[name])
            packagePanel.class.add('layers-settings-panel-layer-panel');
            packagePanel.on('change', update => {
                this.emit('update', update )
            })
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
