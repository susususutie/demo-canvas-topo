// Node 和 Edge 的基类
import type Arrange from '../Arrange'
import { Shape } from 'konva/lib/Shape'

export interface IItemBase {
  arrange: null | Arrange
  shapesMap: null | Map<string, Shape>
  destroyed: boolean
  id: string
  x: number
  y: number
  itemType: string
  type: string
  // getShape(name: string): Shape
  // getAllShape(): Shape[]
  draw(): void
  // afterDraw(): void
  update(): void
  // afterUpdate(): void
  destroy(): void
}

export class ItemBase implements IItemBase {
  destroyed = false
  arrange: null | Arrange = null
  shapesMap: Map<string, Shape>
  itemType = 'base'
  type = ''
  id = ''
  x = 0
  y = 0
  constructor(id: string) {
    this.id = id
    this.shapesMap = new Map()
  }
  draw(): void {}
  update(): void {}
  destroy(): void {
    this.arrange = null
    this.shapesMap.clear()
    this.destroyed = true
  }
}

