const createPackageJson = _ => {
    return new Promise((resolve, reject) => {
        if (! editor.call('permissions:write')) return

        // args = args || { };

        var asset = {
            name: 'package.json',
            type: 'json',
            source: false,
            // parent: (args.parent !== undefined) ? args.parent : editor.call('assets:panel:currentFolder'),
            filename: 'package.json',
            file: new Blob(['{dependencies:{}}'], { type: 'application/json' }),
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        const onDone = r => {
            resolve()
            // const pp = editor.assets.findOne(asset =>
            //     asset.get('type') === 'json' &&
            //     asset.get('name') === 'package.json' &&
            //     asset.get('path').length === 0 )

            // const doc = editor.call('realtime:connection').get('documents', pp.get('uniqueId').toString())
            // doc.subscribe(err => !err && resolve(doc.data))
            
        }

        editor.call('assets:create', asset, onDone, true);
    })
}

export default class NoPackageJson extends pcui.Container {

    constructor(){
        super(arguments)

        const noPackageErrorPanel = new pcui.InfoBox({
            icon: 'E218',
            title: 'No Package.json found',
            text: 'A valid package.json must be included at the root of the asset registry'
        })

        const addPackageJsonBtn = new pcui.Button({
            icon: 'E120',
            text: 'Add package.json'
        })

        addPackageJsonBtn.on('click', async _ => {
            addPackageJsonBtn.enabled = false
            const pkg = await createPackageJson()
            // this.emit('package:created', pkg)
            addPackageJsonBtn.enabled = true
        })

        noPackageErrorPanel.flex = true
        noPackageErrorPanel.error = true

        this.append(noPackageErrorPanel)
        this.append(addPackageJsonBtn)
    }
} 