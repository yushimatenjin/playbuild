import PackageManagerSettings from './components/pcpm-settings';
import { isWatchableFile } from './utils'


editor.on('assets:scripts:add', asset => {
  if(!isWatchableFile(asset)) return
  asset.set('exclude', true)
  asset.set('preload', false)
})

window.addEventListener('message', ({ data }) => {
  switch(data?.message){
    case 'pcpm:build' :
        // rebuild(data.data)
        break
    case 'pcpm:enabled' :
        console.log('pcpm:enabled', data.data)
        break
    default: break
  }
})

const panel = new PackageManagerSettings()

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

window.postMessage({ message: 'pcpm:editor-loaded', data: window.config.project })