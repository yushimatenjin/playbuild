import { Panel, InfoBox } from '@playcanvas/pcui'

const ATTRIBUTES = module => [
    {
        type: 'label',
        label: module.description,
    },
]

export default class PackagePanel extends Panel {
    constructor({ name, version, description}){
        super({
            headerText: name,
            collapsible: true,
            collapsed: true,
            removable: true
        })
        
        const info = new InfoBox({
            title: version,
            text: description,
            icon: 'E410'
        })

        this.content.style.background = 'rgb(41, 53, 56)'

        this.append(info)
    }
}