import React, { useState, useEffect } from 'react';
import { Product, Category, Status, ConsumptionType } from '../types';

interface AddProductPageProps {
  product: Product | null;
  onSave: (p: Product) => void;
  onCancel: () => void;
}

const PURCHASE_UNITS = [
  'Pacote', 'Caixa', 'Garrafa', 'Lata', 'Cartela', 'Pote',
  'Saco', 'Sacola', 'Vidro', 'Bandeja', 'Unidade', 'Rolo', 'Bisnaga',
  'Barra', 'Kit', 'Fardo', 'Galão'
];

interface ProductFormState extends Omit<Product, 'currentQuantity' | 'minQuantity' | 'pricePerUnit' | 'pricePerKg'> {
  currentQuantity: number | string;
  minQuantity: number | string;
  pricePerUnit: number | string;
  pricePerKg?: number | string;
}

const AddProductPage: React.FC<AddProductPageProps> = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState<ProductFormState>({
    id: '',
    name: '',
    category: Category.MERCEARIA,
    unit: 'Pacote',
    contentPerUnit: '1',
    measurementUnit: 'kg',
    currentQuantity: 1,
    minQuantity: 1,
    pricePerUnit: 0,
    pricePerKg: 0,
    isEssential: false,
    status: Status.NORMAL,
    consumptionType: ConsumptionType.WHOLE,
    imageUrl: '',
    expirationDate: '',
    averageConsumption: 0
  });

  useEffect(() => {
    if (product) {
      setFormData(product);
    }
  }, [product]);

  // Lógica de cálculo automático de preço (Correção: Peso Total -> Custo Total -> Custo Unitário)
  useEffect(() => {
    const isFractional =
      formData.consumptionType === ConsumptionType.FRACTIONAL &&
      ['kg', 'g'].includes(formData.measurementUnit || '') &&
      (Number(formData.pricePerKg) || 0) > 0;

    // Se for modo INTEIRO, não faz cálculo automático
    if (formData.consumptionType === ConsumptionType.WHOLE) {
      return;
    }

    // Cálculo automático para modo FRACIONADO
    if (isFractional) {
      const weight = parseFloat(
        (formData.contentPerUnit || '0').toString().replace(',', '.')
      );

      const priceKg = Number(formData.pricePerKg) || 0;
      const quantity = Math.max(1, Number(formData.currentQuantity) || 1);

      if (!isNaN(weight) && weight > 0) {
        let totalCost = 0;

        if (formData.measurementUnit === 'kg') {
          totalCost = weight * priceKg;
        } else if (formData.measurementUnit === 'g') {
          totalCost = (weight / 1000) * priceKg;
        }

        const unitCost = totalCost / quantity;
        const formattedPrice = Number(unitCost.toFixed(2));

        setFormData(prev => {
          if (prev.pricePerUnit === formattedPrice) return prev;
          return { ...prev, pricePerUnit: formattedPrice };
        });
      }
    }
  }, [
    formData.pricePerKg,
    formData.contentPerUnit,
    formData.measurementUnit,
    formData.consumptionType,
    formData.currentQuantity
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData as Product,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      currentQuantity: Number(formData.currentQuantity) || 0,
      minQuantity: Number(formData.minQuantity) || 0,
      pricePerUnit: Number(formData.pricePerUnit) || 0,
      pricePerKg: Number(formData.pricePerKg) || 0,
      status: formData.status || Status.NORMAL,
      consumptionType: formData.consumptionType || ConsumptionType.WHOLE
    });
  };

  const isWeightBased = formData.consumptionType === ConsumptionType.FRACTIONAL && ['kg', 'g'].includes(formData.measurementUnit || '');

  return (
    <div className="max-w-[800px] mx-auto px-4 py-8 pb-32 md:pb-8">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-2 text-[#618979] text-sm font-medium">
          <button onClick={onCancel} className="hover:text-primary transition-colors">Estoque</button>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-slate-900 dark:text-white font-bold">{product ? 'Editar' : 'Adicionar'} Produto</span>
        </div>
        <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight uppercase">
          {product ? 'Editar' : 'Adicionar'} Produto
        </h1>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Defina as métricas de controle e medidas para automação.</p>
      </div>

      <div className="bg-white dark:bg-[#1a2e26] rounded-3xl shadow-2xl shadow-primary/5 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-4 md:p-10 space-y-12">
          {/* Informações Básicas */}
          <div>
            <h3 className="text-slate-900 dark:text-white text-xs font-black mb-8 flex items-center gap-3 uppercase tracking-[0.2em] opacity-60">
              <span className="material-symbols-outlined text-primary text-xl font-black">info</span>
              Identificação
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Nome Comercial</label>
                <input
                  type="text"
                  required
                  className="w-full h-14 rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary px-5 text-base font-black transition-all"
                  placeholder="Ex: Arroz Integral 5kg"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Imagem do Produto (URL)</label>
                <div className="flex gap-4">
                  <input
                    type="url"
                    className="flex-1 h-14 rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary px-5 text-sm font-medium transition-all"
                    placeholder="https://exemplo.com/imagem.jpg"
                    value={formData.imageUrl}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                  {formData.imageUrl && (
                    <div className="size-14 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-800 shrink-0">
                      <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Cole um link direto para exibir a imagem no estoque.</p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Segmento (Categoria)</label>
                <select
                  className="w-full h-14 rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary px-5 font-black text-sm transition-all"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as Category })}
                >
                  {Object.values(Category).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Unidade de Venda (Embalagem)</label>
                <select
                  className="w-full h-14 rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary px-5 font-black text-sm transition-all"
                  value={formData.unit}
                  onChange={e => setFormData({ ...formData, unit: e.target.value })}
                >
                  {PURCHASE_UNITS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Medidas e Consumo */}
          <div>
            <h3 className="text-slate-900 dark:text-white text-xs font-black mb-8 flex items-center gap-3 uppercase tracking-[0.2em] opacity-60">
              <span className="material-symbols-outlined text-primary text-xl font-black">straighten</span>
              Métricas de Consumo
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Conteúdo Bruto Interno</label>
                <div className="flex group">
                  <input
                    type="text"
                    className="flex-1 min-w-0 h-14 rounded-l-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary px-3 md:px-5 font-black text-lg transition-all"
                    placeholder="Ex: 5"
                    value={formData.contentPerUnit}
                    onChange={e => setFormData({ ...formData, contentPerUnit: e.target.value })}
                  />
                  <select
                    className="w-24 md:w-32 h-14 rounded-r-2xl border-l-0 border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary font-black text-sm transition-all"
                    value={formData.measurementUnit}
                    onChange={e => setFormData({ ...formData, measurementUnit: e.target.value })}
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="un">un</option>
                    <option value="fatia">fatia</option>
                    <option value="dose">dose</option>
                  </select>
                </div>
                <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-widest italic">
                  {isWeightBased
                    ? `PESO TOTAL REFERENTE A ${formData.currentQuantity || 0} ITENS`
                    : `VOLUME OU PESO REAL DENTRO DE 01 ${formData.unit?.toUpperCase()}.`
                  }
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Dinâmica de Retirada</label>
                <div className="grid grid-cols-2 gap-3 h-14">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, consumptionType: ConsumptionType.WHOLE })}
                    className={`flex items-center justify-center rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${formData.consumptionType === ConsumptionType.WHOLE
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                      : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-primary/50'
                      }`}
                  >
                    Inteira
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, consumptionType: ConsumptionType.FRACTIONAL })}
                    className={`flex items-center justify-center rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${formData.consumptionType === ConsumptionType.FRACTIONAL
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                      : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-primary/50'
                      }`}
                  >
                    Fracionada
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Estoque */}
          <div className="pt-10 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-slate-900 dark:text-white text-xs font-black mb-8 flex items-center gap-3 uppercase tracking-[0.2em] opacity-60">
              <span className="material-symbols-outlined text-primary text-xl font-black">inventory</span>
              Gestão de Quantidades
            </h3>
            <div className={`grid grid-cols-1 md:grid-cols-3 ${isWeightBased ? 'lg:grid-cols-4' : ''} gap-8`}>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 min-h-[30px] flex items-end">
                  {isWeightBased ? 'Qtd de Itens (Un)' : `Qtd em Estoque (${formData.unit?.toUpperCase()}S)`}
                </label>
                <input
                  type="number"
                  step="1"
                  className="w-full h-16 rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 dark:text-white text-center font-black text-2xl font-mono focus:ring-primary"
                  value={formData.currentQuantity}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData({ ...formData, currentQuantity: val === '' ? '' : Number(val) });
                  }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 min-h-[30px] flex items-end">Mínimo para Alerta</label>
                <input
                  type="number"
                  className="w-full h-16 rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 dark:text-white text-center font-black text-2xl font-mono focus:ring-primary"
                  value={formData.minQuantity}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData({ ...formData, minQuantity: val === '' ? '' : Number(val) });
                  }}
                />
              </div>

              {/* Campo Preço por Kg - Condicional */}
              {isWeightBased && (
                <div className="animate-in fade-in zoom-in duration-300">
                  <label className="block text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3 min-h-[30px] flex items-end">Preço por Kg (BRL)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    className="w-full h-16 rounded-2xl border-primary/30 bg-primary/5 dark:bg-primary/10 dark:text-white text-center font-black text-2xl text-primary font-mono focus:ring-primary"
                    value={formData.pricePerKg === 0 ? '' : formData.pricePerKg}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData({ ...formData, pricePerKg: val === '' ? '' : Number(val) });
                    }}
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 min-h-[30px] flex items-end">
                  {formData.consumptionType === ConsumptionType.FRACTIONAL
                    ? 'Custo unitário do produto (BRL)'
                    : 'Custo do produto (BRL)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  readOnly={isWeightBased && (Number(formData.pricePerKg) || 0) > 0}
                  className={`w-full h-16 rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 dark:text-white text-center font-black text-2xl text-emerald-500 font-mono focus:ring-emerald-500 ${isWeightBased && (Number(formData.pricePerKg) || 0) > 0
                    ? 'opacity-80 cursor-not-allowed bg-slate-50'
                    : ''
                    }`}
                  value={formData.pricePerUnit === 0 ? '' : formData.pricePerUnit}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData({ ...formData, pricePerUnit: val === '' ? '' : Number(val) });
                  }}
                />
                {isWeightBased && (Number(formData.pricePerKg) || 0) > 0 && (
                  <p className="text-[9px] text-center mt-2 text-emerald-600 font-bold uppercase tracking-widest">
                    Calculado Automaticamente
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-slate-900 dark:text-white text-xs font-black mb-8 flex items-center gap-3 uppercase tracking-[0.2em] opacity-60">
              <span className="material-symbols-outlined text-primary text-xl font-black">event_available</span>
              Controle de Validade
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Data de Validade (Opcional)</label>
                <input
                  type="date"
                  className="w-full h-16 rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 dark:text-white px-5 text-base font-black transition-all focus:ring-primary uppercase tracking-widest text-slate-600 dark:text-slate-300"
                  value={formData.expirationDate || ''}
                  onChange={e => setFormData({ ...formData, expirationDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl flex items-center justify-between border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl transition-colors ${formData.isEssential ? 'bg-amber-500 shadow-lg shadow-amber-500/20' : 'bg-slate-200 dark:bg-slate-800'}`}>
                <span className={`material-symbols-outlined text-2xl font-black ${formData.isEssential ? 'text-white' : 'text-slate-400'}`}>priority_high</span>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Produto Essencial</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Itens essenciais ignoram teto orçamentário.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.isEssential}
                onChange={e => setFormData({ ...formData, isEssential: e.target.checked })}
              />
              <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex flex-col md:flex-row gap-4 pt-10 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-16 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
            >
              Descartar
            </button>
            <button
              type="submit"
              className="flex-[2] h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <span className="material-symbols-outlined font-black">save</span>
              Confirmar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductPage;