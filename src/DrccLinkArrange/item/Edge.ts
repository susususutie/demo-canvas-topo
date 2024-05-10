import { Line } from 'konva/lib/shapes/Line'
import { Combo } from './Combo'
import { IItemBase, ItemBase } from './Item'
import { Node } from './Node'
import { Group } from 'konva/lib/Group'
import { Shape } from 'konva/lib/Shape'

export type EdgeCfg = {
  id: string,
  source: Node | Combo,
  target: Node | Combo,
}

export interface IEdge extends IItemBase {
  itemType: 'edge'
  source: Node | Combo,
  target: Node | Combo,
  keyShape: Line | Group | Shape | null
}

export class Edge extends ItemBase implements IEdge {
  itemType = 'edge' as const
  source: Node | Combo
  target: Node | Combo
  keyShape: Line | Group | Shape | null = null
  
  constructor(cfg: EdgeCfg) {
    super(cfg.id)
    this.source = cfg.source
    this.target = cfg.target
  }
}