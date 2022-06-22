// import NoPackageJson from './no-package';
import * as DiffMatchPatch from 'diff-match-patch-js-browser-and-nodejs/diff_match_patch.js';
import { diff2Op, findAsset, isPkgJson } from '../utils';
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
        // const connection = editor.call('realtime:connection')
        // let packageDoc = connection.get('documents', pkg.get('id'))
        // const dmp = new DiffMatchPatch.diff_match_patch()
        const searchInput = new TextInput({keyChange: true, placeholder: 'Add Dependency'})
        const resultsCont = new Container({ hidden: true })
        this.installedPkgsCont = new Container()

        // let openedDoc
        // editor.on('documents:close', id => {
        //     if(id !== openedDoc?.id) return
        //     openedDoc = null
        //     console.log('closed', id)
        // })
        // editor.on('documents:load', (doc, asset, docEntry) => {
        //     if(!isPkgJson(asset)) return
        //     openedDoc = doc
        // })
        
        this.append(searchInput)
        this.append(resultsCont)
        this.append(this.installedPkgsCont)
        
        searchInput.style.width = 'calc(100% - 12px)'
        this.installedPkgsCont.style.margin = '3px 8px'
        
        // const onPackageDocUpdated = data => {
        //     if(!data) return

        //     const dependencies = JSON.parse(data)

        //     installedPkgsCont.clear()

        //     Object.keys(dependencies).forEach(async (name, i) => {
        //         const module = await fetch(`https://registry.npmjs.com/${name}/${dependencies[name]}`).then(r => r.json())
        //         const packagePanel = new PackagePanel(module)
        //         packagePanel.class.add('layers-settings-panel-layer-panel');
        //         packagePanel.once('click:remove', _ => removePackage({ name }))
        //         installedPkgsCont.append(packagePanel)
        //     })
        // }

        // packageDoc.on('op', onPackageDocUpdated)
        // connection.get('assets', asset.get('id'))
        // if(packageDoc.data) onPackageDocUpdated(packageDoc.data)
        // else {
        //     // editor.call('assets:contents:get', pkg, (err, value) => {
        //     //     // console.log('sdfsdf', err, value)
        //     // })
        // }
        // pkg.sync.on('sync', _ => onPackageDocUpdated(packageDoc.data))
        
        // if(!packageDoc.data){
        //     packageDoc.on('load', _ => {
        //         onPackageDocUpdated(packageDoc.data)
        //         packageDoc.destroy()
        //     }); 
        // }else{
        //     onPackageDocUpdated(packageDoc.data)
        // }
        // packageDoc.subscribe()


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

        // const updatePackageJson = newPkg => {

        //     if(!packageDoc) return

        //     // Optimistically render the local packages assuming the operation succeeds
        //     // Find the diff between the two
        //     var diff = dmp.diff_main(packageDoc.data, JSON.stringify(newPkg, null, 4));      
        //     // dmp.diff_cleanupSemantic(diff);

        //     packageDoc.once('op', _ => {
        //         // console.log('op', packageDoc.data)
        //         onPackageDocUpdated(packageDoc.data)
        //         editor.call('realtime:send', 'doc:save:', parseInt(pkg.get('id'), 10));
        //     })

        //     const op = diff2Op(diff)
        //     packageDoc.submitOp(op)

        //     // KLUDGE: Submitting an op to shareDB won't invalidate the local state.
        //     // This hack/method triggers an internal update. Ideally we can hook into some local api to update
        //     // console.log('has sasd', editor.call('documents:list').includes(pkg.get('id')))
        //     if (openedDoc) {
        //         // pkg.sync.unbind('sync', onPackageDocUpdated)
        //         openedDoc.emit('op', op, false)
        //         // pkg.sync.on('sync', onPackageDocUpdated)
        //     }
        // }
  
        const addPackage = ({ name, version }) => {
            
            // const localPkg = JSON.parse(packageDoc.data)
            // const l
            // localPkg.dependencies = { ...localPkg.dependencies, [name]: version }
            const pkg = {[name]: version}

            // Optimistic local update to give faster user feedback
            if(this.deps) this.updatePackages({ ...this.deps, ...pkg })
            
            this.emit('add', pkg)
            // this.emit('update', { ...localPkg.dependencies, [name]: version })
            // updatePackageJson(localPkg)
        }

        const removePackage = ({ name }) => {
            
            // const localPkg = JSON.parse(packageDoc.data)
            // const pkg = { ...locaPkg }
            // delete pkg.dependencies[name]
            
            this.emit('remove', name )
            // this.emit('update', pkg )
            // updatePackageJson(localPkg)
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

        // const onPackageDocUpdated = _ => {
        //     if(!packageDoc?.data) return
        //     // installedPkgsCont.clear()
        //     const { dependencies } = JSON.parse(packageDoc.data)

        //     installedPkgsCont.clear()

        //     Object.keys(dependencies).forEach(async (name, i) => {
        //         const module = await fetch(`https://registry.npmjs.com/${name}/${dependencies[name]}`).then(r => r.json())
        //         // console.log(resp)
        //         const packagePanel = new PackagePanel(module)
        //         // const packagePanel = new pcui.Panel({
        //         //     headerText: name,
        //         //     removable: true,
        //         //     collapsible: true,
        //         //     collapsed: true
        //         // })
        //         // const info = new pcui.InfoBox({
        //         //     icon: 'E218',
        //         //     title: name,
        //         //     text: 'SOME INFO'
        //         // })
        //         packagePanel.class.add('layers-settings-panel-layer-panel');
        //         packagePanel.once('click:remove', _ => removePackage({ name }))
        //         // packagePanel.append(info)
        //         installedPkgsCont.append(packagePanel)
        //     })
        // }

        // editor.on('package:fs:change', doc => {
        
        //     // If we had a previous reference to the package, then unsubscribe to all events
        //     if(packageDoc){
        //         // packageDoc.unbind('op')
        //         packageDoc.unsubscribe()
        //     }
            
        //     searchInput.hidden = !doc
        //     installedPkgsCont.hidden = !doc
        //     noPackageWarn.hidden = !!doc

        //     // subscribe to all new events
        //     // doc?.once("load", onPackageDocUpdated )
        //     doc?.on("op", onPackageDocUpdated )
        //     // doc?.subscribe(_ => console.log(_))
            
        //     packageDoc = doc

        //     onPackageDocUpdated()
        // })

        // /*
        // *  Called when the file system updates
        // */
        // let packageUID = null // important this is null on first run
        // const onFileSystemUpdate = _ => {
        
        //     const pkgAsset = findAsset(editor, isPkgJson)
                
        //     const uid = pkgAsset?.get('uniqueId')

        //     if(packageUID === uid) return

        //     // pkgAsset?.once('load', _ => {
        //         // console.log('ASSEWT LOADED')
        //         // There has been a change in the availability of the package.json

        //     const doc = uid && editor.call('realtime:connection').get('documents', uid.toString());     
        //     doc?.subscribe(err => !err && editor.emit('package:fs:change', doc))

        //     if(!doc) editor.emit('package:fs:change')
        //         // debugger
        //     // })

        //     // pkgAsset?.loadAndSubscribe()
        // }
    
        // /*
        // * This is a little hacky. 
        // * */
        // editor._hooks['assets:rename:system'] = editor._hooks['assets:rename']
        // editor._hooks['assets:rename'] = function(asset, name) {
        //     editor.call('assets:rename:system', asset, name)
        //     onFileSystemUpdate()
        // }

        // // Listen for any changes to the event registry
        // editor.assets.on('add', onFileSystemUpdate)
        // editor.assets.on('remove', onFileSystemUpdate)
        // editor.assets.on('move', onFileSystemUpdate)
        // editor.assets.on('clear', onFileSystemUpdate)
        // noPackageWarn.on('package:created', onFileSystemUpdate)
        // onFileSystemUpdate(null)

        this.packagePanels = []

        for(let i = 0 ; i < MAX_RESULTS ; i++ ){
            const packagePanel = new PackagePanel({ hidden: true })
            packagePanel.class.add('layers-settings-panel-layer-panel');
            packagePanel.on('click:remove', _ => {
                removePackage(packagePanel.module)
            })
            this.installedPkgsCont.append(packagePanel)
            this.packagePanels.push(packagePanel)
        }

    }

    updatePackages (deps) {

        // Hide initial panels incase theres less than MAX_RESULTS
        this.packagePanels.forEach(packagePanel => {
            packagePanel.hidden = true
            packagePanel.module = { name: '', description: '', version: '' }
        })

        this.deps = deps

        if(!deps) return

        // dedupe the keys
        const keys = [...new Set(Object.keys(deps))];

        keys.forEach(async (name, i) => {
            const packagePanel = this.packagePanels[i]
            packagePanel.module = await fetch(`https://registry.npmjs.com/${name}/${deps[name]}`).then(r => r.json())
            packagePanel.hidden = false
        })
    }

}
