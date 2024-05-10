import Konva from 'konva'
import { Node, NodeCfg } from './Node'
import { Group } from 'konva/lib/Group'
import { Arrange } from '..'

type NodeAddCfg = NodeCfg 

export class NodeAdd extends Node {
  type = 'add'
  size = 32

  constructor( cfg: NodeAddCfg) {
    super(cfg)
    this.rootShape = this.draw()
  }
  getSize() {
    return [this.size, this.size] as const
  }

  getRect() {
    return {
      x: this.x,
      y: this.y,
      width: this.size,
      height: this.size,
    }
  }

  draw(): Group {
    const id = this.id, size = 32, x = this.x, y = this.y, strokeWidth = 1, cornerRadius = 2

    const group = new Konva.Group({
      id: `node-${id}-group`,
      name: 'node-group',
      x,
      y,
      width: size,
      height: size,
      offset: {
        x: size / 2,
        y: size / 2,
      },
      draggable: false,
    })
    const outer = new Konva.Rect({
      id: `node-${id}-outer`,
      x: strokeWidth / 2,
      y: strokeWidth / 2,
      width: size - strokeWidth / 2,
      height: size - strokeWidth / 2,
      fill: '#fff',
      stroke: '#3385FF',
      strokeWidth,
      cornerRadius,
    })
    const hLine = new Konva.Line({
      id: `node-${id}-h`,
      points: [size / 2 - 6, size / 2, size / 2 + 6, size / 2],
      stroke: '#3385FF',
      strokeWidth: 2,
      lineCap: 'round',
      lineJoin: 'round',
      listening: false,
    })
    const vLine = new Konva.Line({
      id: `node-${id}-v`,
      points: [size / 2, size / 2 - 6, size / 2, size / 2 + 6],
      stroke: '#3385FF',
      strokeWidth: 2,
      lineCap: 'round',
      lineJoin: 'round',
      listening: false,
    })
    const text = new Konva.Text({
      id: `node-${id}-text`,
      x: 0,
      y: size + 6,
      text: id,
      fontSize: 14,
      fontFamily: 'PingFang SC, PingFang SC-Regular;',
      fill: '#3385FF',
      align: 'center',
      lineHeight: 20 / 14,
      listening: false,
    })

    group.add(outer)
    group.add(hLine)
    group.add(vLine)
    group.add(text)

    return group
  }

  afterAdd(arrange: Arrange) {
    this.#eventBind(arrange)
  }

  #eventBind(arrange: Arrange) {
    const group = this.rootShape
    if(!group) return

    group.on('click', ev => {
      arrange.emit('node:click', {
        item: this,
        shapeName: 'node-group',
        shape: group,
        x: ev.evt.x,
        y: ev.evt.y,
        canvasX: ev.evt.clientX,
        canvasY: ev.evt.clientY,
      })
    })
    group.on('mouseenter', () => {
      arrange.config.container.style.cursor = 'pointer'
      arrange.stopStageDraggable()
    })
    // group.on('mouseover', () => {
    //   this.#arrange.config.container.style.cursor = 'pointer'
    //   this.#arrange.stopStageDraggable()
    // })
    group.on('mouseout', () => {
      arrange.config.container.style.cursor = 'default'
      arrange.resetStageDraggable()
    })
  }

  update(): void {

  }
}