
import { findAsset, isBuildFile } from './utils/utils'

// When the build is updated re-parse in the editor to elinate any incorrect errors that are flagged
editor.on('assets:load', _ => {
  
  const build = findAsset(isBuildFile)
  build?.on('file.hash:set', _ => editor.call('scripts:parse', build))

})