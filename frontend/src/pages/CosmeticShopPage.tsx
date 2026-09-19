import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Coins, Check, Sparkles, AlertCircle } from 'lucide-react';
import { api, CosmeticItem } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';

export const CosmeticShopPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { playSound } = useSound();

  const [coins, setCoins] = useState<number>(150);
  const [items, setItems] = useState<CosmeticItem[]>([]);
  const [activeKind, setActiveKind] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.getGameProfile().catch(() => null),
      api.getShopItems().catch(() => []),
    ]).then(([prof, shopList]) => {
      if (prof) setCoins(prof.coins);
      setItems(shopList);
      setLoading(false);
    });
  }, []);

  const handleBuy = async (item: CosmeticItem) => {
    if (coins < item.cost) {
      setNotification(`Not enough coins! You need ${item.cost - coins} more 🪙.`);
      playSound('wrong');
      return;
    }

    try {
      await api.buyCosmetic(item.id);
      setCoins((prev) => prev - item.cost);
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, is_owned: true } : it))
      );
      setNotification(`🎉 Successfully purchased ${item.name}!`);
      playSound('levelUp');
      await refreshUser();
    } catch (err: any) {
      setNotification(err.message || 'Purchase failed');
      playSound('wrong');
    }
  };

  const handleEquip = async (item: CosmeticItem) => {
    try {
      await api.equipCosmetic(item.id);
      setItems((prev) =>
        prev.map((it) => ({
          ...it,
          is_equipped: it.id === item.id ? true : it.kind === item.kind ? false : it.is_equipped,
        }))
      );
      setNotification(`✨ Equipped ${item.name}!`);
      playSound('correct');
      await refreshUser();
    } catch (err: any) {
      setNotification(err.message || 'Equip failed');
    }
  };

  const filteredItems =
    activeKind === 'all' ? items : items.filter((it) => it.kind === activeKind);

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        {/* Shop Header */}
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-yellow-950/80 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 font-mono text-xs font-bold rounded-full border border-amber-500/40">
                Skyforge Bazaar
              </span>
              <span className="text-xs text-slate-400">Cosmetics & Scholar Titles</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              <ShoppingBag className="w-7 h-7 text-amber-400" />
              Cosmetics Shop
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Spend gold coins earned through correct answers, test victories, and streak milestones.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/80 border border-amber-500/40 px-5 py-3 rounded-2xl shadow">
            <Coins className="w-6 h-6 text-amber-400 fill-amber-400 animate-pulse" />
            <div>
              <span className="block font-black font-mono text-xl text-amber-300 leading-tight">
                {coins}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                Available Coins
              </span>
            </div>
          </div>
        </div>

        {/* Notification Banner */}
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-indigo-950/60 border border-indigo-500/50 rounded-2xl text-xs text-indigo-200 flex items-center justify-between"
          >
            <span>{notification}</span>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </motion.div>
        )}

        {/* Kind Filters */}
        <div className="flex gap-2 border-b border-slate-800 pb-3">
          {(['all', 'frame', 'title', 'theme'] as const).map((kind) => (
            <button
              key={kind}
              onClick={() => setActiveKind(kind)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-colors ${
                activeKind === kind
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {kind === 'all' ? 'All Items' : `${kind}s`}
            </button>
          ))}
        </div>

        {/* Cosmetics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-slate-900/90 border rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all ${
                item.is_equipped
                  ? 'border-amber-400/80 shadow-amber-500/10 ring-2 ring-amber-400/30'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded text-amber-400">
                    {item.kind}
                  </span>
                  <span className="font-mono text-xs font-bold text-amber-300 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {item.cost}
                  </span>
                </div>

                {/* Preview Box */}
                <div className="h-32 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-center text-4xl mb-4 relative overflow-hidden">
                  {item.preview_svg ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: item.preview_svg }}
                      className="w-16 h-16 flex items-center justify-center"
                    />
                  ) : item.kind === 'frame' ? (
                    '🖼️'
                  ) : item.kind === 'title' ? (
                    '👑'
                  ) : (
                    '🎨'
                  )}

                  {item.is_equipped && (
                    <span className="absolute top-2 right-2 text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-mono">
                      EQUIPPED
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-base text-white">{item.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.description}</p>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-slate-800">
                {item.is_owned ? (
                  item.is_equipped ? (
                    <button
                      disabled
                      className="w-full py-2.5 bg-slate-800 text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-default"
                    >
                      <Check className="w-4 h-4" /> Currently Equipped
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEquip(item)}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow"
                    >
                      Equip Item
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => handleBuy(item)}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>Unlock for {item.cost} Coins</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
