import { getZimSdk } from "./zimSdk";

let zimInstance = null;
let createPromise = null;

export function getZim() {
  if (!zimInstance) throw new Error("ZIM instance not created yet");
  return zimInstance;
}

export async function createZim() {
  if (zimInstance) return zimInstance;
  if (createPromise) return createPromise;

  createPromise = (async () => {
    const { ZIM } = await getZimSdk();
    const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
    if (!appID) {
      throw new Error("Missing/invalid VITE_ZEGO_APP_ID in frontend/.env");
    }

    // Guard for StrictMode: create only once per tab.
    // SDK note: create() only works first time, next time returns null (SDK behavior)
    ZIM.create({ appID });
    zimInstance = ZIM.getInstance();

    // basic handlers (avoid re-registering if createZim is called again)
    zimInstance.off("error");
    zimInstance.off("connectionStateChanged");

    zimInstance.on("error", (_zim, errorInfo) => {
      console.error("[ZIM error]", errorInfo?.code, errorInfo?.message, errorInfo);
    });

    zimInstance.on("connectionStateChanged", (_zim, { state, event }) => {
      console.log("[ZIM connectionStateChanged]", state, event);
    });

    return zimInstance;
  })();

  try {
    return await createPromise;
  } finally {
    createPromise = null;
  }
}

export async function loginZim({ userID, userName, token }) {
  if (!zimInstance) await createZim();

  if (typeof userID !== "string") throw new Error("loginZim: userID must be string");
  if (typeof token !== "string") throw new Error("loginZim: token must be string");

  const cleanUserID = userID.trim();
  const cleanUserName = (userName || cleanUserID).toString();

  // ✅ Zego doc: login(userInfo, token) :contentReference[oaicite:1]{index=1}
  const userInfo = { userID: cleanUserID, userName: cleanUserName };

  return zimInstance.login(userInfo, token);
}

export async function enterRoomZim({ roomID, roomName }) {
  if (!zimInstance) throw new Error("enterRoomZim: ZIM instance not created");
  const cleanRoomID = String(roomID ?? "").trim();
  if (!cleanRoomID) throw new Error("enterRoomZim: roomID is required");
  return zimInstance.enterRoom({ roomID: cleanRoomID, roomName: roomName ?? cleanRoomID });
}

export async function leaveRoomZim({ roomID }) {
  if (!zimInstance) return;
  const cleanRoomID = String(roomID ?? "").trim();
  if (!cleanRoomID) return;
  try {
    await zimInstance.leaveRoom(cleanRoomID);
  } catch (e) {
    console.warn("leaveRoomZim failed", e);
  }
}

export function logoutZim() {
  if (!zimInstance) return;
  try {
    zimInstance.logout();
  } catch (e) {
    console.warn("logoutZim failed", e);
  }
}
