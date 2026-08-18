import { prisma } from "../prismaClient.js";

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const EXPO_PUSH_MAX_BATCH = 100;

function isExpoPushToken(token) {
  return /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/.test(
    String(token || "").trim(),
  );
}

function chunkArray(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function sendExpoPushBatch(messages) {
  const response = await fetch(EXPO_PUSH_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });

  const payload = await response.json().catch(() => null);
  const tickets = Array.isArray(payload?.data) ? payload.data : [];

  if (!response.ok) {
    throw new Error(
      payload?.errors?.[0]?.message || `Expo push failed (${response.status})`,
    );
  }

  return tickets;
}

export async function sendPushAlertNotification(alertPayload) {
  const activeTokens = await prisma.devicePushToken.findMany({
    where: { is_active: true },
    select: { id: true, push_token: true },
  });

  if (activeTokens.length === 0) {
    return { sent: 0, deactivated: 0, total: 0 };
  }

  const validTokenRows = activeTokens.filter((row) =>
    isExpoPushToken(row.push_token),
  );
  const invalidRows = activeTokens.filter(
    (row) => !isExpoPushToken(row.push_token),
  );

  if (invalidRows.length > 0) {
    await prisma.devicePushToken.updateMany({
      where: { id: { in: invalidRows.map((row) => row.id) } },
      data: { is_active: false },
    });
  }

  if (validTokenRows.length === 0) {
    return {
      sent: 0,
      deactivated: invalidRows.length,
      total: activeTokens.length,
    };
  }

  const title = String(alertPayload?.title || "Campus alert").trim();
  const body = String(alertPayload?.body || alertPayload?.message || "").trim();

  const messageRows = validTokenRows.map((row) => ({
    row,
    message: {
      to: row.push_token,
      title,
      body,
      data: {
        ...alertPayload,
        source: "backend_push",
      },
      sound: "default",
      priority: "high",
      channelId: "default",
    },
  }));

  const chunks = chunkArray(messageRows, EXPO_PUSH_MAX_BATCH);
  const tokenIdsToDeactivate = [...invalidRows.map((row) => row.id)];
  let sentCount = 0;

  for (const chunk of chunks) {
    try {
      const tickets = await sendExpoPushBatch(
        chunk.map((item) => item.message),
      );

      tickets.forEach((ticket, index) => {
        if (!ticket || ticket.status !== "ok") {
          const detailsError = ticket?.details?.error;
          if (detailsError === "DeviceNotRegistered") {
            const rowId = chunk[index]?.row?.id;
            if (rowId) {
              tokenIdsToDeactivate.push(rowId);
            }
          }
          return;
        }

        sentCount += 1;
      });
    } catch (error) {
      console.error("Failed to send Expo push batch:", error?.message || error);
    }
  }

  const uniqueIds = [...new Set(tokenIdsToDeactivate)];
  if (uniqueIds.length > 0) {
    await prisma.devicePushToken.updateMany({
      where: { id: { in: uniqueIds } },
      data: { is_active: false },
    });
  }

  return {
    sent: sentCount,
    deactivated: uniqueIds.length,
    total: activeTokens.length,
  };
}
