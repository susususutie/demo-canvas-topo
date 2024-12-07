import Konva from 'konva'
import { Edge, EdgeCfg } from './Edge'
import { IItemBase } from './Item'
import { Line } from 'konva/lib/shapes/Line'

type EdgeLineCfg = EdgeCfg

export interface IEdge extends IItemBase {
  itemType: 'edge'
}

export class EdgeLine extends Edge {
  type = 'line'
  keyShape: Line

  constructor(cfg: EdgeLineCfg) {
    super(cfg)
    this.keyShape = {} as Line
    this.draw()
  }
  draw(): void {
    const id = this.id
    const sourceRect = this.source.getRect()
    const targetRect = this.target.getRect()
    // const group = new Konva.Group({
    //   id: `edge-${config.id}-group`,
    //   // draggable: true,
    //   name: 'edge-group',
    // })
    const line = new Konva.Line({
      id: `edge-${id}`,
      points: [sourceRect.x + sourceRect.width / 2, sourceRect.y, targetRect.x - targetRect.width / 2, targetRect.y],
      stroke: '#3385FF',
      strokeWidth: 1,
      lineCap: 'round',
      lineJoin: 'round',
      hitStrokeWidth: 10,
      name: 'edge',
    })

    this.keyShape = line

    line.on('mouseenter', () => {
      if (!this.arrange) return
      this.arrange.config.container.style.cursor = 'pointer'
      this.arrange.stopStageDraggable()
    })
    line.on('mouseover', () => {
      if (!this.arrange) return
      this.arrange.config.container.style.cursor = 'pointer'
      this.arrange.stopStageDraggable()
    })
    line.on('mouseout', () => {
      if (!this.arrange) return
      this.arrange.config.container.style.cursor = 'default'
      this.arrange.resetStageDraggable()
    })
    line.on('click', ev => {
      if (!this.arrange) return
      this.arrange?.emit('edge:click', {
        item: this,
        shapeName: 'edge',
        shape: line,
        x: ev.evt.x,
        y: ev.evt.y,
        canvasX: ev.evt.clientX,
        canvasY: ev.evt.clientY,
      })
    })
  }
}
