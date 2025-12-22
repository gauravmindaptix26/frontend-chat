import React from "react";

export default function ChatLayout({
  sidebar,
  chatHeader,
  messageList,
  composer,
  rightPanel,
}) {
  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-[#0f1535] via-[#191f48] to-[#1f0f2f] text-white">
      <div className="h-screen px-2 md:px-4 py-4">
        <div className="h-full flex gap-3 lg:gap-4">
          <aside className="w-[280px] md:w-80 hidden lg:flex flex-col gap-3">
            {sidebar}
          </aside>

          <main className="flex-1 min-w-0 flex flex-col gap-3">
            <div className="flex-1 min-h-0 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl shadow-purple-900/30 overflow-hidden">
              <div className="grid h-full grid-rows-[auto_1fr_auto]">
                {chatHeader}
                <div className="min-h-0 overflow-hidden">{messageList}</div>
                {composer}
              </div>
            </div>
          </main>

          <aside className="w-72 hidden 2xl:flex">{rightPanel ?? null}</aside>
        </div>
      </div>
    </div>
  );
}
