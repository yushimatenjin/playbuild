import { Panel } from '@playcanvas/pcui'

const ATTRIBUTES = module => [
    {
        type: 'label',
        label: module.description,
    },
]

export default class PackagePanel extends Panel {
    constructor({ name, version, description}){
        super({
            // assets: editor.call('assets:raw'),
            // entities: editor.call('entities:list'),
            // history: editor.call('editor:history'),
            // settings: editor.call('settings:projectUser'),
            // projectSettings: editor.call('settings:project'),
            // userSettings: editor.call('settings:user'),
            // sceneSettings: editor.call('sceneSettings'),
            // sessionSettings: editor.call('settings:session'),
            // attributes: ATTRIBUTES(module),
            headerText: name,
            collapsible: true,
            collapsed: true,
            removable: true
        })
        
        const info = new pcui.InfoBox({
            title: version,
            text: description
        })

        this.content.style.background = 'rgb(41, 53, 56)'

        this.append(info)
    }
}