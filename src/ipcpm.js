import PackageManagerSettings from './package-manager';


editor.assets.on('load:progress', progress => {
  
  // load:progress fires periodically, but we only care when fully loaded
  if(progress < 1) return
  editor.assets.unbind('load:progress')
  
  // console.log('ATTACHING PACKAGE MANAGER')
  const panel = new PackageManagerSettings()
  // panel.on('package:selected', ({ name, version }) => {
  
  //   // console.log('selected package is', name);
  //   // const localPkg = JSON.parse(pkgDoc.data)
  //   // localPkg.dependencies[name] = version
    
  //   // // Find the diff between the two
  //   // var diff = dmp.diff_main(pkgDoc.data, JSON.stringify(localPkg, null, 4));      
  //   // // dmp.diff_cleanupSemantic(diff);
  
  //   // pkgDoc.submitOp(diff2Op(diff))
  
  // })

})
      
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


      

