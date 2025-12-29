import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { fetchZegoToken } from "./zego/token";
import {
  createZim,
  enterRoomZim,
  getZim,
  leaveRoomZim,
  loginZim,
  logoutZim,
} from "./zego/zimClient";
import {
  ZIMConnectionEvent,
  ZIMConversationType,
  ZIMMessagePriority,
  ZIMMessageType,
} from "./zego/zimConstants";
import ChatLayout from "./components/ChatLayout";
import Sidebar from "./components/Sidebar";
import ChatHeader from "./components/ChatHeader";
import MessageList from "./components/MessageList";
import MessageComposer from "./components/MessageComposer";
import { loadCachedMessages, saveCachedMessages } from "./storage/chatCache";
import { useProfile } from "../profile/useProfile";
import ProfilePanel from "../profile/ProfilePanel";
import { getZimSdk } from "./zego/zimSdk";

const LAST_CONV_KEY = "zego:lastConversation";

const toZegoUserID = (raw) =>
  String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._@-]/g, "_")
    .slice(0, 64);

const convKey = (type, id) => `${type}:${id}`;

const mergeUniqueMessages = (previous, incoming) => {
  const next = [...(previous ?? [])];
  const seen = new Set(
    next.map((m) => m?.messageID ?? m?.localMessageID).filter(Boolean),
  );
  for (const msg of incoming ?? []) {
    const id = msg?.messageID ?? msg?.localMessageID;
    if (id && seen.has(id)) continue;
    if (id) seen.add(id);
    next.push(msg);
  }
  return next;
};

export default function ChatPage() {
  const { user, logout, isAuthenticated, isLoading, getIdTokenClaims } =
    useAuth0();
  const [status, setStatus] = useState({ phase: "idle", error: "" });
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messagesByConv, setMessagesByConv] = useState(() => ({}));
  const [showProfile, setShowProfile] = useState(false);
  const saveTimersRef = useRef(new Map());
  const activeRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [typingStatus, setTypingStatus] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    activeRef.current = active;
    setTypingStatus(null);
  }, [active]);

  const appRoomID = useMemo(
    () => String(import.meta.env.VITE_ZEGO_ROOM_ID ?? "global"),
    [],
  );

  const email = user?.email ? String(user.email) : "";
  const userID = useMemo(() => toZegoUserID(email), [email]);
  const displayNameDefault = useMemo(() => {
    if (user?.name) return String(user.name);
    if (email) return String(email).split("@")[0];
    return userID;
  }, [email, user?.name, userID]);

  const { profile, updateProfile } = useProfile({
    userKey: userID,
    email,
    defaultName: displayNameDefault,
    defaultPhoto: user?.picture ? String(user.picture) : "",
  });

  const userName = displayNameDefault;
  const profilePhoto = profile?.photo || (user?.picture ? String(user.picture) : "");

  const isConnected = status.phase === "connected";

  const markConversationAsRead = async (conversation) => {
    if (!conversation) return;
    try {
      const zim = getZim();
      await zim.sendConversationMessageReceiptRead(
        conversation.id,
        conversation.type,
      );
    } catch {
      // ignore
    }
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversation.id && c.type === conversation.type
          ? { ...c, unreadCount: 0 }
          : c,
      ),
    );
  };

  const refreshConversationList = async () => {
    const zim = getZim();
    const result = await zim.queryConversationList(
      { count: 50 },
      {
        marks: [],
        conversationTypes: [ZIMConversationType.Peer, ZIMConversationType.Room],
        isOnlyUnreadConversation: false,
      },
    );

    const list = (result?.conversationList ?? []).map((c) => ({
      id: c.conversationID,
      type: c.type,
      title: c.conversationName || c.conversationID,
      subtitle: "",
      unreadCount: c.unreadMessageCount ?? 0,
      lastMessage: c.lastMessage ?? null,
    }));

    const current = activeRef.current;
    const adjusted = current
      ? list.map((c) =>
          c.id === current.id && c.type === current.type
            ? { ...c, unreadCount: 0 }
            : c,
        )
      : list;

    if (
      !adjusted.some(
        (c) => c.type === ZIMConversationType.Room && c.id === appRoomID,
      )
    ) {
      adjusted.unshift({
        id: appRoomID,
        type: ZIMConversationType.Room,
        title: "Community",
        subtitle: "",
        unreadCount: 0,
        lastMessage: null,
      });
    }

    setConversations(adjusted);
    return adjusted;
  };

  const loadHistory = async ({ id, type }) => {
    const zim = getZim();
    const history = await zim.queryHistoryMessage(id, type, {
      count: 50,
      reverse: true,
    });
    setMessagesByConv((prev) => ({
      ...prev,
      [convKey(type, id)]: mergeUniqueMessages(
        history?.messageList ?? [],
        prev[convKey(type, id)],
      ),
    }));
  };

  const setActiveConversation = async (conversation) => {
    setActive(conversation);
    try {
      localStorage.setItem(
        LAST_CONV_KEY,
        JSON.stringify({ id: conversation.id, type: conversation.type }),
      );
    } catch {
      // ignore
    }

    await loadHistory(conversation);
    await markConversationAsRead(conversation);

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversation.id && c.type === conversation.type
          ? { ...c, unreadCount: 0 }
          : c,
      ),
    );
  };

  const hydrateFromCache = (conversation) => {
    const key = convKey(conversation.type, conversation.id);
    setMessagesByConv((prev) => {
      if (prev[key]?.length) return prev;
      const cached = loadCachedMessages({
        conversationType: conversation.type,
        conversationID: conversation.id,
      });
      if (!cached.length) return prev;
      return { ...prev, [key]: cached };
    });
  };

  const handleIncoming = (type, fromConversationID, list) => {
    const key = convKey(type, fromConversationID);

    // Typing indicator detection for peer custom message.
    const typingMsg = (list ?? []).find(
      (m) => m.type === 200 && m.subType === 1 && m.message === "typing",
    );
    if (typingMsg) {
      const isActive =
        activeRef.current?.id === fromConversationID &&
        activeRef.current?.type === type;
      setTypingStatus({
        id: fromConversationID,
        type,
        label: "typing...",
      });
      setTimeout(() => {
        setTypingStatus((prev) =>
          prev &&
          prev.id === fromConversationID &&
          prev.type === type
            ? null
            : prev,
        );
      }, 2500);
      // do not add typing message into history
      return;
    }

    setMessagesByConv((prev) => ({
      ...prev,
      [key]: mergeUniqueMessages(prev[key], list),
    }));

    setConversations((prev) => {
      const lastMessage = list?.[list.length - 1] ?? null;
      const isActive =
        activeRef.current?.id === fromConversationID &&
        activeRef.current?.type === type;
      if (isActive) {
        markActiveAsRead().catch(() => {});
      }

      const updated = prev.map((c) => {
        if (c.id !== fromConversationID || c.type !== type) return c;
        return {
          ...c,
          lastMessage: lastMessage ?? c.lastMessage,
          unreadCount: isActive ? 0 : (c.unreadCount ?? 0) + 1,
        };
      });

      const exists = updated.some(
        (c) => c.id === fromConversationID && c.type === type,
      );
      if (exists) return updated;

      const title =
        type === ZIMConversationType.Room
          ? fromConversationID === appRoomID
            ? "Community"
            : fromConversationID
          : fromConversationID;

      return [
        {
          id: fromConversationID,
          type,
          title,
          subtitle: "",
          unreadCount: isActive ? 0 : 1,
          lastMessage,
        },
        ...updated,
      ];
    });
  };

  useEffect(() => {
    let cancelled = false;
    let conversationRefreshTimer = null;

    const boot = async () => {
      setStatus({ phase: "connecting", error: "" });

      try {
        if (!isAuthenticated) return;
        if (!email) throw new Error("Auth0 user email missing");
        if (!userID) throw new Error("Invalid userID generated from email");

        const idTokenClaims = await getIdTokenClaims();
        const idToken = idTokenClaims?.__raw;
        if (!idToken) throw new Error("Missing Auth0 ID token");

        const { token, userId: serverUserId } = await fetchZegoToken({
          authToken: idToken,
        });

        if (serverUserId && serverUserId !== userID) {
          throw new Error("Auth0 identity mismatch for Zego token");
        }
        const loginUserId = serverUserId || userID;

        await createZim();
        const zim = getZim();

        zim.off("peerMessageReceived");
        zim.off("roomMessageReceived");
        zim.off("connectionStateChanged");
        zim.off("tokenWillExpire");
        zim.off("conversationChanged");
        zim.off("messageReactionsChanged");
        zim.off("messageReceiptChanged");
        zim.off("messageRevokeReceived");

        zim.on("peerMessageReceived", (_zim, data) => {
          if (cancelled) return;
          handleIncoming(
            ZIMConversationType.Peer,
            data.fromConversationID,
            data.messageList,
          );
        });

        zim.on("roomMessageReceived", (_zim, data) => {
          if (cancelled) return;
          handleIncoming(
            ZIMConversationType.Room,
            data.fromConversationID,
            data.messageList,
          );
        });

        zim.on("messageReactionsChanged", (_zim, data) => {
          if (cancelled) return;
          const { reactions } = data;
          setMessagesByConv((prev) => {
            const next = { ...prev };
            for (const r of reactions ?? []) {
              const convKeyId = convKey(r.conversationType, r.conversationID);
              const existing = next[convKeyId] ?? [];
              next[convKeyId] = existing.map((m) =>
                m.messageID === r.messageID
                  ? { ...m, reactions: r.reactionList ?? [] }
                  : m,
              );
            }
            return next;
          });
        });

        zim.on("messageReceiptChanged", (_zim, data) => {
          if (cancelled) return;
          const { infos } = data;
          setMessagesByConv((prev) => {
            const next = { ...prev };
            for (const info of infos ?? []) {
              const key = convKey(info.conversationType, info.conversationID);
              next[key] = (next[key] ?? []).map((m) =>
                m.messageID === info.messageID
                  ? { ...m, receiptStatus: info.receiptStatus }
                  : m,
              );
            }
            return next;
          });
        });

        zim.on("messageRevokeReceived", (_zim, data) => {
          if (cancelled) return;
          const revoked = data.messageList ?? [];
          setMessagesByConv((prev) => {
            const next = { ...prev };
            for (const m of revoked) {
              const key = convKey(m.conversationType, m.conversationID);
              next[key] = (next[key] ?? []).map((msg) =>
                msg.messageID === m.messageID
                  ? {
                      ...msg,
                      message: "Message deleted",
                      revoked: true,
                      extendedData: "",
                      reactions: [],
                    }
                  : msg,
              );
            }
            return next;
          });
        });

        zim.on("conversationChanged", () => {
          if (cancelled) return;
          if (conversationRefreshTimer) clearTimeout(conversationRefreshTimer);
          conversationRefreshTimer = setTimeout(() => {
            refreshConversationList().catch(() => {});
          }, 250);
        });

        zim.on("connectionStateChanged", async (_zim, data) => {
          if (cancelled) return;
          if (
            data.event === ZIMConnectionEvent.ActiveLogin ||
            data.event === ZIMConnectionEvent.KickedOut
          ) {
            setStatus({
              phase: "duplicate",
              error: "Same email is already logged in on another tab/device.",
            });
            logoutZim();
            logout({ logoutParams: { returnTo: window.location.origin } });
          }
        });

        zim.on("tokenWillExpire", async () => {
          try {
            const renewedIdTokenClaims = await getIdTokenClaims();
            const renewedIdToken = renewedIdTokenClaims?.__raw;
            if (renewedIdToken) {
              const { token: newToken } = await fetchZegoToken({
                authToken: renewedIdToken,
              });
              await zim.renewToken(newToken);
            }
          } catch (e) {
            console.error("ZIM token renew failed", e);
          }
        });

        await loginZim({ userID: loginUserId, userName, token });
        if (cancelled) return;

        await enterRoomZim({ roomID: appRoomID, roomName: appRoomID });

        setStatus({ phase: "connected", error: "" });

        const list = await refreshConversationList();
        if (cancelled) return;

        let restored = null;
        try {
          const raw = localStorage.getItem(LAST_CONV_KEY);
          if (raw) restored = JSON.parse(raw);
        } catch {
          // ignore
        }

        const first =
          (restored &&
            list.find((c) => c.id === restored.id && c.type === restored.type)) ||
          list[0] ||
          null;

        if (first) {
          hydrateFromCache(first);
          await setActiveConversation(first);
        }
      } catch (e) {
        if (cancelled) return;
        setStatus({ phase: "error", error: e?.message || "Chat setup failed" });
      }
    };

    if (isAuthenticated && !isLoading) boot();

    return () => {
      cancelled = true;
      if (conversationRefreshTimer) clearTimeout(conversationRefreshTimer);
      leaveRoomZim({ roomID: appRoomID });
    };
  }, [
    appRoomID,
    email,
    getIdTokenClaims,
    isAuthenticated,
    isLoading,
    logout,
    userID,
    userName,
  ]);

  useEffect(() => {
    for (const c of conversations) {
      const key = convKey(c.type, c.id);
      const msgs = messagesByConv[key];
      if (!msgs || msgs.length === 0) continue;

      const existing = saveTimersRef.current.get(key);
      if (existing) clearTimeout(existing);

      const t = setTimeout(() => {
        saveTimersRef.current.delete(key);
        try {
          saveCachedMessages({
            conversationType: c.type,
            conversationID: c.id,
            messages: msgs,
          });
        } catch {
          // ignore
        }
      }, 350);

      saveTimersRef.current.set(key, t);
    }
  }, [conversations, messagesByConv]);

  useEffect(
    () => () => {
      for (const t of saveTimersRef.current.values()) clearTimeout(t);
      saveTimersRef.current.clear();
    },
    [],
  );

  useEffect(() => {
    // Mark messages as read when viewing a conversation to drive double-tick receipts.
    markActiveAsRead();
  }, [active, messagesByConv]);

  const startNewChat = async (raw) => {
    const id = toZegoUserID(raw);
    if (!id) return;

    const next = {
      id,
      type: ZIMConversationType.Peer,
      title: raw,
      subtitle: "",
      unreadCount: 0,
      lastMessage: null,
    };

    setConversations((prev) => {
      const exists = prev.some((c) => c.id === next.id && c.type === next.type);
      if (exists) return prev;
      return [next, ...prev];
    });

    await setActiveConversation(next);
  };

  const send = async (message) => {
    if (!active) return;
    const zim = getZim();
    const config = { priority: ZIMMessagePriority.Low, hasReceipt: true };
    const result = await zim.sendMessage(message, active.id, active.type, config);

    setMessagesByConv((prev) => {
      const key = convKey(active.type, active.id);
      return { ...prev, [key]: mergeUniqueMessages(prev[key], [result.message]) };
    });

    setConversations((prev) =>
      prev.map((c) =>
        c.id === active.id && c.type === active.type
          ? { ...c, lastMessage: result.message }
          : c,
      ),
    );
  };

  const markActiveAsRead = async () => {
    if (!active) return;
    try {
      const zim = getZim();
      await zim.sendConversationMessageReceiptRead(active.id, active.type);
    } catch {
      // ignore
    }
    setConversations((prev) =>
      prev.map((c) =>
        c.id === active.id && c.type === active.type ? { ...c, unreadCount: 0 } : c,
      ),
    );
  };

  const handleReact = async (msg, emoji) => {
    const zim = getZim();
    const existing = (msg.reactions ?? []).find((r) => r.reactionType === emoji);
    if (existing) {
      await zim.deleteMessageReaction(emoji, msg);
    } else {
      await zim.addMessageReaction(emoji, msg);
    }
  };

  const handleReply = (msg) => {
    setReplyTo({
      id: msg.messageID ?? msg.localMessageID,
      text: msg.message,
      sender: msg.senderUserID,
    });
  };

  const handleForward = async (msg) => {
    if (!active) return;
    await send({
      type: ZIMMessageType.Text,
      message: msg.message,
      extendedData: msg.extendedData ?? "",
    });
  };

  const handleDeleteForMe = (msg) => {
    if (!active) return;
    const key = convKey(active.type, active.id);
    setMessagesByConv((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).filter(
        (m) =>
          m.messageID !== msg.messageID &&
          m.localMessageID !== msg.localMessageID,
      ),
    }));
  };

  const handleDeleteForAll = async (msg) => {
    try {
      const zim = getZim();
      await zim.revokeMessage(msg);
      const key = convKey(active.type, active.id);
      setMessagesByConv((prev) => ({
        ...prev,
        [key]: (prev[key] ?? []).map((m) =>
          (m.messageID && msg.messageID && m.messageID === msg.messageID) ||
          (!msg.messageID &&
            m.localMessageID &&
            msg.localMessageID &&
            m.localMessageID === msg.localMessageID)
            ? {
                ...m,
                message: "Message deleted",
                revoked: true,
                extendedData: "",
                reactions: [],
              }
            : m,
        ),
      }));
    } catch {
      // ignore
    }
  };

  const handleSend = async (payload) => {
    const base = { ...payload };
    if (replyTo) {
      base.extendedData = JSON.stringify({
        ...(base.extendedData ? JSON.parse(base.extendedData) : {}),
        replyTo,
      });
    }
    await send(base);
    setReplyTo(null);
    await markActiveAsRead();
  };

  const handleUserSearch = async (query) => {
    setSearchError("");
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setSearchLoading(true);
      const idToken = (await getIdTokenClaims())?.__raw;
      if (!idToken) throw new Error("Missing Auth0 ID token for search");
      const url = new URL("/api/users", window.location.origin);
      url.searchParams.set("q", query);
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Search failed (${res.status}): ${text}`);
      }
      const data = await res.json();
      setSearchResults(data?.results ?? []);
    } catch (e) {
      setSearchError(e?.message || "Search failed");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const sendTyping = async () => {
    if (!active || active.type !== ZIMConversationType.Peer) return;
    if (typingTimeoutRef.current) return;
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 2500);

    try {
      const { ZIMMessageType, ZIMMessagePriority } = await getZimSdk();
      const zim = getZim();
      const typingMessage = {
        type: ZIMMessageType.Custom,
        message: "typing",
        subType: 1,
      };
      await zim.sendMessage(
        typingMessage,
        active.id,
        active.type,
        { priority: ZIMMessagePriority.Low },
      );
    } catch {
      // ignore
    }
  };

  const onLogout = () => {
    logoutZim();
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  if (isLoading) return <div className="p-6 text-white">Loading...</div>;
  if (!isAuthenticated) return <div className="p-6 text-white">Please login first.</div>;

  const subtitle =
    status.phase === "error"
      ? status.error
      : status.phase === "duplicate"
        ? status.error
        : status.phase === "connected"
          ? ""
          : "Connecting...";

  return (
    <>
      <ChatLayout
        sidebar={
          <Sidebar
            profile={profile}
            onEditProfile={() => setShowProfile(true)}
            conversations={conversations}
            active={active}
            onSelect={(c) => {
              hydrateFromCache(c);
              return setActiveConversation(c);
            }}
            onStartNewChat={startNewChat}
            isConnected={isConnected}
            typingStatus={typingStatus}
            onSearch={handleUserSearch}
            searchResults={searchResults}
            searchLoading={searchLoading}
            searchError={searchError}
          />
        }
        chatHeader={
          <ChatHeader
            title={active?.title ?? "Select a chat"}
            subtitle={subtitle}
            typingLabel={
              typingStatus &&
              active &&
              typingStatus.id === active.id &&
              typingStatus.type === active.type
                ? typingStatus.label
                : ""
            }
            photo={profilePhoto}
            onLogout={onLogout}
          />
        }
        messageList={
          status.phase === "error" ? (
            <div className="p-6">
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-white">
                <div className="font-semibold">Chat setup error</div>
                <div className="text-red-200 mt-2 break-words">{status.error}</div>
                <div className="text-purple-200 mt-3 text-sm">
                  Check `frontend/.env` and backend `/api/token`.
                </div>
              </div>
            </div>
          ) : !active ? (
            <div className="flex h-full items-center justify-center text-purple-200">
              Choose a chat from the left.
            </div>
          ) : (
            <>
              <MessageList
                messages={messagesByConv[convKey(active.type, active.id)] ?? []}
                selfUserID={userID}
                onReact={handleReact}
                onReply={handleReply}
                onForward={handleForward}
                onDeleteForMe={handleDeleteForMe}
                onDeleteForAll={handleDeleteForAll}
              />
              <div className="px-6 text-purple-200 text-sm">
                {typingStatus && active?.type === ZIMConversationType.Peer
                  ? `${active.title} is typing...`
                  : ""}
              </div>
            </>
          )
        }
        composer={
          active ? (
            <MessageComposer onSend={handleSend} disabled={!isConnected} onTyping={sendTyping} />
          ) : null
        }
        rightPanel={
          <div className="w-full h-full rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 text-sm text-purple-100 space-y-3">
            <div className="font-semibold mb-1">Info</div>
            <div className="text-xs text-purple-200">
              Signed in as <span className="font-semibold text-white">{user?.email || userID}</span>
            </div>
            <div className="text-xs text-purple-200">
              Current room: <span className="font-semibold text-white">{appRoomID}</span>
            </div>
            <div className="text-xs text-purple-200">
              Status: <span className="font-semibold text-white">{subtitle}</span>
            </div>
            <div className="text-xs text-purple-200">
              Tip: Long-press or click a message to react, reply, forward, or delete.
            </div>
          </div>
        }
      />
      {showProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="max-w-lg w-full">
            <ProfilePanel
            profile={profile}
            onSave={updateProfile}
            onClose={() => setShowProfile(false)}
          />
        </div>
        </div>
      )}
    </>
  );
}
