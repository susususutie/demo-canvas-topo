import { Shape } from 'konva/lib/Shape'
import type { Emitter, Handler } from 'mitt'
import mitt from 'mitt'
import { Group } from 'konva/lib/Group'
import { Node } from './item/Node'
import { Edge } from './item/Edge'
import { Arrange } from '.'

type ClickEvent<K> = {
  item: K
  shape: Shape | Group
  shapeName: string
  x: number
  y: number
  canvasX: number
  canvasY: number
}

// eslint-disable-next-line no-unused-vars
type EventHandler<K extends keyof EventMap> = (this: ArrangeEvent, ev: EventMap[K]) => unknown

type EventMap = {
  // 全局事件
  beforeupdate: {
    item: Arrange
    shape: Shape | Group
    shapeName: string
    x: number
    y: number
    canvasX: number
    canvasY: number
  }
  afterupdate: {
    item: Arrange
    shape: Shape | Group
    shapeName: string
    x: number
    y: number
    canvasX: number
    canvasY: number
  }
  // canvas 事件(即画布空白处)
  'canvas:click': ClickEvent<Arrange>
  'canvas:mouseenter': {
    item: Arrange
    shape: Shape | Group
    shapeName: string
    x: number
    y: number
    canvasX: number
    canvasY: number
  }
  'canvas:mousemove': {
    item: Arrange
    shape: Shape | Group
    shapeName: string
    x: number
    y: number
    canvasX: number
    canvasY: number
  }
  'canvas:mouseleave': {
    item: Arrange
    shape: Shape | Group
    shapeName: string
    x: number
    y: number
    canvasX: number
    canvasY: number
  }

  'node:click': ClickEvent<Node>
  'node:mouseenter': {
    item: Node
    shape: Shape | Group
    shapeName: string
    x: number
    y: number
    canvasX: number
    canvasY: number
  }
  'node:mousemove': {
    item: Node
    shape: Shape | Group
    shapeName: string
    x: number
    y: number
    canvasX: number
    canvasY: number
  }
  'node:mouseleave': {
    item: Node
    shape: Shape | Group
    shapeName: string
    x: number
    y: number
    canvasX: number
    canvasY: number
  }

  'edge:click': ClickEvent<Edge>
  'edge:mouseenter': {
    item: Edge
    shape: Shape | Group
    shapeName: string
    x: number
    y: number
    canvasX: number
    canvasY: number
  }
  'edge:mousemove': {
    item: Edge
    shape: Shape | Group
    shapeName: string
    x: number
    y: number
    canvasX: number
    canvasY: number
  }
  'edge:mouseleave': {
    item: Edge
    shape: Shape | Group
    shapeName: string
    x: number
    y: number
    canvasX: number
    canvasY: number
  }
}

export class ArrangeEvent {
  protected _event: Emitter<EventMap>

  constructor() {
    this._event = mitt<EventMap>()
  }

  on<K extends keyof EventMap>(type: K, handler: EventHandler<K>) {
    this._event.on(type, handler)
  }

  // 注意: 没有处理 once('foo', fn) 和 on('foo', fn) 同时使用和多次调用 once('foo', fn) 的问题
  once<K extends keyof EventMap>(type: K, handler: EventHandler<K>) {
    const wrappedHandler = (ev: EventMap[K]) => {
      handler.bind(this)(ev)
      this._event.off(type, wrappedHandler)
    }
    this._event.on(type, wrappedHandler)
  }

  off<Key extends keyof EventMap>(type: Key, handler?: Handler<EventMap[Key]>): void {
    this._event.off(type, handler)
  }

  emit<Key extends keyof EventMap>(type: Key, event: EventMap[Key]): void {
    this._event.emit(type, event)
  }

  offAll() {
    for (const [event] of this._event.all) {
      this._event.off(event as keyof EventMap)
    }
  }
}

// const event = new ArrangeEvent()
// event.once('node:click', (e) => {
//   console.log(e, e.item)
// })
