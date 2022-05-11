import PackageManagerSettings from './components/pcpm-settings';
import { isWatchableFile } from './utils'


editor.on('assets:scripts:add', asset => {
  if(!isWatchableFile(asset)) return
  console.log(asset)
  asset.set('exclude', true)
  asset.set('preload', false)
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
