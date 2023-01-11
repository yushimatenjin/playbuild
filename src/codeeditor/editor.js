
import { watchPkgJson } from '../utils/package'
import initializeBundler from '../codeeditor/bundler'
import PackageJsonDriver from './components/package-driver';
import NoPackageJson from './components/no-package';

/*
    Handle status updates and surface them in the code editor
*/
window.addEventListener('message', async ({ data }) => {
    switch(data?.message){
        case 'pcpm:build' :
            editor.call('status:log', `Compiling scripts...`)
            break
        case 'pcpm:build:done' :
            editor.call('status:log', `✔️ Code compiled`)
            break
        case 'pcpm:build:error' :
            const error = data.data[0]
            editor.call('status:error', `❌ Error ${error.text} @ ${error.location?.file}:${error.location?.line}:${error.location?.column}`)
            break
        case 'pcpm:enabled' :
  
            const enabled = data.data
            editor.call('status:log', `PCPM is ${enabled ? 'enabled' : 'disabled'}`)
    
            break
        default: break
    }
})


/*
    Watches for a package.json driver and update the UI and the compiler on change
*/
editor.once('assets:load', _ => {

    let driver, bundler
    const noPkgInfo = new NoPackageJson()

    const panel = new pcui.Panel({
        collapsed: false,
        collapsible: true,
        removable: false,
        headerText: 'LIBRARIES'
    })
    panel.append(noPkgInfo)

    editor.call('layout.left').append(panel)

    watchPkgJson(async pkg => {

        if(!!pkg) {

            if(!driver && !bundler) {
                driver = new PackageJsonDriver()
                bundler = initializeBundler()
                panel.append(driver.panel)
                if(noPkgInfo.parent) panel.remove(noPkgInfo)
            }
            console.log(pkg?.dependencies)
            driver.update(pkg?.dependencies)
            bundler.updateDeps(pkg?.dependencies, true)
            
        } else if (driver && bundler) {

            panel.remove(driver.panel)
            if(!noPkgInfo.parent) panel.append(noPkgInfo)

            driver.destroy()
            bundler.destroy()
            driver = null
            bundler = null
        }
    })
})
