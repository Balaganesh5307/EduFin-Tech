import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth.context';
import { MessageSquare, Send } from 'lucide-react';

export const FacultyMessaging: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const loadConversations = async () => {
    try {
      const convRes = await fetch('/api/portals/faculty/conversations', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (convRes.ok) {
        const list = await convRes.json();
        setConversations(list);
        if (list.length > 0 && !selectedThread) {
          setSelectedThread(list[0]);
        }
      }
    } catch (err) {
      console.warn('Failed retrieving faculty conversations:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) loadConversations();
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread || !chatMessage.trim()) return;

    const recipient = selectedThread.conversation.participants.find((p: any) => p._id !== user?.id);
    if (!recipient) return;

    try {
      const res = await fetch('/api/portals/faculty/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ recipientId: recipient._id, message: chatMessage })
      });

      if (res.ok) {
        setChatMessage('');
        loadConversations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-2 text-left">
        <div className="h-10 w-48 bg-slate-900 rounded-xl"></div>
        <div className="h-64 bg-slate-900 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 leading-none">
          Parent Consultation Chat Center
          <MessageSquare className="h-5 w-5 text-indigo-400" />
        </h1>
        <p className="text-sm text-slate-400 mt-1">Direct consulting channels to chat with student parents and guardians.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch h-[60vh]">
        {/* Threads List */}
        <div className="lg:col-span-4 glass-panel border-slate-900 rounded-3xl p-4 flex flex-col space-y-3 overflow-y-auto">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block pl-2 mb-2">Parent Consult Rooms</span>
          {conversations.length === 0 ? (
            <p className="text-slate-500 text-xs italic pl-2">No active parent consult chats.</p>
          ) : (
            conversations.map((t) => {
              const recipient = t.conversation.participants.find((p: any) => p._id !== user?.id);
              const isActive = selectedThread?.conversation._id === t.conversation._id;
              return (
                <div
                  key={t.conversation._id}
                  onClick={() => setSelectedThread(t)}
                  className={`p-3 rounded-2xl cursor-pointer text-left transition-all border ${
                    isActive ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400' : 'bg-slate-950/20 border-transparent text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <strong className="text-xs text-slate-200 block font-bold">{recipient?.name || 'Parent Member'}</strong>
                  <span className="text-[9px] text-slate-500 font-medium block truncate mt-1">{t.conversation.lastMessage || 'Start chat...'}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Chat window */}
        <div className="lg:col-span-8 glass-panel border-slate-900 rounded-3xl p-5 flex flex-col justify-between">
          {selectedThread ? (
            <>
              <div className="border-b border-slate-900 pb-3 text-left">
                <h5 className="font-extrabold text-slate-200 text-xs">
                  {selectedThread.conversation.participants.find((p: any) => p._id !== user?.id)?.name}
                </h5>
                <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Parent/Guardian</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3.5 my-4 pr-1 text-xs max-h-[35vh]">
                {selectedThread.messages?.map((msg: any) => {
                  const isSelf = msg.sender._id === user?.id;
                  return (
                    <div key={msg._id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 rounded-2xl max-w-[80%] text-left leading-normal ${
                        isSelf ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-900 text-slate-300 rounded-bl-none'
                      }`}>
                        <p>{msg.message}</p>
                        <span className={`text-[8px] block pt-1.5 text-right ${isSelf ? 'text-indigo-200' : 'text-slate-500'}`}>
                          {msg.sender.role}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-slate-900 pt-3.5">
                <input
                  type="text"
                  required
                  placeholder="Type consulting message here..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none"
                />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl flex items-center justify-center active:scale-95 transition-transform shrink-0">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 italic text-xs">Select a parent thread to consult.</div>
          )}
        </div>
      </div>
    </div>
  );
};
