
import React, { useState, useMemo, useEffect } from 'react';
import { Product, Status } from '../types';

interface ShoppingListPageProps {
  products: Product[];
  manuallyAddedIds: Set<string>;
  onRemoveFromList: (id: string) => void;
  onManualAdd: (id: string) => void;
  onQuantityChange: (id: string, qty: number) => void;
  onConfirmPurchase: (
    quantities: Record<string, number>,
    purchaseDate: string,
    realPrices: Record<string, { unitPrice: number; pricePerKg?: number }>
  ) => void;
}

const ShoppingListPage: React.FC<ShoppingListPageProps> = ({ products, manuallyAddedIds, onRemoveFromList, onManualAdd, onQuantityChange, onConfirmPurchase }) => {

  const [mode, setMode] = useState<'browse' | 'list' | 'confirm'>('browse');
  const [budget, setBudget] = useState<number | string>(150);
  const [quantities, setQuantities] = useState<Record<string, number | string>>({});
  const [ignoredItemIds, setIgnoredItemIds] = useState<Set<string>>(new Set());

  // Confirm mode states
  const [confirmDate, setConfirmDate] = useState(new Date().toISOString().split('T')[0]);
  const [realPrices, setRealPrices] = useState<Record<string, { unitPrice: number | string; pricePerKg?: number | string }>>({});

  // Browse mode states
  const [browseSelected, setBrowseSelected] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Auto-select low-stock products on mount
  useEffect(() => {
    const initial: Record<string, number> = {};
    products.forEach(p => {
      if (p.currentQuantity < p.minQuantity) {
        const needed = p.consumptionType === 'WHOLE'
          ? Math.max(1, Math.ceil(p.minQuantity - p.currentQuantity))
          : 1;
        initial[p.id] = needed;
      }
    });
    // Also include any manually added IDs from the parent
    manuallyAddedIds.forEach(id => {
      if (!(id in initial)) {
        initial[id] = 1;
      }
    });
    setBrowseSelected(initial);
  }, []); // Run once on mount

  // Categories for filter
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return Array.from(cats).sort();
  }, [products]);

  // Filtered products for browse
  const filteredProducts = useMemo(() => {
    let list = products;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
      );
    }
    if (categoryFilter) {
      list = list.filter(p => p.category === categoryFilter);
    }
    // Sort: low-stock first, then by name
    return list.sort((a, b) => {
      const aLow = a.currentQuantity < a.minQuantity ? 0 : 1;
      const bLow = b.currentQuantity < b.minQuantity ? 0 : 1;
      if (aLow !== bLow) return aLow - bLow;
      return a.name.localeCompare(b.name);
    });
  }, [products, searchTerm, categoryFilter]);

  const selectedCount = Object.keys(browseSelected).length;

  // LIST mode: items derived from browseSelected
  const listItems = useMemo(() => {
    return Object.entries(browseSelected)
      .map(([id, qty]) => {
        const product = products.find(p => p.id === id);
        if (!product) return null;
        return { ...product, neededQuantity: qty };
      })
      .filter(Boolean) as (Product & { neededQuantity: number })[];
  }, [browseSelected, products]);

  const total = useMemo(() => {
    return listItems.reduce((acc, item) => {
      const qVal = quantities[item.id] ?? item.neededQuantity;
      const qty = typeof qVal === 'string' ? (qVal === '' ? 0 : Number(qVal)) : qVal;
      return acc + (item.pricePerUnit * qty);
    }, 0);
  }, [listItems, quantities]);

  const isOverBudget = total > (Number(budget) || 0);
  const overBudgetAmount = Math.max(0, total - (Number(budget) || 0));
  const budgetPercent = Math.min(100, (total / (Number(budget) || 1)) * 100);

  const getStockStatus = (p: Product) => {
    const ratio = p.minQuantity > 0 ? p.currentQuantity / p.minQuantity : 1;
    if (p.currentQuantity <= 0) return { text: 'Sem estoque', color: 'rose', ratio: 0 };
    if (ratio < 1) return { text: 'Acabando', color: 'amber', ratio };
    return { text: 'Em estoque', color: 'emerald', ratio: Math.min(ratio, 1) };
  };

  const toggleBrowseItem = (id: string) => {
    setBrowseSelected(prev => {
      const next = { ...prev };
      if (id in next) {
        delete next[id];
      } else {
        const p = products.find(pr => pr.id === id);
        const needed = p && p.currentQuantity < p.minQuantity && p.consumptionType === 'WHOLE'
          ? Math.max(1, Math.ceil(p.minQuantity - p.currentQuantity))
          : 1;
        next[id] = needed;
      }
      return next;
    });
  };

  const setBrowseQty = (id: string, qty: number) => {
    setBrowseSelected(prev => ({ ...prev, [id]: Math.max(1, qty) }));
  };

  const handleGenerateList = () => {
    // Sync selections with parent: add any new manual IDs
    Object.keys(browseSelected).forEach(id => {
      if (!manuallyAddedIds.has(id)) {
        onManualAdd(id);
      }
    });
    // Initialize quantities from browse selections
    const newQtys: Record<string, number | string> = {};
    Object.entries(browseSelected).forEach(([id, qty]) => {
      newQtys[id] = qty;
    });
    setQuantities(newQtys);
    setMode('list');
  };

  // ========================
  // BROWSE MODE
  // ========================
  if (mode === 'browse') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-32">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">Escolher Produtos</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Selecione os itens para sua lista de compras</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 flex items-center gap-2.5 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setCategoryFilter('')}
              className={`shrink-0 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!categoryFilter ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat === categoryFilter ? '' : cat)}
                className={`shrink-0 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${categoryFilter === cat ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Card Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredProducts.map(product => {
            const isSelected = product.id in browseSelected;
            const status = getStockStatus(product);
            const barColors: Record<string, string> = {
              rose: 'bg-rose-500',
              amber: 'bg-amber-500',
              emerald: 'bg-emerald-500'
            };

            return (
              <div
                key={product.id}
                className={`relative rounded-2xl border transition-all overflow-hidden cursor-pointer group ${isSelected
                  ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-md shadow-primary/10 ring-1 ring-primary/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md hover:border-slate-300'
                  }`}
                onClick={() => toggleBrowseItem(product.id)}
              >
                {/* Checkbox */}
                <div className="absolute top-2.5 right-2.5 z-10">
                  <div className={`size-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-300 dark:border-slate-600'
                    }`}>
                    {isSelected && <span className="material-symbols-outlined text-[14px] text-white font-black">check</span>}
                  </div>
                </div>

                {/* Image */}
                <div className="aspect-square w-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600">package_2</span>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight truncate leading-tight">{product.name}</p>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{product.category}</span>

                  {/* Stock bar */}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Estoque</span>
                      <span className={`text-[8px] font-black uppercase tracking-widest text-${status.color}-500`}>
                        {product.currentQuantity}/{product.minQuantity}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColors[status.color]}`}
                        style={{ width: `${Math.min(100, status.ratio * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Inline qty input when selected */}
                  {isSelected && (
                    <div
                      className="mt-2.5 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setBrowseQty(product.id, (browseSelected[product.id] || 1) - 1)}
                        className="size-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">remove</span>
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={browseSelected[product.id] || 1}
                        onChange={(e) => setBrowseQty(product.id, Number(e.target.value) || 1)}
                        className="w-12 h-7 rounded-lg border border-primary/30 bg-white dark:bg-slate-900 dark:text-white text-center text-xs font-black focus:ring-primary focus:border-primary"
                      />
                      <button
                        onClick={() => setBrowseQty(product.id, (browseSelected[product.id] || 1) + 1)}
                        className="size-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                      </button>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{product.unit}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-200 dark:text-slate-700 mb-4 block">search_off</span>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhum produto encontrado</p>
          </div>
        )}

        {/* Floating generate button */}
        {selectedCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <button
              onClick={handleGenerateList}
              className="flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-lg">shopping_cart_checkout</span>
              Gerar Lista com {selectedCount} {selectedCount === 1 ? 'item' : 'itens'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ========================
  // CONFIRM MODE
  // ========================
  if (mode === 'confirm') {
    const confirmTotal = listItems.reduce((acc, item) => {
      const qVal = quantities[item.id] ?? item.neededQuantity;
      const qty = typeof qVal === 'string' ? (qVal === '' ? 0 : Number(qVal)) : qVal;
      const price = Number(realPrices[item.id]?.unitPrice) || 0;
      return acc + (price * qty);
    }, 0);

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-32">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => setMode('list')}
              className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">Confirmar Compra</h1>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] ml-12">Informe a data e os preços reais pagos</p>
        </div>

        {/* Date Field */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            <span className="material-symbols-outlined text-sm align-middle mr-1">calendar_today</span>
            Quando você foi às compras?
          </label>
          <input
            type="date"
            required
            className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-800/50 dark:text-white px-4 text-sm font-bold transition-all focus:ring-primary uppercase tracking-widest"
            value={confirmDate}
            onChange={e => setConfirmDate(e.target.value)}
          />
        </div>

        {/* Items Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-16">Qtd</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Preço Un. Pago</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {listItems.map(item => {
                  const qVal = quantities[item.id] ?? item.neededQuantity;
                  const qty = typeof qVal === 'string' ? (qVal === '' ? 0 : Number(qVal)) : qVal;
                  const curPrice = Number(realPrices[item.id]?.unitPrice) || 0;
                  const isKg = item.purchaseUnit === 'kg';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="size-9 rounded-lg object-cover bg-slate-100 dark:bg-slate-800" />
                          ) : (
                            <div className="size-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                              <span className="material-symbols-outlined text-lg">package_2</span>
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.name}</p>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-black text-slate-700 dark:text-slate-300 font-mono">{qty}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase ml-1">{item.unit}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="w-28 h-9 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 pl-8 pr-2 text-sm font-black font-mono focus:ring-emerald-500 focus:border-emerald-500"
                              value={realPrices[item.id]?.unitPrice ?? ''}
                              onChange={e => {
                                const val = e.target.value;
                                setRealPrices(prev => ({
                                  ...prev,
                                  [item.id]: {
                                    ...prev[item.id],
                                    unitPrice: val === '' ? '' : Number(val)
                                  }
                                }));
                              }}
                            />
                          </div>
                          {isKg && (
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-amber-500 uppercase">R$/kg</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Preço/kg"
                                className="w-28 h-8 rounded-lg border border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400 pl-12 pr-2 text-xs font-black font-mono focus:ring-amber-500 focus:border-amber-500"
                                value={realPrices[item.id]?.pricePerKg ?? ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  setRealPrices(prev => ({
                                    ...prev,
                                    [item.id]: {
                                      ...prev[item.id],
                                      pricePerKg: val === '' ? '' : Number(val)
                                    }
                                  }));
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                          R$ {(curPrice * qty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total + Confirm */}
        <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Real da Compra</span>
            <span className="text-3xl font-black font-mono tracking-tighter">
              R$ {confirmTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setMode('list')}
              className="flex-[1] h-12 rounded-xl text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-colors"
            >
              Voltar
            </button>
            <button
              disabled={!confirmDate}
              onClick={() => {
                const allQuantities: Record<string, number> = {};
                listItems.forEach(item => {
                  const val = quantities[item.id] ?? item.neededQuantity;
                  allQuantities[item.id] = Number(val) || 0;
                });
                const finalPrices: Record<string, { unitPrice: number; pricePerKg?: number }> = {};
                Object.entries(realPrices).forEach(([id, p]) => {
                  finalPrices[id] = {
                    unitPrice: Number(p.unitPrice) || 0,
                    pricePerKg: p.pricePerKg !== undefined && p.pricePerKg !== '' ? Number(p.pricePerKg) : undefined
                  };
                });
                onConfirmPurchase(allQuantities, confirmDate, finalPrices);
              }}
              className="flex-[2] h-12 rounded-xl bg-[#11d483] text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">check_circle</span>
              Confirmar Compra
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================
  // LIST MODE
  // ========================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-40">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">Lista de Compras</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{listItems.length} itens selecionados para compra</p>
        </div>
        <button
          onClick={() => setMode('browse')}
          className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Editar Seleção
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          {/* Mobile Scroll Hint */}
          <div className="md:hidden flex items-center justify-end gap-2 mb-2 text-slate-400 animate-pulse px-2">
            <span className="text-[10px] font-bold uppercase tracking-widest">Arraste para ver opções</span>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Preço Un.</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Qtd Compra</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Previsão</th>
                    <th className="px-6 py-4 text-center w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {listItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="size-12 rounded-lg object-cover bg-slate-100 dark:bg-slate-800" />
                          ) : (
                            <div className="size-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                              <span className="material-symbols-outlined">inventory_2</span>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <p className="text-sm font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tight">{item.name}</p>
                            <div className="flex gap-2">
                              <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase tracking-widest">{item.category}</span>
                              {item.isEssential && (
                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-black uppercase tracking-widest border border-amber-500/20">Essencial</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
                        R$ {item.pricePerUnit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={quantities[item.id] ?? item.neededQuantity}
                            className="w-16 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 dark:text-white text-center text-xs font-black focus:ring-primary focus:border-primary"
                            onChange={(e) => {
                              const val = e.target.value;
                              const newQty = val === '' ? '' : Number(val);
                              setQuantities(prev => ({
                                ...prev,
                                [item.id]: newQty
                              }));
                            }}
                          />
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {item.unit}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-black text-slate-900 dark:text-white text-right font-mono">
                        R$ {(item.pricePerUnit * (Number(quantities[item.id] ?? item.neededQuantity) || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button onClick={() => {
                          // Remove from browse selection and from list
                          setBrowseSelected(prev => {
                            const next = { ...prev };
                            delete next[item.id];
                            return next;
                          });
                          onRemoveFromList(item.id);
                          setIgnoredItemIds(prev => new Set(prev).add(item.id));
                        }} className="size-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-500/5 transition-all">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {listItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span className="material-symbols-outlined text-5xl text-slate-200 dark:text-slate-700 mb-4 font-light">shopping_cart</span>
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-6">Nenhum item na lista.</p>
                          <button
                            onClick={() => setMode('browse')}
                            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/20"
                          >
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                            Voltar e Selecionar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 bg-emerald-500/5 rounded-2xl p-5 border border-emerald-500/10 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
              <span className="material-symbols-outlined text-white font-black text-xl">insights</span>
            </div>
            <div>
              <h3 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-0.5">Dica de Compra</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Sua lista contém {listItems.filter(i => i.isEssential).length} itens marcados como essenciais. Priorize a aquisição destes para manter a estabilidade do seu estoque.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Limite de Gastos</label>
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 font-black text-sm uppercase">BRL</span>
              <input
                type="number"
                className="w-full bg-transparent border-none p-0 focus:ring-0 text-xl font-black text-slate-900 dark:text-white font-mono"
                value={budget}
                onChange={(e) => {
                  const val = e.target.value;
                  setBudget(val === '' ? '' : Number(val));
                }}
              />
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-6 text-white shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Previsto</span>
              <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                <span className={`size-2 rounded-full ${isOverBudget ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                <span className="text-[8px] font-black uppercase">{isOverBudget ? 'Acima do Teto' : 'No Orçamento'}</span>
              </div>
            </div>

            <div className="mb-8">
              <span className="text-4xl font-black tracking-tighter block mb-1 font-mono">
                R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Baseado em {listItems.length} tipos de itens
              </p>

              {isOverBudget && (
                <p className="mt-2 text-xs font-black text-rose-400 uppercase tracking-widest">
                  Excedeu R$ {overBudgetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex justify-between items-end">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Progresso Financeiro</span>
                <span className="text-[10px] font-black font-mono">{budgetPercent.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${isOverBudget ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-primary shadow-[0_0_15px_rgba(17,212,131,0.5)]'}`}
                  style={{ width: `${Math.min(100, budgetPercent)}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => {
                // Pre-populate realPrices with current pricePerUnit values
                const initialPrices: Record<string, { unitPrice: number | string; pricePerKg?: number | string }> = {};
                listItems.forEach(item => {
                  initialPrices[item.id] = {
                    unitPrice: item.pricePerUnit,
                    pricePerKg: item.purchaseUnit === 'kg' && item.pricePerKg ? item.pricePerKg : undefined
                  };
                });
                setRealPrices(initialPrices);
                setConfirmDate(new Date().toISOString().split('T')[0]);
                setMode('confirm');
              }}
              className="w-full flex items-center justify-center gap-3 bg-[#11d483] text-white py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5 group"
            >
              <span className="material-symbols-outlined font-black transition-transform group-hover:translate-x-1">
                check_circle
              </span>
              Compra realizada
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShoppingListPage;