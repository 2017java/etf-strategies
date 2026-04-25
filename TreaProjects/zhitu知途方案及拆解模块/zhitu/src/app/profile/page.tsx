'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, RefreshCw, LogOut } from 'lucide-react';
import BadgeWall from '@/components/profile/BadgeWall';
import HistoryList from '@/components/profile/HistoryList';

interface SettingsItemProps {
  icon: typeof User;
  label: string;
  onClick?: () => void;
  danger?: boolean;
}

function SettingsItem({ icon: Icon, label, onClick, danger = false }: SettingsItemProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 p-4 bg-ivory border border-border-cream rounded-lg
        transition-colors text-left
        ${danger
          ? 'hover:border-red-400/40 text-red-500'
          : 'hover:border-terracotta/30 text-charcoal-warm'
        }
      `}
    >
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
        ${danger ? 'bg-red-50' : 'bg-terracotta/10'}
      `}>
        <Icon size={18} className={danger ? 'text-red-400' : 'text-terracotta'} />
      </div>
      <span className="text-body font-medium flex-1">{label}</span>
    </motion.button>
  );
}

export default function ProfilePage() {
  const router = useRouter();

  const handleEditNickname = () => {
    // TODO: Open nickname edit modal
    console.log('Edit nickname');
  };

  const handleRetakeAssessment = () => {
    router.push('/assessment');
  };

  const handleLogout = () => {
    // TODO: Implement logout
    console.log('Logout');
  };

  return (
    <div className="container-main py-6 pb-20">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="font-serif text-heading-3 text-near-black">个人中心</h1>
      </div>

      {/* Badge Wall Section */}
      <section className="mb-8">
        <BadgeWall />
      </section>

      {/* Divider */}
      <div className="border-t border-border-cream my-6" />

      {/* History List Section */}
      <section className="mb-8">
        <HistoryList />
      </section>

      {/* Divider */}
      <div className="border-t border-border-cream my-6" />

      {/* Settings Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">⚙️</span>
          <h3 className="text-heading-5 text-charcoal-warm font-medium">设置</h3>
        </div>

        <div className="space-y-2">
          <SettingsItem
            icon={User}
            label="修改昵称"
            onClick={handleEditNickname}
          />
          <SettingsItem
            icon={RefreshCw}
            label="重新测评"
            onClick={handleRetakeAssessment}
          />
          <SettingsItem
            icon={LogOut}
            label="退出登录"
            onClick={handleLogout}
            danger
          />
        </div>
      </section>
    </div>
  );
}
