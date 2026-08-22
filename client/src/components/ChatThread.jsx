import { useEffect, useRef, useState } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { messageApi } from '../api';
import { useAuth } from '../context/AuthContext';

export default function ChatThread({ orderId }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    function load() {
      messageApi
        .list(orderId)
        .then((d) => {
          if (!cancelled) setMessages(d.messages);
        })
        .catch(() => {});
    }

    load();
    const interval = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [orderId, open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const { message } = await messageApi.send(orderId, text.trim());
      setMessages((prev) => [...prev, message]);
      setText('');
    } catch (err) {
      alert(err.message || 'Could not send message');
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <MessageCircle className="w-4 h-4" /> Message
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white mb-4 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">Messages</span>
        <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">
          Hide
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto px-4 py-3 space-y-2">
        {messages.length === 0 ? (
          <p className="text-xs text-gray-400">No messages yet — say hello.</p>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === user.id;
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-1.5 text-sm ${
                    isMe ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {!isMe && (
                    <p className="text-[10px] font-medium opacity-70 mb-0.5 capitalize">
                      {m.sender_name} ({m.sender_role})
                    </p>
                  )}
                  <p>{m.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-2 border-t border-gray-200">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="p-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
