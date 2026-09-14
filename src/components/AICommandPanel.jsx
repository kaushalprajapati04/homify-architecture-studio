import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Loader2, Wand2, History } from 'lucide-react';

const EXAMPLE_COMMANDS = [
  'Make the kitchen larger',
  'Add a balcony',
  'Add an attached bathroom to the master bedroom',
  'Add car parking',
  'Create a larger living room',
  'Add another bedroom',
  'Add a kitchen island',
];

export default function AICommandPanel({ onApply, isProcessing, recentCommands }) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isProcessing) return;
    onApply(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-ink-100">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-ink-900 text-sm">Homify AI</h3>
            <p className="text-xs text-ink-400">Describe what you want to change</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <div className="mb-4">
          <p className="text-xs font-medium text-ink-500 mb-2">Try these:</p>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_COMMANDS.map((cmd) => (
              <button
                key={cmd}
                onClick={() => setInput(cmd)}
                disabled={isProcessing}
                className="px-2.5 py-1.5 rounded-lg bg-ink-50 hover:bg-ink-100 text-xs text-ink-600 font-medium transition-colors disabled:opacity-50"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>

        {recentCommands.length > 0 && (
          <div>
            <p className="text-xs font-medium text-ink-500 mb-2 flex items-center gap-1.5">
              <History className="w-3 h-3" /> Recent Commands
            </p>
            <div className="space-y-1.5">
              {recentCommands.slice(0, 5).map((cmd, i) => (
                <div key={i} className="px-3 py-2 rounded-lg bg-ink-50 text-xs text-ink-600">
                  {cmd}
                </div>
              ))}
            </div>
          </div>
        )}

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-4 p-3 rounded-xl bg-accent-50 border border-accent-200"
          >
            <div className="flex items-center gap-2 text-accent-700 text-sm font-medium mb-2">
              <Loader2 className="w-4 h-4 animate-spin" /> AI is processing...
            </div>
            <div className="space-y-1.5">
              {['Understanding your request...', 'Modifying floor plan...', 'Updating 2D floor plan...'].map((s, i) => (
                <motion.div
                  key={s}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.3 }}
                  className="text-xs text-accent-600"
                >
                  {s}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-ink-100">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Make the kitchen larger and add an island..."
            disabled={isProcessing}
            className="input-field pr-12 text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-ink-900 text-white flex items-center justify-center disabled:opacity-40 hover:bg-ink-800 transition-colors"
            aria-label="Apply changes"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className="btn-primary w-full mt-2 text-sm py-2.5 disabled:opacity-40"
        >
          <Wand2 className="w-4 h-4" /> Apply Changes
        </button>
      </form>
    </div>
  );
}
