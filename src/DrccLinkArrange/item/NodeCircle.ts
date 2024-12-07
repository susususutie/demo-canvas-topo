import Konva from 'konva'
import { Node, NodeCfg } from './Node'
import { Group } from 'konva/lib/Group'
import { Arrange } from '..'

type NodeCircleCfg = NodeCfg & { label?: string }

export class NodeCircle extends Node {
  type = 'circle'
  size = 48
  label = ''

  constructor(cfg: NodeCircleCfg) {
    super(cfg)
    this.label = cfg.label ?? ''
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
    const id = this.id,
      size = this.size,
      x = this.x,
      y = this.y,
      borderWidth = 2,
      label = this.label

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

    const circle = new Konva.Circle({
      id: `node-${id}-circle`,
      x: size / 2,
      y: size / 2,
      radius: size / 2 - borderWidth / 2,
      fill: '#fff',
      stroke: '#f0f1f5',
      strokeWidth: borderWidth,
      // shadowOffset: { x: 0, y: 0 },
      // shadowBlur: 4,
      // shadowColor: '#000',
      // shadowOpacity: 0.12
    })
    const text = new Konva.Text({
      id: `node-${id}-text`,
      x: (size - 48) / 2,
      y: (size - 20) / 2,
      width: 48,
      height: 20,
      text: label,
      fontSize: 14,
      fontFamily: 'PingFang SC, PingFang SC-Regular;',
      fill: '#3385FF',
      align: 'center',
      lineHeight: 20 / 14,
      listening: false,
    })

    group.add(circle)
    group.add(text)

    return group
  }
  afterAdd(arrange: Arrange) {
    this.#eventBind(arrange)
  }
  #eventBind(arrange: Arrange) {
    const group = this.rootShape
    if (!group) return

    group.on('mouseenter', () => {
      arrange.config.container.style.cursor = 'pointer'
      arrange.stopStageDraggable()
    })
    // group.on('mouseover', () => {
    //   // ev.evt.stopPropagation()
    //   // ev.evt.preventDefault()
    //   this.#arrange.config.container.style.cursor = 'pointer'
    //   this.#arrange.stopStageDraggable()
    //   // if ('tween' in group && typeof (group.tween as any)?.play === 'function') {
    //   //   (group.tween as any).play()
    //   // }
    // })
    group.on('mouseout', () => {
      arrange.config.container.style.cursor = 'default'
      arrange.resetStageDraggable()
      // if ('tween' in group && typeof (group.tween as any)?.reverse === 'function') {
      //   (group.tween as any).reverse()
      // }
    })
    group.on('click', ev => {
      arrange.emit('node:click', {
        item: this,
        shape: group,
        shapeName: 'node-group',
        x: ev.evt.x,
        y: ev.evt.y,
        canvasX: ev.evt.clientX,
        canvasY: ev.evt.clientY,
      })
    })
  }
  update(): void {}
}
