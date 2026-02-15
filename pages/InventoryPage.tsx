
import React, { useState, useRef, useEffect } from 'react';
import { Product, Category, Status, ConsumptionType } from '../types';

interface InventoryPageProps {
  products: Product[];
  onConsume: (id: string, amount?: number) => void;
  onEdit: (p: Product) => void;
  onAddClick: () => void;
}

const InventoryPage: React.FC<InventoryPageProps> = ({ products, onConsume, onEdit, onAddClick }) => {
  const [filter, setFilter] = useState<string>('Todos');
  const [search, setSearch] = useState<string>('');
  const [consumingId, setConsumingId] = useState<string | null>(null);
  const [fractionAmount, setFractionAmount] = useState<string>('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = 'grabbing';
    scrollRef.current.style.userSelect = 'none';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
      scrollRef.current.style.removeProperty('user-select');
    }
  };

  const categories = ['Todos', ...Object.values(Category)];

  const filteredProducts = products.filter(p => {
    const matchesFilter = filter === 'Todos' || p.category === filter;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleStartConsume = (p: Product) => {
    if (p.consumptionType === ConsumptionType.WHOLE) {
      onConsume(p.id);
    } else {
      setConsumingId(p.id);
      setFractionAmount('');
    }
  };

  const handleConfirmFraction = (id: string) => {
    const val = parseFloat(fractionAmount);
    if (!isNaN(val) && val > 0) {
      onConsume(id, val);
    }
    setConsumingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-40 md:pb-8">
      <div className="flex flex-col gap-4 mb-8">
        <div className="relative w-full max-w-2xl">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
            <span className="material-symbols-outlined font-light">search</span>
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary shadow-sm transition-all text-sm font-medium"
            placeholder="Pesquisar itens no estoque..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="relative group/scroll">
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 cursor-grab active:cursor-grabbing scroll-smooth select-none whitespace-nowrap"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`shrink-0 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 border uppercase tracking-widest ${filter === cat
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-105 z-10'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:text-primary active:scale-95'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background-light dark:from-background-dark to-transparent pointer-events-none opacity-100 group-hover/scroll:opacity-0 transition-opacity"></div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Estoque</h2>
          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-[0.2em]">
            {filteredProducts.length === 0
              ? 'Vazio'
              : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'item catalogado' : 'itens catalogados'}`
            }
          </p>
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(p => {
            const isConsuming = consumingId === p.id;
            const contentPerUnit = parseFloat(
              (p.contentPerUnit || '0').toString().replace(',', '.')
            ) || 0;

            const isFractional = p.consumptionType === ConsumptionType.FRACTIONAL;
            const isOutOfStock = p.currentQuantity <= 0;

            let totalInternalQuantity = 0;

            if (!isOutOfStock) {
              if (isFractional) {
                // Hortifruti: conteúdo já é o total
                totalInternalQuantity = contentPerUnit;
              } else {
                // Dinâmica inteira: multiplica unidades × conteúdo
                totalInternalQuantity = p.currentQuantity * contentPerUnit;
              }
            }

            return (
              <div key={p.id} className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">
                {/* Image Header if available */}
                {p.imageUrl ? (
                  <div className="h-40 w-full bg-slate-50 dark:bg-slate-800 relative">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 dark:bg-black/80 px-2 py-1 rounded-lg backdrop-blur-sm">
                      <span className={`h-2 w-2 rounded-full ${getStatusDotColor(p.status)} ${p.status === Status.CRITICAL ? 'animate-pulse' : ''}`}></span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white">{p.status}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 pb-0 flex justify-between items-start">
                    <div className={`size-10 rounded-xl flex items-center justify-center ${getStatusBgColor(p.status)}`}>
                      <span className={`material-symbols-outlined text-[20px] ${getStatusTextColor(p.status)} font-bold`}>
                        {p.consumptionType === ConsumptionType.WHOLE ? 'package_2' : 'inventory'}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`h-2 w-2 rounded-full ${getStatusDotColor(p.status)} ${p.status === Status.CRITICAL ? 'animate-pulse' : ''}`}></span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{p.status}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-5 pt-4 flex-grow flex flex-col">
                  {p.imageUrl && p.isEssential && (
                    <div className="mb-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">Essencial</span>
                    </div>
                  )}

                  {!p.imageUrl && p.isEssential && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 self-end mb-2">Essencial</span>
                  )}

                  <h3 className="font-black text-lg text-slate-900 dark:text-white line-clamp-2 leading-tight mb-2 min-h-[3rem]">{p.name}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[9px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase tracking-widest">
                      {p.category}
                    </span>
                  </div>

                  {p.expirationDate && (
                    <div className="flex items-center gap-1.5 mb-4 px-2 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg w-fit">
                      <span className="material-symbols-outlined text-[14px] text-slate-400">event_available</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Vencto: {p.expirationDate.split('-').reverse().join('/')}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-6 mt-auto">
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800/50">
                      <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest block mb-1">Estoque</span>
                      <span className={`text-lg font-black leading-none ${isOutOfStock ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                        {p.currentQuantity.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}{' '}
                        <span className="text-[10px] font-bold text-slate-400">
                          {isFractional ? 'un.' : (p.unit === 'Sacola' ? 'un.' : p.unit)}
                        </span>
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800/50">
                      <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest block mb-1">Interno</span>
                      <span className={`text-lg font-black leading-none ${isOutOfStock ? 'text-rose-500/60' : 'text-primary'}`}>
                        {totalInternalQuantity.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} <span className={`text-[10px] font-bold ${isOutOfStock ? 'text-rose-500/40' : 'text-primary/60'}`}>{p.measurementUnit}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 relative">
                    {isConsuming ? (
                      <div className="flex-1 flex gap-1 animate-in slide-in-from-bottom-2 duration-300">
                        <input
                          type="number"
                          autoFocus
                          placeholder={`Retirar ${isFractional ? 'un.' : p.measurementUnit}`}
                          className="flex-1 h-12 rounded-xl border-primary bg-primary/5 text-center font-bold text-sm focus:ring-primary focus:border-primary px-2"
                          value={fractionAmount}
                          onChange={(e) => setFractionAmount(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleConfirmFraction(p.id)}
                        />
                        <button
                          onClick={() => handleConfirmFraction(p.id)}
                          className="size-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-transform"
                        >
                          <span className="material-symbols-outlined font-black">check</span>
                        </button>
                        <button
                          onClick={() => setConsumingId(null)}
                          className="size-12 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl flex items-center justify-center hover:text-red-500 transition-colors"
                        >
                          <span className="material-symbols-outlined font-black text-xl">close</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        {isOutOfStock ? (
                          <button
                            onClick={() => onEdit(p)}
                            className="flex-1 py-3 bg-rose-50 dark:bg-rose-900/10 text-rose-500 dark:text-rose-400 font-black rounded-xl flex items-center justify-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all uppercase text-[10px] tracking-widest border border-rose-100 dark:border-rose-900/30 active:scale-95"
                          >
                            <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                            Repor
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartConsume(p)}
                            className="flex-1 py-3 bg-slate-900 dark:bg-primary text-white font-black rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all uppercase text-[10px] tracking-widest shadow-lg shadow-black/5 dark:shadow-primary/20"
                          >
                            <span className="material-symbols-outlined text-[18px]">shopping_basket</span>
                            Consumir
                          </button>
                        )}

                        <button
                          onClick={() => onEdit(p)}
                          className="size-12 flex items-center justify-center border-2 border-slate-100 dark:border-slate-800 rounded-xl text-slate-400 hover:text-primary hover:border-primary transition-all active:scale-95"
                        >
                          <span className="material-symbols-outlined font-bold text-[20px]">settings</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
          <span className="material-symbols-outlined text-5xl text-slate-200 mb-6 font-light">inventory_2</span>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Estoque Vazio</h3>
          <p className="text-slate-400 mt-2 font-medium text-sm">Catalogar novos produtos para monitoramento inteligente.</p>
          <button
            onClick={onAddClick}
            className="mt-8 px-8 py-4 bg-primary text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest text-xs"
          >
            Começar Agora
          </button>
        </div>
      )}

      <button
        onClick={onAddClick}
        className="fixed bottom-24 right-6 md:bottom-12 md:right-12 flex items-center gap-3 bg-primary text-white p-5 rounded-3xl shadow-2xl hover:scale-105 active:scale-95 transition-all z-50 group border-4 border-white dark:border-slate-900 shadow-primary/30"
      >
        <span className="material-symbols-outlined text-white font-black">add</span>
        <span className="font-black tracking-widest uppercase text-xs pr-2 hidden sm:inline">Adicionar Item</span>
      </button>
    </div>
  );
};

function getStatusBgColor(status: Status) {
  switch (status) {
    case Status.NORMAL: return 'bg-emerald-50 dark:bg-emerald-500/10';
    case Status.WARNING: return 'bg-amber-50 dark:bg-amber-500/10';
    case Status.CRITICAL: return 'bg-rose-50 dark:bg-rose-500/10';
    default: return 'bg-slate-50';
  }
}

function getStatusTextColor(status: Status) {
  switch (status) {
    case Status.NORMAL: return 'text-emerald-500';
    case Status.WARNING: return 'text-amber-500';
    case Status.CRITICAL: return 'text-rose-500';
    default: return 'text-slate-400';
  }
}

function getStatusDotColor(status: Status) {
  switch (status) {
    case Status.NORMAL: return 'bg-emerald-500';
    case Status.WARNING: return 'bg-amber-500';
    case Status.CRITICAL: return 'bg-rose-500';
    default: return 'bg-gray-400';
  }
}

export default InventoryPage;