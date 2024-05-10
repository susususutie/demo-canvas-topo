import Konva from 'konva'
import { Node, NodeCfg } from './Node'
import { Group } from 'konva/lib/Group'
import { Arrange } from '..'

const imgGreen =
  'data:image/png;base64,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'

type NodeNormalCfg = NodeCfg & { label?: string }

export class NodeNormal extends Node {
  type = 'normal'
  width = 72
  height = 72
  label = '' 

  constructor(cfg: NodeNormalCfg) {
    super(cfg)
    this.label = cfg.label ?? ''
    this.rootShape = this.draw()
  }

  getSize() {
    return [this.width, this.height] as [number, number]
  }
  
  getRect() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height + 16 * 2 + 4
    }
  }

  draw(): Group {
    const id = this.id, width = this.width, height = this.height, x = this.x, y = this.y, iconBgSize = 48, iconSize = 32, _label = this.label

    const group = new Konva.Group({
      id: `node-${id}-group`,
      name: 'node-group',
      x,
      y,
      offset: {
        x: width / 2,
        y: height / 2,
      },
      draggable: false,
    })
    const bg = new Konva.Rect({
      id: `node-${id}-bg`,
      x: 0,
      y: 0,
      width,
      height,
      fill: '#fff',
      cornerRadius: 4,
    })
    // TODO hover popup
    const topBg = new Konva.Rect({
      id: `node-${id}-topBg`,
      x: 0,
      y: 0,
      width,
      height,
      fill: '#3385ff',
      cornerRadius: 4,
      opacity: 0.1,
      listening: false,
    })
    const iconBg = new Konva.Rect({
      id: `node-${id}-iconBg`,
      x: (width - iconBgSize) / 2,
      y: (height - iconBgSize) / 2,
      width: iconBgSize,
      height: iconBgSize,
      stroke: '#E6E9F0',
      strokeWidth: 1,
      fill: '#FFFFFF',
      cornerRadius: 4,
      listening: false,
    })
    const imageObj = new Image()
    imageObj.src = imgGreen
    const icon = new Konva.Image({
      id: `node-${id}-icon`,
      x: (width - iconSize) / 2,
      y: (height - iconSize) / 2,
      image: imageObj,
      width: iconSize,
      height: iconSize,
      listening: false,
    })
  
    const action = new Konva.Rect({
      id: `node-${id}-action`,
      x: 0,
      y: height - 18,
      width,
      height: 18,
      fill: '#3385ff',
      cornerRadius: [0, 0, 4, 4],
      listening: true,
    })
    const actionTxt = new Konva.Text({
      id: `node-${id}-actionTxt`,
      x: 0,
      y: height - 18,
      width,
      height: 18,
      text: '开启',
      fontSize: 12,
      fontFamily: 'PingFang SC, PingFang SC-Regular;',
      fill: '#fff',
      align: 'center',
      lineHeight: 18 / 12,
      listening: false,
    })

    const label = new Konva.Rect({
      id: `node-${id}-label`,
      name: 'label',
      x: 0,
      y: height,
      width,
      height: 16 * 2 + 4,
    })
    const labelTxt = new Konva.Text({
      id: `node-${id}-labelText`,
      x: 0,
      y: height + 4,
      width,
      height: 16 * 2,
      text: _label,
      fontSize: 12,
      fontFamily: 'PingFang SC, PingFang SC-Regular;',
      fill: '#38415C',
      align: 'center',
      lineHeight: 16 / 12,
      listening: false,
    })

    const deleteBtn = new Konva.Rect({
      id: `node-${id}-delete`,
      name: 'node-delete',
      x: width,
      y: 0,
      width: 16,
      height: 16,
      offset: {x: 8, y: 8},
      fill: '#afb5c7',
      cornerRadius: 8
    })
    const deleteX = new Konva.Path({
      id: `node-${id}-labelText`,
      data: 'M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708',
      fill: '#fff',
      x: width,
      y: 0,
      width: 16,
      height: 16,
      offset: {x: 8, y: 8},
      listening: false
    })

    group.add(bg)
    group.add(topBg)
    group.add(iconBg)
    group.add(icon)
    group.add(action)
    group.add(actionTxt)
    group.add(labelTxt)
    group.add(label)
    group.add(deleteBtn)
    group.add(deleteX)

    this.shapesMap.set('node-delete', deleteBtn)
    this.shapesMap.set('action', action)
    this.shapesMap.set('label', label)

    return group
  }

  afterAdd(arrange: Arrange) {
    this.#eventBind(arrange)
  }

  #eventBind(arrange: Arrange) {
    const deleteBtn = this.shapesMap.get('node-delete')
    if (deleteBtn) {
      deleteBtn.on('click', (ev) => {
        ev.cancelBubble  = true
        arrange.emit('node:click', {
          item: this,
          shapeName: 'node-delete',
          shape: deleteBtn,
          x: ev.evt.x,
          y: ev.evt.y,
          canvasX: ev.evt.clientX,
          canvasY: ev.evt.clientY,
        })
      })
      deleteBtn.on('mouseenter', (ev) => {
        ev.cancelBubble  = true
        arrange.config.container.style.cursor = 'pointer'
        deleteBtn.fill('#ff3d55')
      })
      deleteBtn.on('mouseout', (ev) => {
        ev.cancelBubble  = true
        arrange.config.container.style.cursor = 'default'
        deleteBtn.fill('#afb5c7')
      })
    }

    const action = this.shapesMap.get('action')
    if (action) {
      action.on('mouseenter', (ev) => {
        ev.cancelBubble  = true
        arrange.config.container.style.cursor = 'pointer'
        arrange.emit('node:mouseenter', {
          item: this,
          shapeName: 'action',
          shape: action,
          x: ev.evt.x,
          y: ev.evt.y,
          canvasX: ev.evt.clientX,
          canvasY: ev.evt.clientY,
        })
      })
      action.on('mouseout', (ev) => {
        ev.cancelBubble  = true
        arrange.config.container.style.cursor = 'default'
        arrange.emit('node:mouseleave', {
          item: this,
          shapeName: 'action',
          shape: action,
          x: ev.evt.x,
          y: ev.evt.y,
          canvasX: ev.evt.clientX,
          canvasY: ev.evt.clientY,
        })
      })
    }

    const label = this.shapesMap.get('label')
    if (label) {
      label.on('mouseenter', (ev) => {
        ev.cancelBubble  = true
        arrange.config.container.style.cursor = 'pointer'
        arrange.emit('node:mouseenter', {
          item: this,
          shapeName: 'label',
          shape: label,
          x: ev.evt.x,
          y: ev.evt.y,
          canvasX: ev.evt.clientX,
          canvasY: ev.evt.clientY,
        })
      })
      label.on('mouseout', (ev) => {
        if (!arrange) return
        arrange.config.container.style.cursor = 'default'
        arrange.emit('node:mouseleave', {
          item: this,
          shapeName: 'label',
          shape: label,
          x: ev.evt.x,
          y: ev.evt.y,
          canvasX: ev.evt.clientX,
          canvasY: ev.evt.clientY,
        })
      })
    }

    const keyShape = this.rootShape
    if(keyShape) {
      keyShape.on('mouseenter', () => {
        arrange.config.container.style.cursor = 'default'
      })
      keyShape.on('mouseover', () => {
        arrange.config.container.style.cursor = 'default'
      })
      keyShape.on('mouseout', () => {
        arrange.config.container.style.cursor = 'default'
      })
      keyShape.on('click', ev => {
        arrange.emit('node:click', {
          item: this,
          shapeName: 'node-group',
          shape: keyShape,
          x: ev.evt.x,
          y: ev.evt.y,
          canvasX: ev.evt.clientX,
          canvasY: ev.evt.clientY,
        })
      })
    }
  }
  update(): void {

  }
}