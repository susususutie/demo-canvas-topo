import { Group } from 'konva/lib/Group'
import { IItemBase, ItemBase } from './Item'
import { Node } from './Node'

export type ComboCfg = {
  id: string,
  x?: number,
  y?: number,
  rows: {id: string; type: 'groupSingle' | 'groupAdd'}[][],
}

export interface ICombo extends IItemBase {
  itemType: 'combo'
  rootShape?: Group
  rows: {id: string; type: 'groupSingle' | 'groupAdd'}[][]
  itemMap: Map<string, Node>
  getSize(): readonly [number, number]
  posX(x: number): void
  getRect(): {x: number, y: number, width: number, height: number}
  afterAdd?(): void
}

export class Combo extends ItemBase implements ICombo {
  itemType = 'combo' as const
  rootShape?: Group
  rows: {id: string; type: 'groupSingle' | 'groupAdd'}[][]
  itemMap = new Map<string, Node>()

  constructor( cfg: ComboCfg) {
    super(cfg.id)
    this.x = cfg.x ?? 0
    this.y = cfg.y ?? 0
    this.rows = cfg.rows
  }
  getSize() {
    return [100, 60] as readonly [number, number]
  }
  posX(x: number) {
    this.x = x
    this.rootShape?.x(this.x)
  }
  pos(x: number, y: number) {
    this.x = x
    this.y = y
    this.rootShape?.x(this.x)
    this.rootShape?.y(this.y)
    // for (const [id, node] of this.itemMap) {
    //   node.relativePos()
    // }
  }
  getRect() {
    const [width, height] = this.getSize()
    return {
      x: this.x - width / 2,
      y: this.y - height / 2,
      width,
      height,
    }
  }
  afterAdd() {}
}