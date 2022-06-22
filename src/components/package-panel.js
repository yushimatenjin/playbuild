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
            removable: true,
            hidden: true
        })
        
        this.info = new InfoBox({
            title: version,
            text: description,
            icon: 'E410'
        })

        this.content.style.background = 'rgb(41, 53, 56)'

        this.append(this.info)
    }

    set module({ name, version, description }){
        this.headerText = name
        this.info.title = version
        this.info.text = description
        this.info.collapsed = true
    }

    get module(){
        return { name: this.headerText, version: this.info.title, description: this.info.text }
    }
}