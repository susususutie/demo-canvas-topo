export default class BaseEvent {
  _handlerMap: Map<string, ((e: any) => void)[]> = new Map()

  emit(type: string) {
    const handlers = this._handlerMap.get(type)
    if (handlers && handlers.length > 0) {
      handlers.forEach(handler => handler({target:this}))
    }
  }

  on(type: string, handler: (e: any) => void) {
    if (!this._handlerMap.has(type)) {
      this._handlerMap.set(type, [])
    }
    const handlers = this._handlerMap.get(type) as ((e: any) => void)[]
    handlers.push(handler)
  }

  off(type: string, handler?: (e: any) => void) {
    // off all events
    if (type === '*') {
      this._handlerMap.clear()
      return
    }

    if (!this._handlerMap.has(type)) {
      return
    }
    const handlers = this._handlerMap.get(type)
    if (handlers) {
      if (!handler) {
        this._handlerMap.delete(type)
        return
      }
      const newHandlers = handlers.filter(i => i !== handler)
      if (newHandlers.length > 0) {
        this._handlerMap.set(type, newHandlers)
      } else {
        this._handlerMap.delete(type)
      }
    }
  }

}