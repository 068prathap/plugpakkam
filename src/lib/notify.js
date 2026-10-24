import 'server-only';
import { siteUrl } from '@/lib/site';

export async function notifyAdmin(lines) {
  const text = [...lines, `${siteUrl}/admin`].join('\n');
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    if (process.env.NODE_ENV === 'development') console.log(`[notify]\n${text}`);
    return;
  }

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
  } catch (error) {
    console.error(error);
  }
}
