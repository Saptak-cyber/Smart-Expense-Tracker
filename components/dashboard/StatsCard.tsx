'use client';

import { motion } from 'framer-motion';

export default function StatsCard({ title, value, subtitle, trend }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
    >
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        {trend && (
          <span className="text-sm font-medium text-emerald-600">{trend}</span>
        )}
      </div>
    </motion.div>
  );
}
