type MessagePrimitive = string | number | boolean | null;
type MessageValue = MessagePrimitive | MessageValue[] | MessageObject;
type MessageObject = { [key: string]: MessageValue };

export type MessageCatalog = MessageObject;

function isMessageValue(value: unknown): value is MessageValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isMessageValue);
  }

  if (typeof value === "object") {
    return Object.values(value).every(isMessageValue);
  }

  return false;
}

function isMessageObject(value: unknown): value is MessageObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every(isMessageValue);
}

export async function loadMessages(locale: string): Promise<MessageCatalog> {
  const loadedModule = (await import(`../messages/${locale}.json`)) as {
    default: unknown;
  };

  if (!isMessageObject(loadedModule.default)) {
    throw new Error(`Invalid message catalog for locale: ${locale}`);
  }

  return loadedModule.default;
}
