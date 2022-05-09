// import NoPackageJson from './no-package';
import * as DiffMatchPatch from 'diff-match-patch-js-browser-and-nodejs/diff_match_patch.js';
import { diff2Op, findAsset } from '../utils';
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

    constructor(pkg){
        super({
            collapsed: false,
            collapsible: true,
            removable: false,
            headerText: 'PACKAGES'
        })

        // this.style.position = "relative";
        const connection = editor.call('realtime:connection')
        let packageDoc = connection.get('assets', pkg.get('id'))
        let currentSearch
        const dmp = new DiffMatchPatch.diff_match_patch()
        const searchInput = new TextInput({keyChange: true, placeholder: 'Add Dependency'}) //this._attributesInspector.getField('dep')
        const resultsCont = new Container({ hidden: true }) //this._attributesInspector.getField('results')
        const installedPkgsCont = new Container()//this._attributesInspector.getField('installed')
        // const noPackageWarn = new NoPackageJson()

        this.append(searchInput)
        this.append(resultsCont)
        this.append(installedPkgsCont)
        // this.append(noPackageWarn)
        installedPkgsCont.style.margin = '3px 10px'

        const results = Array.from(new Array(MAX_RESULTS)).map(_ => {
            const info = new InfoBox({
                icon: 'E218',
                title: '',
                text: ''
            })
            info.style.cursor = 'pointer'
            resultsCont.append(info)
            return info
        })

        const updatePackageJson = newPkg => {

            if(!packageDoc) return

            // Optimistically render the local packages assuming the operation succeeds

            // Find the diff between the two
            var diff = dmp.diff_main(packageDoc.data, JSON.stringify(newPkg, null, 4));      
            // dmp.diff_cleanupSemantic(diff);
            
            packageDoc.submitOp(diff2Op(diff))
        }
  
        const addPackage = ({ name, version }) => {
            
            const localPkg = JSON.parse(packageDoc.data)
            localPkg.dependencies = { ...localPkg.dependencies, [name]: version }
            
            updatePackageJson(localPkg)
        }

        const removePackage = ({ name }) => {

            const localPkg = JSON.parse(packageDoc.data)
            delete localPkg.dependencies?.[name]
            
            updatePackageJson(localPkg)
        }

        const showInstalledPackages = _ => console.log("INSTALLED PACKAGES CALLED")

        searchInput.on('change', async searchTerm => {
            if(currentSearch === searchTerm) return
            currentSearch = searchTerm
            if(searchTerm.length < MIN_SEARCH_NUM_CHAR) return;  
            
            const { objects } = await fetch(`https://registry.npmjs.com/-/v1/search?text=${searchTerm}&size=${MAX_RESULTS}`).then(r => r.json())
            
            if(currentSearch !== searchTerm) return
            
            resultsCont.hidden = false
            
            objects.forEach((object, i) => {
                const info = results[i]
                info.dom.onmousedown = e => {
                    searchInput.value = ''
                    searchInput.blur()
                    resultsCont.hidden = true
                    addPackage(object.package)
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
    }

    updatePackages(pkg){
        console.log('update', pkg)
    }
}
