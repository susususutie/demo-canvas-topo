type TrueNodeId = string
enum NodeTypeEnum {
  START = 'v_start',
  VIRTUAL = 'v_mid',
  END = 'v_end',
  /** ? 自定义节点 */
  PAUSE = 'r_p_paused',
  /** 等待节点 */
  WAITING = 'r_p_waitting',
  /** 网络检查节点 */
  NET = 'r_p_net_check',
  /** 各类数据库 */
  DM_DB = 'r_db_dm',
  GENERAL = 'r_general',
}

type EnumToUnion<T extends Record<string, string | number>> = keyof {
  [Prop in keyof T as `${T[Prop]}`]: Prop
}

type NodeType = EnumToUnion<typeof NodeTypeEnum>
 
type NodeId= 'arrange_start' | 'arrange_end' |
  `${number}_start`| `${number}_end`|
  `${number}_${number}_start`| `${number}_${number}_end`|
  TrueNodeId
type ApiNode = {
  nodeid: NodeId,
  type: NodeType,
  name: string,
  x: number,
  y: number,
  node_status: number,
  bussiness_type: number,
  contain_virtual: boolean,
  custom_step_enable: boolean,
  asset_type?: string,
  asset_id?: number,
  relation_id?: number,
  /** 有 pair_id 则为容灾对, 容灾对可能聚合展示也可能分开展示其中一个资产 */
  pair_id?: number,
  strategy_configs?: {
    strategy_status: null | number,
    strategy_suffix: string,
    strategy_name: null | string,
  },
}
type ApiLink = {
  source: NodeId,
  target: NodeId,
  link_status: number
}
type Rows = TrueNodeId[]
type ApiRoute = {
  type: 'grid',
  data: Rows[]
}
export type ApiRoutes = ApiRoute[]

type Result = {
  group_id: number,
  topology_status: number,
  nodes: ApiNode[],
  links: ApiLink[],
  routes: ApiRoutes
}

export const mock : Result= {
  'group_id': 242,
  'topology_status': 0,
  'nodes': [
    {
      'nodeid': 'arrange_start',
      'type': 'v_start',
      'name': '开始',
      'x': 0,
      'y': 0,
      'node_status': 0,
      'bussiness_type': 0,
      'contain_virtual': false,
      'custom_step_enable': false
    },
    {
      'nodeid': '0_start',
      'type': 'v_mid',
      'name': '0_start',
      'x': 1,
      'y': 0,
      'node_status': 0,
      'bussiness_type': 0,
      'contain_virtual': false,
      'custom_step_enable': false
    },
    {
      'nodeid': '0_end',
      'type': 'v_mid',
      'name': '0_end',
      'x': 4,
      'y': 0,
      'node_status': 0,
      'bussiness_type': 0,
      'contain_virtual': false,
      'custom_step_enable': false
    },
    {
      'nodeid': '0_0_start',
      'type': 'v_mid',
      'name': '0_0_start',
      'x': 1,
      'y': 0,
      'node_status': 0,
      'bussiness_type': 0,
      'contain_virtual': false,
      'custom_step_enable': false
    },
    {
      'nodeid': '242:db:123:13072',
      'type': 'r_db_dm',
      'name': '达梦数据库7-113',
      'x': 2,
      'y': 0,
      'asset_type': 'db',
      'asset_id': 124,
      'relation_id': 13073,
      'pair_id': 6508,
      'node_status': 0,
      'bussiness_type': 0,
      'contain_virtual': false,
      'strategy_configs': {
        'strategy_status': null,
        'strategy_suffix': '',
        'strategy_name': null
      },
      'custom_step_enable': false
    },
    {
      'nodeid': '242:db:124:13073',
      'type': 'r_db_dm',
      'name': '达梦数据库7-112',
      'x': 3,
      'y': 0,
      'asset_type': 'db',
      'asset_id': 123,
      'relation_id': 13072,
      'pair_id': 6508,
      'node_status': 0,
      'bussiness_type': 0,
      'contain_virtual': false,
      'strategy_configs': {
        'strategy_status': null,
        'strategy_suffix': '',
        'strategy_name': null
      },
      'custom_step_enable': false
    },
    {
      'nodeid': '0_0_end',
      'type': 'v_mid',
      'name': '0_0_end',
      'x': 4,
      'y': 0,
      'node_status': 0,
      'bussiness_type': 0,
      'contain_virtual': false,
      'custom_step_enable': false
    },
    {
      'nodeid': 'arrange_end',
      'type': 'v_end',
      'name': '结束',
      'x': 5,
      'y': 0,
      'node_status': 0,
      'bussiness_type': 0,
      'contain_virtual': false,
      'custom_step_enable': false
    }
  ],
  'routes': [
    {
      'type': 'grid',
      'data': [
        [
          '242:db:123:13072',
          '242:db:124:13073'
        ]
      ]
    }
  ],
  'links': [
    {
      'source': '0_0_start',
      'target': '242:db:123:13072',
      'link_status': 0
    },
    {
      'source': '242:db:123:13072',
      'target': '242:db:124:13073',
      'link_status': 0
    },
    {
      'source': '242:db:124:13073',
      'target': '0_0_end',
      'link_status': 0
    },
    {
      'source': '0_start',
      'target': '0_0_start',
      'link_status': 0
    },
    {
      'source': '0_0_end',
      'target': '0_end',
      'link_status': 0
    },
    {
      'source': 'arrange_start',
      'target': '0_start',
      'link_status': 0
    },
    {
      'source': '0_end',
      'target': 'arrange_end',
      'link_status': 0
    }
  ]
}
