
import React, { useState, useMemo } from 'react';
import { Product, Status } from '../types';

interface ShoppingListPageProps {
  products: Product[];
  manuallyAddedIds: Set<string>;
  onRemoveFromList: (id: string) => void;
  onManualAdd: (id: string) => void;
  onQuantityChange: (id: string, qty: number) => void;
  onConfirmPurchase: (quantities: Record<string, number>) => void;
}

const ShoppingListPage: React.FC<ShoppingListPageProps> = ({ products, manuallyAddedIds, onRemoveFromList, onManualAdd, onQuantityChange, onConfirmPurchase }) => {

  const [budget, setBudget] = useState<number>(150);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const shoppingItems = useMemo(() => {
    // Auto-detected items (low stock)
    const autoItems = products
      .filter(p => p.currentQuantity < p.minQuantity)
      .map(p => {
        let neededQuantity = 1;
        if (p.consumptionType === 'WHOLE') {
          neededQuantity = Math.max(1, Math.ceil(p.minQuantity - p.currentQuantity));
        } else if (p.consumptionType === 'FRACTIONAL') {
          neededQuantity = 1;
        }
        return { ...p, neededQuantity, isManual: false };
      });

    // Manually added items
    const autoIds = new Set(autoItems.map(i => i.id));
    const manualItems = products
      .filter(p => manuallyAddedIds.has(p.id) && !autoIds.has(p.id))
      .map(p => ({ ...p, neededQuantity: 1, isManual: true }));

    return [...autoItems, ...manualItems];
  }, [products, manuallyAddedIds]);


  const total = useMemo(() => {
    return shoppingItems.reduce((acc, item) => {
      const qty = quantities[item.id] ?? item.neededQuantity;
      return acc + (item.pricePerUnit * qty);
    }, 0);
  }, [shoppingItems, quantities]);

  const isOverBudget = total > budget;
  const overBudgetAmount = Math.max(0, total - budget);
  const budgetPercent = Math.min(100, (total / budget) * 100);

  // Products available to add (not already on the list)
  const availableProducts = useMemo(() => {
    const listIds = new Set(shoppingItems.map(i => i.id));
    return products.filter(p => !listIds.has(p.id));
  }, [products, shoppingItems]);

  const filteredAvailable = useMemo(() => {
    if (!searchTerm.trim()) return availableProducts;
    const term = searchTerm.toLowerCase();
    return availableProducts.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    );
  }, [availableProducts, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-40">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">Lista de Compras</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Reposição automática baseada em estoque crítico</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setSearchTerm(''); }}
          className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-black/5 dark:shadow-white/5 hover:scale-105 active:scale-95"
        >
          <span className="material-symbols-outlined text-xl font-black">add</span>
          Adição Manual
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
                  {shoppingItems.map(item => (
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
                            min="1"
                            value={quantities[item.id] ?? item.neededQuantity}
                            className="w-16 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 dark:text-white text-center text-xs font-black focus:ring-primary focus:border-primary"
                            onChange={(e) => {
                              const newQty = Number(e.target.value);
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
                        R$ {(item.pricePerUnit * (quantities[item.id] ?? item.neededQuantity)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

                      </td>
                      <td className="px-6 py-5 text-center">
                        <button onClick={() => onRemoveFromList(item.id)} className="size-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-500/5 transition-all">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {shoppingItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">
                        Suprimentos em dia. Nada pendente.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 bg-emerald-500/5 rounded-2xl p-6 border border-emerald-500/10 flex items-center gap-4">
            <div className="size-12 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
              <span className="material-symbols-outlined text-white font-black">insights</span>
            </div>
            <div>
              <h3 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-1">Dica de Compra</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Sua lista contém {shoppingItems.filter(i => i.isEssential).length} itens marcados como essenciais. Priorize a aquisição destes para manter a estabilidade do seu estoque doméstico.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Limite de Gastos</label>
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 font-black text-sm uppercase">BRL</span>
              <input
                type="number"
                className="w-full bg-transparent border-none p-0 focus:ring-0 text-xl font-black text-slate-900 dark:text-white font-mono"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-8 text-white shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Previsto</span>
              <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                <span className={`size-2 rounded-full ${isOverBudget ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                <span className="text-[8px] font-black uppercase">{isOverBudget ? 'Acima do Teto' : 'No Orçamento'}</span>
              </div>
            </div>

            <div className="mb-10">
              <span className="text-5xl font-black tracking-tighter block mb-2 font-mono">
                R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Baseado em {shoppingItems.length} tipos de itens
              </p>

              {isOverBudget && (
                <p className="mt-2 text-xs font-black text-rose-400 uppercase tracking-widest">
                  Excedeu R$ {overBudgetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>

            <div className="space-y-4 mb-10">
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
                const allQuantities: Record<string, number> = {};
                shoppingItems.forEach(item => {
                  allQuantities[item.id] = quantities[item.id] ?? item.neededQuantity;
                });
                onConfirmPurchase(allQuantities);
              }}
              className="w-full flex items-center justify-center gap-3 bg-[#11d483] text-white py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5 group"
            >
              <span className="material-symbols-outlined font-black transition-transform group-hover:translate-x-1">
                check_circle
              </span>
              Compra realizada
            </button>

          </div>
        </div>
      </div>

      {/* Modal de Adição Manual */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          {/* Modal */}
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Adicionar Produto</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-1">Selecione um item do estoque</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="size-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-700">
                <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
                <input
                  type="text"
                  placeholder="Buscar produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
                  autoFocus
                />
              </div>
            </div>

            {/* Product List */}
            <div className="max-h-80 overflow-y-auto p-3">
              {filteredAvailable.length === 0 ? (
                <div className="py-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-700 mb-3 block">inventory_2</span>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {availableProducts.length === 0 ? 'Todos os produtos já estão na lista' : 'Nenhum resultado encontrado'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredAvailable.map(product => (
                    <button
                      key={product.id}
                      onClick={() => {
                        onManualAdd(product.id);
                        setShowModal(false);
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group text-left"
                    >
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="size-11 rounded-xl object-cover bg-slate-100 dark:bg-slate-800" />
                      ) : (
                        <div className="size-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 shrink-0">
                          <span className="material-symbols-outlined text-xl">inventory_2</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{product.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase tracking-widest">{product.category}</span>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">R$ {product.pricePerUnit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                      <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        <span className="material-symbols-outlined text-lg font-black">add</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingListPage;