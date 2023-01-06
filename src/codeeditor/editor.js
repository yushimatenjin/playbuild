
import { watchPkgJson } from '../utils/package'
import initializeBundler from '../codeeditor/bundler'
import PackageJsonDriver from './components/package-driver';

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

    watchPkgJson(async pkg => {

        if(!!pkg) {

            if(!driver && !bundler) {
                driver = new PackageJsonDriver()
                bundler = initializeBundler()
                // window.postMessage({message: "pcpm:enabled", data: true })
            }
            driver.update(pkg?.dependencies)
            bundler.updateDeps(pkg?.dependencies, true)
            
        } else if (driver && bundler) {

            initialize = false
            driver.destroy()
            bundler.destroy()
            driver = null
            bundler = null
        }
    })
})
