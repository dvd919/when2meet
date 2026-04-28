import { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send } from 'lucide-react';
import { useScheduling } from '../src/SchedulingContext';
import { getAIReasoning, chatWithAI, type ChatMessage } from '../src/openai';

export function ChatbotWidget() {
  const {
    recommendations,
    selectedRecommendation,
    participants,
    availabilities,
    preferences,
    meetingConfig,
  } = useScheduling();
  const [open, setOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [reasoningLoading, setReasoningLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const topRec = recommendations[selectedRecommendation] ?? recommendations[0];

  const buildCtx = () => {
    if (!topRec || !meetingConfig) return null;
    return {
      meetingConfig,
      participants,
      availabilities,
      preferences,
      recommendations,
      activeRec: topRec,
    };
  };

  // Reset chat when the recommendation changes
  useEffect(() => {
    setChatHistory([]);
  }, [topRec?.dayIndex, topRec?.timeIndex]);

  // Lazy-load reasoning the first time the panel opens for a given rec
  useEffect(() => {
    if (!open || !topRec || chatHistory.length > 0 || reasoningLoading) return;
    const ctx = buildCtx();
    if (!ctx) return;
    setReasoningLoading(true);
    getAIReasoning(ctx)
      .then((r) => setChatHistory([{ role: 'assistant', content: r }]))
      .catch(() =>
        setChatHistory([
          { role: 'assistant', content: 'Sorry, the AI assistant is unavailable right now.' },
        ]),
      )
      .finally(() => setReasoningLoading(false));
  }, [open, topRec, chatHistory.length, reasoningLoading]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (open) {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [chatHistory, open, chatLoading, reasoningLoading]);

  const handleSend = async () => {
    if (!userInput.trim() || chatLoading || !topRec) return;
    const ctx = buildCtx();
    if (!ctx) return;
    const message = userInput.trim();
    setUserInput('');
    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: message }];
    setChatHistory(newHistory);
    setChatLoading(true);
    try {
      const reply = await chatWithAI(ctx, chatHistory, message);
      setChatHistory([...newHistory, { role: 'assistant', content: reply }]);
    } catch {
      setChatHistory([...newHistory, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!topRec) return null;

  return (
    <>
      {/* Floating launcher button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
          aria-label="Open AI assistant"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-sm">Ask AI</span>
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-white" />
          </span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[540px] max-h-[calc(100vh-3rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-sm">AI Scheduling Assistant</div>
                <div className="text-[11px] text-blue-100">
                  About {topRec.day} {topRec.time}
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close AI assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {chatHistory.length === 0 && reasoningLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm text-slate-400 italic shadow-sm">
                  Thinking...
                </div>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm text-slate-400 italic shadow-sm">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-200 bg-white flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a follow-up question..."
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
              disabled={chatLoading || reasoningLoading}
            />
            <button
              onClick={handleSend}
              disabled={!userInput.trim() || chatLoading || reasoningLoading}
              className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
