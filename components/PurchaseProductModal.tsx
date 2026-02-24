import React, { useState, useEffect } from 'react';
import { Product, ConsumptionType } from '../types';

interface PurchaseProductModalProps {
    product: Product;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (purchaseData: {
        quantity: number;
        unitPrice: number;
        packagingSize?: number;
        purchaseDate: string;
        weightBought?: number;
        unitsReceived?: number;
    }) => void;
}

const PurchaseProductModal: React.FC<PurchaseProductModalProps> = ({ product, isOpen, onClose, onConfirm }) => {
    const [quantity, setQuantity] = useState<string>('');
    const [unitPrice, setUnitPrice] = useState<string>(''); // For 'unidade' this is the unit price paid. For 'kg' it will be calculated as totalCost / units.
    const [packagingSize, setPackagingSize] = useState<string>('');
    const [purchaseDate, setPurchaseDate] = useState<string>('');

    // Novas propriedades (para o fluxo de "kg")
    const [weightBought, setWeightBought] = useState<string>('');
    const [pricePerKgPaid, setPricePerKgPaid] = useState<string>('');
    const [unitsReceived, setUnitsReceived] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            setQuantity('1');
            setUnitPrice(product.pricePerUnit.toString());
            setPackagingSize(product.contentPerUnit || '');
            setPurchaseDate(new Date().toISOString().split('T')[0]);
        }
    }, [isOpen, product]);

    const isPurchaseByKg = product.purchaseUnit === 'kg';
    const isWeightBased = product.consumptionType === ConsumptionType.FRACTIONAL && ['kg', 'g'].includes(product.measurementUnit);

    useEffect(() => {
        if (isOpen && isPurchaseByKg) {
            setPricePerKgPaid(product.pricePerKg ? product.pricePerKg.toString() : '');
            setUnitsReceived(quantity || '1');
            setWeightBought(packagingSize || '');
        }
    }, [isOpen, isPurchaseByKg, product.pricePerKg, quantity, packagingSize]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isPurchaseByKg) {
            const weight = Number(weightBought?.replace(',', '.')) || 0;
            const priceKg = Number(pricePerKgPaid) || 0;
            const units = Number(unitsReceived) || 1;

            const totalPaid = weight * priceKg;
            const unitPriceCalculated = totalPaid / units;

            onConfirm({
                quantity: units,
                unitPrice: Number(unitPriceCalculated.toFixed(2)),
                packagingSize: undefined, // Ignorado ao usar weightBought pois a semântica mudou
                purchaseDate,
                weightBought: weight,
                unitsReceived: units
            });
        } else {
            onConfirm({
                quantity: Number(quantity) || 1,
                unitPrice: Number(unitPrice) || 0,
                packagingSize: packagingSize ? parseFloat(packagingSize.replace(',', '.')) : undefined,
                purchaseDate
            });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Nova Compra</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Registrar entrada no estoque</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-rose-100 hover:text-rose-500 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    </div>

                    <div className="mt-4 flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="size-10 object-cover rounded-lg" />
                        ) : (
                            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-[20px] font-bold">package_2</span>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h4 className="font-black text-slate-900 dark:text-white truncate">{product.name}</h4>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{product.category}</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {isPurchaseByKg ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Data da Compra</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 dark:text-white px-4 text-sm font-bold transition-all focus:ring-primary uppercase tracking-widest"
                                        value={purchaseDate}
                                        onChange={e => setPurchaseDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Peso Total Pago (kg)</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        required
                                        placeholder="Ex: 1.5"
                                        className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 dark:text-white px-4 text-center font-black text-xl font-mono focus:ring-primary"
                                        value={weightBought}
                                        onChange={e => setWeightBought(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Preço por Kg Pago</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">R$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            placeholder="0,00"
                                            className="w-full h-12 rounded-xl border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 pl-10 pr-4 text-center font-black text-xl font-mono focus:ring-emerald-500"
                                            value={pricePerKgPaid}
                                            onChange={e => setPricePerKgPaid(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Qtd de {product.unit} (Itens)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        step="1"
                                        className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 dark:text-white px-4 text-center font-black text-xl font-mono focus:ring-primary"
                                        value={unitsReceived}
                                        onChange={e => setUnitsReceived(e.target.value)}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Data da Compra</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 dark:text-white px-4 text-sm font-bold transition-all focus:ring-primary uppercase tracking-widest"
                                        value={purchaseDate}
                                        onChange={e => setPurchaseDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                        Qtd Comprada <span className="lowercase normal-case font-normal text-slate-400">({product.unit}s)</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0.1"
                                        step="0.1"
                                        className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 dark:text-white px-4 text-center font-black text-xl font-mono focus:ring-primary"
                                        value={quantity}
                                        onChange={e => setQuantity(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Preço Unitário Pago</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">R$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            placeholder="0,00"
                                            className="w-full h-12 rounded-xl border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 pl-10 pr-4 text-center font-black text-xl font-mono focus:ring-emerald-500"
                                            value={unitPrice}
                                            onChange={e => setUnitPrice(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {isWeightBased && (
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Peso da Embalagem <span className="lowercase normal-case font-normal text-slate-400">({product.measurementUnit})</span></label>
                                        <input
                                            type="text"
                                            placeholder="Ex: 5.0"
                                            className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 dark:text-white px-4 text-center font-black text-lg focus:ring-primary"
                                            value={packagingSize}
                                            onChange={e => setPackagingSize(e.target.value)}
                                        />
                                    </div>
                                )}
                                {!isWeightBased && (
                                    <div>
                                        {/* Espaço vazio se não for peso, ou outro dado útil */}
                                        <label className="block text-[10px] items-center text-slate-400 uppercase tracking-widest mb-2 opacity-50">&nbsp;</label>
                                        <div className="w-full h-12 rounded-xl bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50 flex items-center justify-center text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                                            Não aplicável
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    <div className="pt-2">
                        <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex gap-3">
                            <span className="material-symbols-outlined text-primary text-xl">info</span>
                            <div>
                                <p className="text-[10px] font-black uppercase text-primary tracking-widest">Atenção</p>
                                <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                                    Isso irá adicionar a Qtd no Saldo Atual e sobrescrever o Preço Base Vigente no cadastro.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-[1] h-12 rounded-xl text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] h-12 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/30 hover:brightness-110 active:scale-95 transition-all"
                        >
                            Registrar Compra
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PurchaseProductModal;
