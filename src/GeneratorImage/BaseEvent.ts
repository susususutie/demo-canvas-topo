interface IBaseEvent {
  /**
   * 监听事件
   * @param type 事件类型
   * @param handler 事件回调
   */
  on(type: string, handler: (e:any) => void) :void;
  /**
   * 移除事件监听函数
   * @param type 事件类型
   * @param handler 监听函数
   */
  off(type: string, handler?: (e:any) => void) :void;
  /**
   * 触发事件
   * @param type 事件类型
   * @param payload 事件参数
   */
  emit(type: string, payload?: any): void;
}

export default class BaseEvent implements IBaseEvent {
  #_handlerMap: Map<string, Set<((e: any) => void)>> = new Map()

  emit(type: string, payload?: any) {
    const handlers = this.#_handlerMap.get(type)
    if (handlers && handlers.size > 0) {
      handlers.forEach(handler => handler({target:this, payload}))
    }
  }

  on(type: string, handler: (e: any) => void) {
    if (!this.#_handlerMap.has(type)) {
      this.#_handlerMap.set(type, new Set())
    }
    const handlers = this.#_handlerMap.get(type)!
    handlers.add(handler)
  }

  off(type: string, handler?: (e: any) => void) {
    // off all events
    if (type === '*') {
      this.#_handlerMap.clear()
      return
    }

    if (!this.#_handlerMap.has(type)) {
      return
    }
    const handlers = this.#_handlerMap.get(type)
    if(!handlers || !handlers.size) return

    if (!handler) {
      handlers.clear()
      this.#_handlerMap.delete(type)
      return
    }

    handlers.delete(handler)
    if (!handlers.size) {
      handlers.clear()
      this.#_handlerMap.delete(type)
    }
  }

}