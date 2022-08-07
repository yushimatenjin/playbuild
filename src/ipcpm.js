// import PackageManagerSettings from './components/pcpm-settings';
import { findAsset, isBuildFile, isPkgJson, isWatchableFile } from './utils'
import { debounce } from 'debounce'

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

// When the build is updated re-parse in the editor to elinate any incorrect errors that are flagged
editor.on('assets:load', _ => {
  
  const build = findAsset(isBuildFile)
  if(build){

    const doc = editor.realtime.connection.getDocument('assets', parseInt(build.get('id'), 10))
    const onOp = debounce(_ => {
      console.log('Build File Op')
      editor.call('scripts:parse', build, _ => doc.once('op batch', onOp))
    }, 2000) ;
    doc.once('op batch', onOp)
  }
})

// window.addEventListener('message', ({ data }) => {
//   switch(data?.message){
//     case 'pcpm:enabled' :

//       const enabled = data.data

//       if(enabled){
//         editor.on('assets:scripts:add', onScriptAdded)
//         const pkg = findAsset(isPkgJson)
//         console.log(pkg)
//       } else {
//         editor.unbind('assets:scripts:add', onScriptAdded)
//       }

//       break
//     default: break
//   }
// })

// window.postMessage({ message: 'pcpm:editor-loaded', data: window.config.project })