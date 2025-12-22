import { ZIMMessageType } from "../zego/zimConstants";

const PREFIX = "zego:chatCache:v1:";
const MAX_MESSAGES = 200;

const safeParse = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const getConversationCacheKey = ({ conversationType, conversationID }) =>
  `${PREFIX}${conversationType}:${conversationID}`;

export const serializeMessages = (messages) =>
  (messages ?? [])
    .filter((m) => m?.type === ZIMMessageType.Text)
    .slice(-MAX_MESSAGES)
    .map((m) => ({
      type: m.type,
      message: m.message,
      senderUserID: m.senderUserID ?? "",
      timestamp: m.timestamp ?? 0,
      messageID: m.messageID ?? "",
      localMessageID: m.localMessageID ?? "",
    }));

export const deserializeMessages = (data) =>
  (data ?? [])
    .filter(
      (m) => m && m.type === ZIMMessageType.Text && typeof m.message === "string",
    )
    .map((m) => ({
      type: ZIMMessageType.Text,
      message: m.message,
      senderUserID: m.senderUserID ?? "",
      timestamp: m.timestamp ?? 0,
      messageID: m.messageID || undefined,
      localMessageID: m.localMessageID || undefined,
    }));

export function loadCachedMessages({ conversationType, conversationID }) {
  const raw = localStorage.getItem(
    getConversationCacheKey({ conversationType, conversationID }),
  );
  const parsed = safeParse(raw);
  if (!parsed) return [];
  return deserializeMessages(parsed.messages);
}

export function saveCachedMessages({ conversationType, conversationID, messages }) {
  const payload = {
    updatedAt: Date.now(),
    messages: serializeMessages(messages),
  };
  localStorage.setItem(
    getConversationCacheKey({ conversationType, conversationID }),
    JSON.stringify(payload),
  );
}
