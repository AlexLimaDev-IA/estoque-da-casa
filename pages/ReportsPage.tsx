
import React, { useState, useMemo } from 'react';
import { Product, Category, PurchaseRecord, ReportPeriod } from '../types';

interface ReportsPageProps {
  products: Product[];
  purchaseHistory: PurchaseRecord[];
}

const PERIOD_OPTIONS: { key: ReportPeriod; label: string }[] = [
  { key: '7d', label: '7 Dias' },
  { key: '15d', label: '15 Dias' },
  { key: 'month', label: 'Mês Atual' },
  { key: 'year', label: 'Ano' },
];

function getStartDate(period: ReportPeriod): Date {
  const now = new Date();
  switch (period) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '15d':
      return new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'year':
      return new Date(now.getFullYear(), 0, 1);
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const ReportsPage: React.FC<ReportsPageProps> = ({ products, purchaseHistory }) => {
  const [period, setPeriod] = useState<ReportPeriod>('month');



  const startDate = useMemo(() => getStartDate(period), [period]);

  // Filter purchases by selected period
  const filteredPurchases = useMemo(() => {
    return purchaseHistory.filter(p => new Date(p.date) >= startDate);
  }, [purchaseHistory, startDate]);

  // Stats
  const totalSpent = useMemo(() =>
    filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0),
    [filteredPurchases]
  );

  const purchaseCount = filteredPurchases.length;

  const criticalItems = products.filter(p => p.currentQuantity < p.minQuantity).length;

  // Category spending from purchases in the period
  const spendByCategory = useMemo(() => {
    const catMap: Record<string, number> = {};
    filteredPurchases.forEach(purchase => {
      purchase.items.forEach(item => {
        catMap[item.category] = (catMap[item.category] || 0) + item.total;
      });
    });
    return Object.entries(catMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredPurchases]);

  const maxCategoryAmount = Math.max(...spendByCategory.map(c => c.amount), 1);

  // Active categories count
  const activeCategoriesCount = useMemo(() => {
    const cats = new Set<string>();
    filteredPurchases.forEach(p => p.items.forEach(i => cats.add(i.category)));
    return cats.size;
  }, [filteredPurchases]);

  // Price variations - compare oldest vs newest price in period for each product
  const priceVariations = useMemo(() => {
    return products
      .map(p => {
        const history = p.priceHistory || [];
        if (history.length < 2) return null;

        // Get entries in the period
        const entriesInPeriod = history.filter(h => new Date(h.date) >= startDate);
        const entriesBefore = history.filter(h => new Date(h.date) < startDate);

        // Need at least one entry in the period to show a change
        if (entriesInPeriod.length === 0) return null;

        // Reference price: latest before the period, or oldest in the period
        const refPrice = entriesBefore.length > 0
          ? entriesBefore[entriesBefore.length - 1].price
          : entriesInPeriod[0].price;

        const currentPrice = p.pricePerUnit;

        if (refPrice <= 0) return null;

        const change = ((currentPrice - refPrice) / refPrice) * 100;

        return {
          id: p.id,
          name: p.name,
          category: p.category,
          oldPrice: refPrice,
          newPrice: currentPrice,
          change,
          unit: p.unit
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => Math.abs(b.change) - Math.abs(a.change)) as any[];
  }, [products, startDate]);

  // Stock Autonomy Logic
  const stockAutonomy = useMemo(() => {
    // Filter items with positive average consumption
    const itemsWithConsumption = products.filter(p => (p.averageConsumption || 0) > 0);

    if (itemsWithConsumption.length === 0) {
      return {
        days: 0,
        status: 'Sem dados',
        color: 'text-slate-400',
        bg: 'bg-slate-100 dark:bg-slate-800',
        icon: 'help',
        message: 'Consumo médio não definido'
      };
    }

    // Calculate days remaining for each item
    const daysRemaining = itemsWithConsumption.map(p => {
      return p.currentQuantity / (p.averageConsumption || 1);
    });

    // Find the minimum days (autonomy is limited by the first item to run out)
    const minDays = Math.min(...daysRemaining);
    const roundedDays = Math.floor(minDays);

    if (roundedDays < 3) {
      return {
        days: roundedDays,
        status: 'Estoque crítico',
        color: 'text-rose-500',
        bg: 'bg-rose-500/10',
        icon: 'error',
        message: 'Baseado no consumo médio da casa'
      };
    } else if (roundedDays <= 7) {
      return {
        days: roundedDays,
        status: 'Estoque moderado',
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        icon: 'warning',
        message: 'Baseado no consumo médio da casa'
      };
    } else {
      return {
        days: roundedDays,
        status: 'Estoque confortável',
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        icon: 'check_circle',
        message: 'Baseado no consumo médio da casa'
      };
    }
  }, [products]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Header & Period Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Relatórios de Gastos</h1>
          <p className="text-slate-500 mt-1">Acompanhe o valor investido e o consumo da sua residência.</p>
        </div>
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl shadow-sm">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setPeriod(opt.key)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${period === opt.key
                ? 'bg-primary text-white shadow-sm shadow-primary/20'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Gasto no Período</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <div className="flex items-center gap-1.5 mt-4 text-emerald-600">
            <span className="material-symbols-outlined text-sm font-bold">payments</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {purchaseCount > 0 ? `${purchaseCount} compra${purchaseCount > 1 ? 's' : ''} realizada${purchaseCount > 1 ? 's' : ''}` : 'Nenhuma compra'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 relative overflow-hidden group">
          <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${stockAutonomy.color}`}>
            <span className="material-symbols-outlined text-6xl">{stockAutonomy.icon}</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Autonomia do Estoque</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {stockAutonomy.days} dias
          </h3>
          <div className={`flex items-center gap-1.5 mt-4 ${stockAutonomy.color}`}>
            <span className="material-symbols-outlined text-sm font-bold">{stockAutonomy.icon}</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider leading-none">{stockAutonomy.status}</span>
              <span className="text-[8px] font-bold opacity-70 uppercase tracking-widest mt-0.5">{stockAutonomy.message}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Itens em Alerta</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">{criticalItems} Itens</h3>
          <div className="flex items-center gap-1.5 mt-4 text-amber-500">
            <span className="material-symbols-outlined text-sm font-bold">warning</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Abaixo do estoque mínimo</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categorias com Gastos</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">{activeCategoriesCount} Tipos</h3>
          <div className="flex items-center gap-1.5 mt-4 text-slate-600">
            <span className="material-symbols-outlined text-sm">pie_chart</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">No período selecionado</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Category Spending Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Gastos por Categoria</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-8">Baseado nas compras do período</p>
          <div className="space-y-5">
            {spendByCategory.map(cat => (
              <div key={cat.name} className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider">{cat.name}</span>
                  <span className="text-slate-900 dark:text-white font-black font-mono text-xs">R$ {cat.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${(cat.amount / maxCategoryAmount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {spendByCategory.length === 0 && (
              <div className="py-16 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-700 block mb-3">receipt_long</span>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhuma compra neste período</p>
                <p className="text-[10px] text-slate-400 mt-1">Confirme compras na Lista de Compras para ver dados aqui.</p>
              </div>
            )}
          </div>
        </div>

        {/* Purchase History */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Histórico de Compras</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-1">Compras realizadas no período</p>
          </div>
          <div className="flex-1 overflow-y-auto max-h-80">
            {filteredPurchases.length === 0 ? (
              <div className="py-16 text-center px-6">
                <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-700 block mb-3">shopping_bag</span>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhuma compra registrada</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {[...filteredPurchases].reverse().map(purchase => (
                  <div key={purchase.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-sm">shopping_cart</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{formatDateTime(purchase.date)}</span>
                      </div>
                      <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                        R$ {purchase.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {purchase.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-600 dark:text-slate-400 font-medium truncate mr-2">
                            {item.quantity}x {item.productName}
                          </span>
                          <span className="text-slate-500 font-mono font-bold shrink-0">
                            R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Price Variations Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Variação de Preços</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-1">Comparação de preços dentro do período selecionado</p>
        </div>

        {priceVariations.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-700 block mb-3">monitoring</span>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sem dados de variação</p>
            <p className="text-[10px] text-slate-400 mt-1">As variações aparecerão após mais compras com mudanças de preço.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Preço Anterior</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Preço Atual</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Variação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {priceVariations.map((item: any) => {
                  const isUp = item.change > 0;
                  const isDown = item.change < 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`size-8 rounded-lg flex items-center justify-center ${isUp ? 'bg-rose-500/10 text-rose-500' : isDown ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 text-slate-400'
                            }`}>
                            <span className="material-symbols-outlined text-sm">
                              {isUp ? 'arrow_upward' : isDown ? 'arrow_downward' : 'horizontal_rule'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.name}</p>
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase tracking-widest">{item.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 font-mono">
                        R$ {item.oldPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-slate-900 dark:text-white font-mono">
                        R$ {item.newPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${isUp
                          ? 'bg-rose-500/10 text-rose-500'
                          : isDown
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-slate-100 text-slate-500'
                          }`}>
                          {isUp ? '+' : ''}{item.change.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;