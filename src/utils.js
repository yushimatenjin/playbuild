import path from 'path-browserify';

export const diff2Op = diffs => {
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

const PACKAGE_JSON_NAME = 'package.json'
const BUILD_DIR_NAME = '.pcpm'
const BUILD_FILE_NAME = 'built.js'
const BANNER = '/* BUILT WITH PCPM */'

export const isPkgJson = asset =>
  asset.get('type') === 'json' &&
  asset.get('name') === PACKAGE_JSON_NAME &&
  asset.get('path').length === 0

export const isAmmo = asset =>
  asset.get('type') === 'script' &&
  (asset.get('name') === 'ammo.js' || asset.get('name') === 'ammo.wasm.js')

export const isBuildDir = asset =>
  asset.get('type') === 'folder' &&
  asset.get('name') === BUILD_DIR_NAME &&
  asset.get('path').length === 0

export const isBuildFile = (asset, editor) =>
  asset.get('type') === 'script' && // It's a script
  asset.get('name') === BUILD_FILE_NAME &&// with the right name
  asset.get('path').length === 1 && // that has one parent
  editor.call('assets:get', asset.get('path')[0]).get('name') === BUILD_DIR_NAME // called $BUILD_DIR_NAME

export const findAsset = (editor, search) => editor.call('assets:findOne', asset => search(asset, editor))?.[1]

export const getBuildDir = editor => {

  return new Promise((resolve, reject) => {

    const buildDir = findAsset(editor, isBuildDir)
    if(buildDir) {
      resolve(buildDir)
      return
    }

    if (!editor.call('permissions:write')) reject();

    const asset = {
      name: BUILD_DIR_NAME,
      type: 'folder',
      source: true,
      preload: false,
      data: null,
      scope: {
          type: 'project',
          id: config.project.id
      }
    };

    editor.call('assets:create', asset, (err, assetId) => {
      if(err) reject(err)
      else {

        var asset = editor.call('assets:get', assetId);
        if (asset) {
            resolve(asset);
        } else {
            editor.once('assets:add[' + assetId + ']', asset => resolve(asset));
        }
      }
    }, true);
  })
}

export const getBuildFile = (editor, content = BANNER) => {

  return new Promise(async (resolve, reject) => {

    const buildFile = findAsset(editor, isBuildFile)
    if(buildFile) {
      resolve(buildFile)
      return
    }

    if (!editor.call('permissions:write')) reject();

    const buildDir = await getBuildDir(editor)

    const selectedAsset = editor.call('assets:selected')?.[0]

    editor.call('assets:create:script', {
      filename: BUILD_FILE_NAME,
      boilerplate: false,
      content,
      parent: buildDir, 
      noSelect: true, // This is ignored
      callback: _ => {

        setTimeout(function () {
          editor.call('tabs:temp:lock');
          selectedAsset ? editor.call('files:select', selectedAsset.get('id')) : editor.call('files:deselectAll')
          editor.call('tabs:temp:unlock');
        }, 20 )

        resolve(findAsset(editor, isBuildFile))
      }
    })

    // editor.call('assets:create:script', {
    //   filename: BUILD_FILE_NAME,
    //   boilerplate: false,
    //   content: '/* BUILT WITH PCPM */',
    //   parent: null, 
    //   noSelect: true,
    //   callback: asset => resolve(asset)
    // })
  })
}

export const resolvePath = (asset, altPath) => {
  const relativePath = (altPath ?? asset.get('path'))
    .map(id => editor.call('assets:get', id).get('name')).join('/')
  return path.resolve('/' + relativePath + '/' + asset.get('file.filename'))
}
