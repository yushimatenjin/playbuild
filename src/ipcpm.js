// import PackageManagerSettings from './package-manager';
import { isWatchableFile } from './utils'
import { watchPkgJson } from './utils/package'

editor.on('assets:scripts:add', asset => {
  if(!isWatchableFile(asset)) return
  asset.set('exclude', true)
  asset.set('preload', true)
})

console.log('watching package')
watchPkgJson(pkg => {
  console.log('Package State changed', pkg)
  // if(!pkg)
  // else
})

// editor.assets.on('load:progress', progress => {
  
//   // load:progress fires periodically, but we only care when fully loaded
//   if(progress < 1) return
//   editor.assets.unbind('load:progress')
  
  // console.log('ATTACHING PACKAGE MANAGER')
  // const panel = new PackageManagerSettings()

  // editor.on('attributes:beforeClear', () => {
  //   panel.unlink();
  //   if (panel.parent) {
  //       panel.parent.remove(panel);
  //   }
  // });

  // editor.on('attributes:inspect[editorSettings]', () => {
  //     const root = editor.call('attributes.rootPanel');
  //     if (!panel.parent) root.append(panel);
  // });
    
  // panel.on('package:selected', ({ name, version }) => {
  
  //   // console.log('selected package is', name);
  //   // const localPkg = JSON.parse(pkgDoc.data)
  //   // localPkg.dependencies[name] = version
    
  //   // // Find the diff between the two
  //   // var diff = dmp.diff_main(pkgDoc.data, JSON.stringify(localPkg, null, 4));      
  //   // // dmp.diff_cleanupSemantic(diff);
  
  //   // pkgDoc.submitOp(diff2Op(diff))
  
  // })

// })
      
      // const searchresultsCont = panel._attributesInspector.getField('results')
      // const packageJsonInput = panel._attributesInspector.getField('packageJson')
      // const installedPkgsCont = panel._attributesInspector.getField('installed')
      // installedPkgsCont.style.padding = '2px';
      
      
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


      

