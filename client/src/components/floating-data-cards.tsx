import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Activity } from 'lucide-react';

interface DataCard {
  id: number;
  type: 'ticker' | 'chart' | 'trend' | 'price';
  content: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  initialX: number;
  initialY: number;
  duration: number;
  delay: number;
}

const generateDataCards = (): DataCard[] => [
  {
    id: 1,
    type: 'ticker',
    content: 'AAPL +2.5%',
    icon: <TrendingUp className="w-3 h-3" />,
    trend: 'up',
    initialX: 15,
    initialY: 20,
    duration: 25,
    delay: 0,
  },
  {
    id: 2,
    type: 'ticker',
    content: 'TSLA -1.2%',
    icon: <TrendingDown className="w-3 h-3" />,
    trend: 'down',
    initialX: 75,
    initialY: 35,
    duration: 30,
    delay: 2,
  },
  {
    id: 3,
    type: 'price',
    content: '$184.50',
    icon: <DollarSign className="w-3 h-3" />,
    initialX: 25,
    initialY: 65,
    duration: 28,
    delay: 4,
  },
  {
    id: 4,
    type: 'chart',
    content: '+8.4%',
    icon: <BarChart3 className="w-3 h-3" />,
    trend: 'up',
    initialX: 82,
    initialY: 75,
    duration: 26,
    delay: 1,
  },
  {
    id: 5,
    type: 'trend',
    content: 'VOL 2.4M',
    icon: <Activity className="w-3 h-3" />,
    initialX: 50,
    initialY: 45,
    duration: 32,
    delay: 3,
  },
  {
    id: 6,
    type: 'ticker',
    content: 'NVDA +5.1%',
    icon: <TrendingUp className="w-3 h-3" />,
    trend: 'up',
    initialX: 10,
    initialY: 80,
    duration: 27,
    delay: 5,
  },
  {
    id: 7,
    type: 'price',
    content: '$892.30',
    icon: <DollarSign className="w-3 h-3" />,
    initialX: 70,
    initialY: 15,
    duration: 29,
    delay: 1.5,
  },
  {
    id: 8,
    type: 'ticker',
    content: 'AMZN -0.8%',
    icon: <TrendingDown className="w-3 h-3" />,
    trend: 'down',
    initialX: 40,
    initialY: 25,
    duration: 31,
    delay: 2.5,
  },
];

export function FloatingDataCards() {
  const dataCards = generateDataCards();

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {dataCards.map((card) => (
        <motion.div
          key={card.id}
          className="absolute"
          style={{
            left: `${card.initialX}%`,
            top: `${card.initialY}%`,
          }}
          initial={{
            opacity: 0,
            scale: 0.8,
          }}
          animate={{
            opacity: [0, 0.4, 0.3, 0.4, 0],
            scale: [0.8, 1, 0.95, 1, 0.8],
            y: [0, -30, -60, -90, -120],
            x: [0, 10, -5, 15, 0],
            rotate: [0, 5, -3, 8, 0],
          }}
          transition={{
            duration: card.duration,
            delay: card.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div
            className={`
              px-3 py-2 rounded-lg backdrop-blur-sm
              border shadow-lg
              flex items-center gap-2
              text-xs font-mono
              ${
                card.trend === 'up'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : card.trend === 'down'
                  ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
              }
            `}
          >
            <span className="opacity-70">{card.icon}</span>
            <span className="font-semibold whitespace-nowrap">{card.content}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
