export interface Message {
  message: MessageEnum,
  payload: any
}

export interface ContextMenuSwitchMessage extends Message {
  payload: boolean
}

export enum MessageEnum {
  ContextMenuSwitch = 'context_menu_switch',
}

export default class MessageBusService {
  public static sendContextMenuSwitchMessage(contextMenuState: boolean): void {
    const message: ContextMenuSwitchMessage = {
      message: MessageEnum.ContextMenuSwitch,
      payload: contextMenuState,
    };
    this.sendMessage(message);
  }

  private static sendMessage(message: Message): void {
    chrome.runtime.sendMessage(message);
  }
}
