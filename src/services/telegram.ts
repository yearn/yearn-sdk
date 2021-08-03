import { Service } from "../common";
import { SdkError } from "../types";

export class TelegramService extends Service {
  private get chatId(): string {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!chatId) {
      throw new SdkError("Telegram Chat Id not set");
    }
    return chatId;
  }

  private get botId(): string {
    const botId = process.env.TELEGRAM_BOT_ID;
    if (!botId) {
      throw new SdkError("Telegram Bot Id not set");
    }
    return botId;
  }

  sendMessage(text: string) {
    const params = new URLSearchParams({ chat_id: this.chatId, text: text, disable_web_page_preview: "true" });
    const url = `https://api.telegram.org/bot${this.botId}/sendMessage?` + params;
    fetch(url);
  }
}
