import * as DiffMatchPatch from 'diff-match-patch-js-browser-and-nodejs/diff_match_patch.js';

console.log('sdfsfd', editor)

// editor.on('load', _ => {
  
    console.log('ATTACHING PACAKAGE MANAGER')

    const dmp = new DiffMatchPatch.diff_match_patch()
    // var script = document.createElement('script')
    // script.onload = _ => {
    //   window.dmp = new diff_match_patch()
    // }
    // script.src = 'https://unpkg.com/diff-match-patch-js-browser-and-nodejs@1.0.2/diff_match_patch_uncompressed.js'
    // document.head.appendChild(script)
    
    const diff2Op = diffs => {
      const ops = []
      for (var x = 0; x < diffs.length; x++) {
        switch (diffs[x][0]) {
          case 1:
            //insert
            ops.push(diffs[x][1]);
            break;
          case -1:
            // delete
            ops.push({d: diffs[x][1].length});
            break;
          case 0:
            // equals
            ops.push(diffs[x][1].length);
            break;
        }
      }
      return ops
    }
    
    const settingsArgs = {
      assets: editor.call('assets:raw'),
      entities: editor.call('entities:list'),
      history: editor.call('editor:history'),
      settings: editor.call('settings:projectUser'),
      projectSettings: editor.call('settings:project'),
      userSettings: editor.call('settings:user'),
      sceneSettings: editor.call('sceneSettings'),
      sessionSettings: editor.call('settings:session')
    };
    
    const ATTRIBUTES = [
      {
          observer: 'projectSettings',
          label: 'Package Json',
          path: 'packageJson',
          alias: 'project.packageJson',
          type: 'asset',
          args: {
              assetType: 'json'
          }
      },
      {
        type: 'container',
        alias: 'installed'
      },
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
        alias: 'results'
      },
    ]
    
    const panel = new pcui.BaseSettingsPanel({
      ...settingsArgs,
      projectSettings: editor.call('settings:projectPrivate'),
      attributes: ATTRIBUTES,
      headerText: 'PACKAGE MANANGER'
    })
    panel.style.position = "relative";
    
    editor.on('attributes:beforeClear', () => {
      panel.unlink();
      if (panel.parent) {
        panel.parent.remove(panel);
      }
    });
    
    editor.on('attributes:inspect[editorSettings]', () => {
      const root = editor.call('attributes.rootPanel');
      if (!panel.parent) root.append(panel);
    });
    
    const MAX_RESULTS = 5
    const MIN_SEARCH_NUM_CHAR = 3
    
    let currentSearch
    const results = Array.from(new Array(5)).map(_ => {
      const info = new pcui.InfoBox({
          icon: 'E218',
          title: '',
          text: ''
      })
      info.style.cursor = 'pointer'
      return info
    })
    
    let noPackageErrorPanel
    const showNoPackageJSONWarning = (root, isVisible) => {
      
      if(isVisible && noPackageErrorPanel){
        
        noPackageErrorPanel.parent.remove(noPackageErrorPanel)
        noPackageErrorPanel.destroy()
        noPackageErrorPanel = null
  
      } else if(isVisible && !noPackageErrorPanel) {
      
        noPackageErrorPanel = new pcui.InfoBox({
            icon: 'E218',
            title: 'No Package.json',
            text: 'A valid package.json must be included.'
        })
  
        const addPackageJsonBtn = new pcui.Button({
          text: 'Create package.json'
        })
  
        addPackageJsonBtn.once('click', async _ => {
  
            const pkg = {
              dependencies:{}
            }
  
            await editor.assets.createJson({
              name: 'package.json',
              preload: false,
              json: {
                dependencies:{}
              }
            })                 
        })
  
        noPackageErrorPanel.flex = true
        noPackageErrorPanel.error = true
  
        root.append(noPackageErrorPanel)
        // root.append(addPackageJsonBtn)
      }
    }
            
    editor.assets.on('load:progress', progress => {
      
      // load:progress fires periodically, but we only care when fully loaded
      if(progress < 1) return
      editor.assets.unbind('load:progress')
      
      const searchInput = panel._attributesInspector.getField('dep')
      const searchresultsCont = panel._attributesInspector.getField('results')
      const packageJsonInput = panel._attributesInspector.getField('packageJson')
      const installedPkgsCont = panel._attributesInspector.getField('installed')
      // installedPkgsCont.style.padding = '2px';
      
      packageJsonInput.on('change', value => {
        console.log(value)
          // if (!value) {
          //     // show import button again
          //     areaLightImportField.hidden = false;
          // } else {
          //     // hide import button
          //     areaLightImportField.hidden = true;
          // }
      });
      
  //     const installedPkgsPanel = new pcui.Panel({
  //       headerText: 'Installed Packages'
  //     })
      
  //     installedPkgsCont.append(installedPkgsPanel)
      
      // const installed = new pcui.InfoBox({
      //     icon: 'E218',
      //     title: 'three',
      //     text: 'some info of package'
      // })
      // installed.flex = true;
      // installed.append(new pcui.Button())
      // installedPkgsPanel.append(installed)
      
      /*
       *  Called when the file system updates
      */
      let packageUID
      const onSelectPackageJsonAsset = uid => {
        
        // const didHavePkg = !!pkgAsset
        
        // const pkgAsset = editor.assets.findOne(asset =>
        //   asset.get('type') === 'json' &&
        //   asset.get('name') === 'package.json' &&
        //   asset.get('path').length === 0 )
        
        // There has been a change in the availability of the package.json
        // if(!!pkgAsset !== hasPackage){ 
          // hasPackage = !!pkgAsset
          // const uniqueId = pkgAsset && pkgAsset.get('uniqueId');
          const pkgDoc = uid && editor.call('realtime:connection').get('documents', uid.toString());     
          editor.emit('pkg.json:available', pkgDoc)
        // }
  
      }
      
      let packageDoc
      editor.on('pkg.json:available', doc => {
        
        // If we had a previous reference to the package, then unsubscribe to all events
        if(packageDoc){
          packageDoc.unbind('op')
          packageDoc.unsubscribe()
        }
        
        searchInput.hidden = !doc
        installedPkgsCont.hidden = !doc
        showNoPackageJSONWarning(panel, !doc)
  
        // subscribe to all new events
        doc?.once("load", _ => showInstalledPackages() )
        doc?.on("op", _ => console.log('There has been a change to package.json'))
        doc?.subscribe(err => err && console.log(err))
        
        packageDoc = doc
      })
  
      // onFileSystemUpdate(null)
      
      /*
       * This is a little hacky. Ideally we don't have to watch file names as we have a direct refence
       * */
      editor._hooks['assets:rename:2'] = editor._hooks['assets:rename']
      editor._hooks['assets:rename'] = function(asset, name) {
          console.log('CAUGHT THE RENAME')
          editor.call('assets:rename:2', asset, name)
      }
      
      const hideResults = _ => {
        searchresultsCont.hidden = true
        results.forEach(info => {
          info.unbind()
          info.dom.onmousedown = null
          results.remove(info)
        });
      }
      
      const onPackageSelected = ({ name, version }) => {
        
        console.log('selected package is', name);
        const localPkg = JSON.parse(pkgDoc.data)
        localPkg.dependencies[name] = version
        
        // diff patch
        console.log(pkgDoc.data, JSON.stringify(localPkg, null, 4))
        var diff = dmp.diff_main(pkgDoc.data, JSON.stringify(localPkg, null, 4));      
        // dmp.diff_cleanupSemantic(diff);
  
        pkgDoc.submitOp(diff2Op(diff))
      }
        
      searchInput.on('change', async searchTerm => {
        if(currentSearch === searchTerm) return
        currentSearch = searchTerm
        if(searchTerm.length < MIN_SEARCH_NUM_CHAR) return;  
        
        const { objects } = await fetch(`https://registry.npmjs.com/-/v1/search?text=${searchTerm}&size=${MAX_RESULTS}`).then(r => r.json())
        
        if(currentSearch !== searchTerm) return
        
        results.hidden = false
        
        objects.forEach((object, i) => {
          const info = results[i]
          info.dom.onmousedown = e => {
            onPackageSelected(object.package)
            hideResults()
          }
          info.title = object.package.name
          info.text = object.package.description
          if(!info.parent) results.append(info)
        })
      })
      
      searchInput.on('blur', _ => {
        console.log('blur')
        hideResults()
        searchInput.value = ''
      })   
    })
    
    window.pcpm = panel
    
// })