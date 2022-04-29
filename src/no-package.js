const createPackageJson = _ => {
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

    const onDone = _ => {
        console.log('on  DONE')
    }

    editor.call('assets:create', asset, onDone, true);
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
            text: 'Add package.json'
        })

        addPackageJsonBtn.on('click', async _ => {
            addPackageJsonBtn.enabled = false
            createPackageJson()
            // await editor.assets.createJson({
            //     name: 'package.json',
            //     preload: false,
            //     exclude: true,
            //     onProgress: _ => {
            //         debugger
            //         console.log('CREQATE JSON UP_LAOD COMPLETE')
            //     },
            //     json: {
            //         name: config.project.name,
            //         dependencies:{}
            //     }
            // })  
            addPackageJsonBtn.enabled = true
        })

        noPackageErrorPanel.flex = true
        noPackageErrorPanel.error = true

        this.append(noPackageErrorPanel)
        this.append(addPackageJsonBtn)
    }
} 