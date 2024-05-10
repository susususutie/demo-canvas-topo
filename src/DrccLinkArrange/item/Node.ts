
import { Group } from 'konva/lib/Group'
import { Combo } from './Combo'
import { IItemBase, ItemBase } from './Item'
import { Arrange } from '..'

export type NodeCfg = {
  id: string,
  combo?: Combo,
  x?: number,
  y?: number,
}

export interface INode extends IItemBase {
  itemType: 'node'
  rootShape?: Group
  combo?: Combo
  getSize(): readonly [number, number]
  posX(x: number): void
  pos(x: number, y: number): void
  relativePos(x: number, y: number): void
  getRect(): {x: number, y: number, width: number, height: number}
  afterAdd?(arrange: Arrange): void
  // nodeShape.tween = new Konva.Tween({
  //   node: nodeShape,
  //   scaleX: 1.1,
  //   scaleY: 1.1,
  //   easing: Konva.Easings.Linear,
  //   duration: 0.2,
  // });
}

export class Node extends ItemBase implements INode {
  itemType = 'node' as const
  rootShape?: Group
  combo?: Combo 

  constructor(cfg: NodeCfg) {
    super(cfg.id)
    this.x = cfg.x ?? 0
    this.y = cfg.y ?? 0
    this.combo = cfg.combo
  }

  pos(x: number, y: number) {
    this.x = x
    this.y = y
    this.rootShape?.x(this.x)
    this.rootShape?.y(this.y)
  }
  posX(x: number) {
    this.x = x
    this.rootShape?.x(this.x)
  }
  relativePos(x: number, y: number) {
    this.x = this.x + x
    this.y = this.y + y
    this.rootShape?.x(this.x)
    this.rootShape?.y(this.y)
  }
  getSize() {
    return [20, 20] as readonly [number, number]
  }

  getRect() {
    return {x: 0, y: 0, width: 0, height: 0}
  }

  afterAdd(arrange: Arrange) {}

}