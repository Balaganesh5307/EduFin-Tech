import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/auth.context';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

export const AIChatbot: React.FC = () => {
  const { accessToken } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: 'Hi! I am your EduFin AI Assistant. How can I help you with your campus fees, scholarship options, or personal expenses today?' }
  ]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    if (!textToSend) setInput('');

    // Append user message
    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ message: query }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, { sender: 'bot', text: data.reply }]);
      } else {
        throw new Error();
      }
    } catch (err) {
      // Mock client-side backup response for sandbox preview
      setTimeout(() => {
        let reply = "I couldn't fetch an online answer, but here is a tip: make sure you submit your fee payments by 15th August to avoid late surcharges, and check the 'Scholarships' tab to see if your GPA fits active merit grants.";
        const msg = query.toLowerCase();
        
        if (msg.includes('fee') || msg.includes('invoice') || msg.includes('pay')) {
          reply = "Based on local data, your upcoming Tuition Fee is ₹35,000, due on 15th August 2026. You can complete payments online through our Razorpay dashboard integrations.";
        } else if (msg.includes('budget') || msg.includes('expense') || msg.includes('saving')) {
          reply = "Your current monthly expenditure is ₹8,740 of your ₹12,000 budget. You are on track to save ₹18,500 towards your Semester Exchange Goal.";
        } else if (msg.includes('scholarship') || msg.includes('grant')) {
          reply = "You match the 'Merit-Cum-Means Engineering Scholarship' requirements (GPA 8.5+ threshold). Submit your verification forms directly in the Scholarships workspace.";
        } else if (msg.includes('loan') || msg.includes('emi')) {
          reply = "Education Loans start at 7.5% annual interest. You can submit co-applicant details online in the Loans tab to calculate customized EMIs.";
        }

        setMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
        setIsTyping(false);
      }, 800);
      return;
    }

    setIsTyping(false);
  };

  const quickReplies = [
    "Check Tuition Fee",
    "Scholarship matches",
    "Personal Expense report",
    "Education Loan rates"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-600/30 hover:scale-115 transition-all duration-300 hover:shadow-indigo-500/40 active:scale-95 group border-glow"
        >
          <div className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-10"></div>
          <Bot className="h-6 w-6 group-hover:rotate-6 transition-transform" />
          <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold ring-2 ring-slate-900 animate-pulse text-white">AI</div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="glass-panel border border-slate-200 dark:border-slate-800/80 w-96 max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[500px]">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">EduFin AI Assistant</h3>
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online Advisor
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 max-w-[80%] rounded-2xl rounded-bl-none px-4 py-3 flex gap-1 items-center">
                  <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          {messages.length === 1 && (
            <div className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-200/50 dark:border-slate-800/30 flex flex-wrap gap-2">
              {quickReplies.map((reply, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(reply)}
                  className="text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 px-2.5 py-1.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all font-medium"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything..."
              className="flex-1 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-sm rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              onClick={() => handleSend()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl p-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all active:scale-95 shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
