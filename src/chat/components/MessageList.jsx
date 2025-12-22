import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  lazy,
  Suspense,
} from "react";
import { ZIMMessageType } from "../zego/zimConstants";
import MessageBubble from "./MessageBubble";

const MessageActionsPopover = lazy(() => import("./MessageActionsPopover"));
const DeleteBottomSheet = lazy(() => import("./DeleteBottomSheet"));

export default function MessageList({
  messages,
  selfUserID,
  onReact,
  onReply,
  onForward,
  onDeleteForMe,
  onDeleteForAll,
}) {
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const [popover, setPopover] = useState({
    open: false,
    message: null,
    anchor: null,
  });
  const [sheet, setSheet] = useState({ open: false, message: null });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages?.length]);

  const rendered = useMemo(
    () => (messages ?? []).filter((m) => m?.type === ZIMMessageType.Text),
    [messages],
  );

  const openPopover = (message, anchorEl) => {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    setPopover({
      open: true,
      message,
      anchor: {
        top: rect.top + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX,
      },
    });
  };

  const closePopover = () => setPopover({ open: false, message: null, anchor: null });

  const handleDeleteRequest = (msg) => {
    setSheet({ open: true, message: msg });
    closePopover();
  };

  return (
    <div className="h-full flex flex-col relative">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-3"
      >
        {rendered.map((msg) => {
          const isSelf = msg.senderUserID === selfUserID;

          return (
            <MessageBubble
              key={msg.messageID ?? msg.localMessageID ?? `${msg.timestamp}`}
              msg={msg}
              isSelf={isSelf}
              selfUserID={selfUserID}
              onOpenPopover={(target) => openPopover({ ...msg, isSelf }, target)}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>

      <Suspense fallback={null}>
        {popover.open && (
          <MessageActionsPopover
            anchor={popover.anchor}
            message={popover.message}
            onClose={closePopover}
            onReact={(message, emoji) => {
              onReact?.(message, emoji);
              closePopover();
            }}
            onReply={(message) => {
              onReply?.(message);
              closePopover();
            }}
            onForward={(message) => {
              onForward?.(message);
              closePopover();
            }}
            onDeleteRequest={handleDeleteRequest}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {sheet.open && (
          <DeleteBottomSheet
            message={sheet.message}
            onClose={() => setSheet({ open: false, message: null })}
            onDelete={(scope) => {
              if (scope === "all") onDeleteForAll?.(sheet.message);
              else onDeleteForMe?.(sheet.message);
              setSheet({ open: false, message: null });
            }}
          />
        )}
      </Suspense>
    </div>
  );
}
