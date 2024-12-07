import Konva from 'konva'
import { Combo, ComboCfg } from './Combo'
import { Group } from 'konva/lib/Group'
import { NodeAdd } from './NodeAdd'
import { NodeNormal } from './NodeNormal'

export class ComboNormal extends Combo {
  type = 'normal'
  #gapH = 100
  #gapV = 40
  _rows: any[][]

  constructor(cfg: ComboCfg) {
    super(cfg)
    this._rows = cfg.rows
  }

  getSize() {
    const rows = this._rows.length
    const maxCols = Math.max(...this._rows.map(row => row.length))
    return [(maxCols + 1) * this.#gapH, rows * 72 + (rows - 1) * this.#gapV] as const
  }

  draw(): Group {
    const [width, height] = this.getSize()
    const id = this.id,
      rect = { width, height, x: this.x, y: this.y },
      rows = this.rows

    const group = new Konva.Group({
      id: `node-${id}-group`,
      name: 'group-group',
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      offset: {
        x: rect.width / 2,
        y: rect.height / 2,
      },
      draggable: false,
      // listening: false,
    })

    this.rootShape = group

    if (this.arrange?.config.dev) {
      const border = new Konva.Rect({
        id: `node-${id}-border`,
        name: 'group-border',
        x: 0,
        y: 0,
        width: rect.width,
        height: rect.height,
        draggable: false,
        listening: false,
        stroke: 'red',
      })
      group.add(border)
    }

    // edges in group
    const axiosY = rows.map(row => row[0].rect.y)
    const startYMax = Math.max(...axiosY)
    const startYMin = Math.min(...axiosY)
    const startV = new Konva.Line({
      id: `edge-${id}-startV`,
      points: [0, startYMin + rect.height / 2, 0, startYMax + rect.height / 2],
      stroke: '#3385FF',
      strokeWidth: 1,
      lineCap: 'round',
      lineJoin: 'round',
      hitStrokeWidth: 10,
      name: 'edge',
    })
    const endV = new Konva.Line({
      id: `edge-${id}-endV`,
      points: [rect.width, startYMin + rect.height / 2, rect.width, startYMax + rect.height / 2],
      stroke: '#3385FF',
      strokeWidth: 1,
      lineCap: 'round',
      lineJoin: 'round',
      hitStrokeWidth: 10,
      name: 'edge',
    })
    group.add(startV)
    group.add(endV)
    axiosY.forEach(y => {
      const h = new Konva.Line({
        // id: `edge-${id}-endV`,
        points: [0, y + rect.height / 2, rect.width, y + rect.height / 2],
        stroke: '#3385FF',
        strokeWidth: 1,
        lineCap: 'round',
        lineJoin: 'round',
        hitStrokeWidth: 10,
        name: 'edge',
      })
      group.add(h)
    })

    rows.forEach(row => {
      row.forEach(item => {
        switch (item.type) {
          case 'groupAdd': {
            const nodeInstance = new NodeAdd({
              id: item.id,
              x: item.rect.x,
              y: item.rect.y + rect.height / 2,
              combo: this,
            })
            this.itemMap.set(item.id, nodeInstance)
            group.add(nodeInstance.group)
            break
          }
          case 'groupSingle': {
            const nodeInstance = new NodeNormal({
              id: item.id,
              x: item.rect.x,
              y: item.rect.y + rect.height / 2,
              label: item.id,
              combo: this,
            })
            this.itemMap.set(item.id, nodeInstance)

            group.add(nodeInstance.group)
            break
          }
        }
      })
    })

    return group
  }

  update(): void {}
}
