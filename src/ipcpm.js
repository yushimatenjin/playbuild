
import { findAsset, isBuildFile, isPkgJson, isWatchableFile } from './utils'
import { debounce } from 'debounce'


// When the build is updated re-parse in the editor to elinate any incorrect errors that are flagged
editor.on('assets:load', _ => {
  
  const build = findAsset(isBuildFile)
  if(build){

    build.on('file.hash:set', (a,b,c) => console.log('upate', a, b, c))

    // const doc = editor.realtime.connection.getDocument('assets', parseInt(build.get('id'), 10))
    // const onOp = debounce(_ => {
    //   console.log('Build File Op')
    //   editor.call('scripts:parse', build, _ => doc.once('op batch', onOp))
    // }, 2000) ;
    // doc.once('op batch', onOp)
  }
})