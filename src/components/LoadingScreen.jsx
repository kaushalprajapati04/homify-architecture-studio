import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';

export default function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-ink-50">
      <div className="flex flex-col items-center gap-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 rounded-2xl bg-ink-900 flex items-center justify-center"
        >
          <Compass className="w-8 h-8 text-accent-400" />
        </motion.div>
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-sm font-medium text-ink-500"
        >
          {message}
        </motion.p>
      </div>
    </div>
  );
}
