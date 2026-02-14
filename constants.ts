import { Product, Category, Status, ConsumptionType } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Arroz Integral 5kg',
    category: Category.MERCEARIA,
    unit: 'Pacote',
    contentPerUnit: '5',
    measurementUnit: 'kg',
    currentQuantity: 2,
    minQuantity: 1,
    pricePerUnit: 25.90,
    isEssential: true,
    status: Status.NORMAL,
    consumptionType: ConsumptionType.WHOLE,
    averageConsumption: 0.15,
    priceHistory: [
      { price: 23.90, date: '2024-01-01' },
      { price: 25.90, date: '2024-02-01' }
    ]
  },
  {
    id: '2',
    name: 'Tomate Italiano',
    category: Category.HORTIFRUTI,
    unit: 'Pacote',
    contentPerUnit: '500',
    measurementUnit: 'g',
    currentQuantity: 1,
    minQuantity: 2,
    pricePerUnit: 8.20,
    isEssential: false,
    status: Status.WARNING,
    consumptionType: ConsumptionType.FRACTIONAL,
    averageConsumption: 0.2,
    priceHistory: [
      { price: 9.60, date: '2024-01-01' },
      { price: 8.20, date: '2024-02-01' }
    ]
  },
  {
    id: '3',
    name: 'Leite Integral 1L',
    category: Category.LATICINIOS,
    unit: 'Caixa',
    contentPerUnit: '1',
    measurementUnit: 'L',
    currentQuantity: 1,
    minQuantity: 6,
    pricePerUnit: 5.45,
    isEssential: true,
    status: Status.WARNING,
    consumptionType: ConsumptionType.FRACTIONAL,
    averageConsumption: 0.25,
    priceHistory: [
      { price: 5.10, date: '2024-01-01' },
      { price: 5.45, date: '2024-02-01' }
    ]
  },
  {
    id: '4',
    name: 'Feijão Preto 1kg',
    category: Category.MERCEARIA,
    unit: 'Pacote',
    contentPerUnit: '1',
    measurementUnit: 'kg',
    currentQuantity: 0,
    minQuantity: 2,
    pricePerUnit: 8.20,
    isEssential: true,
    status: Status.CRITICAL,
    consumptionType: ConsumptionType.WHOLE,
    averageConsumption: 0.1,
    priceHistory: [
      { price: 7.40, date: '2024-01-01' },
      { price: 8.20, date: '2024-02-01' }
    ]
  },
  {
    id: '9',
    name: 'Ovos Brancos',
    category: Category.MERCEARIA,
    unit: 'Cartela',
    contentPerUnit: '20',
    measurementUnit: 'un',
    currentQuantity: 1,
    minQuantity: 1,
    pricePerUnit: 14.50,
    isEssential: true,
    status: Status.WARNING,
    consumptionType: ConsumptionType.FRACTIONAL,
    averageConsumption: 0.5,
    priceHistory: [
      { price: 13.20, date: '2024-01-01' },
      { price: 14.50, date: '2024-02-01' }
    ]
  }
];
