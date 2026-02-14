
export enum Category {
  MERCEARIA = 'Mercearia',
  HORTIFRUTI = 'Hortifrúti',
  CARNES = 'Carnes, aves e peixes',
  LATICINIOS = 'Frios e laticínios',
  CONGELADOS = 'Congelados',
  PADARIA = 'Padaria e confeitaria',
  BEBIDAS = 'Bebidas',
  LIMPEZA = 'Limpeza doméstica',
  HIGIENE = 'Higiene pessoal',
  OUTROS = 'Outros'
}

export enum Status {
  NORMAL = 'Em estoque',
  WARNING = 'Acabando',
  CRITICAL = 'Sem estoque'
}

export enum ConsumptionType {
  WHOLE = 'WHOLE',
  FRACTIONAL = 'FRACTIONAL'
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  unit: string;
  contentPerUnit: string;
  measurementUnit: string;
  currentQuantity: number;
  minQuantity: number;
  pricePerUnit: number;
  pricePerKg?: number;
  isEssential: boolean;
  status: Status;
  consumptionType: ConsumptionType;
  imageUrl?: string;

  expirationDate?: string;
  averageConsumption?: number;

  priceHistory?: {
    price: number;
    date: string;
  }[];
}


export interface ShoppingItem extends Product {
  neededQuantity: number;
  isCompleted: boolean;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  category: Category;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseRecord {
  id: string;
  date: string;
  items: PurchaseItem[];
  totalAmount: number;
}

export type ReportPeriod = '7d' | '15d' | 'month' | 'year';

export type NotificationCategory = 'stock' | 'shopping' | 'financial';
export type NotificationType =
  | 'item_low'
  | 'item_out'
  | 'list_ready'
  | 'budget_exceeded'
  | 'price_increase'
  | 'unusual_consumption';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  type: NotificationType;
  icon: string;
  color: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export type ViewType = 'inventory' | 'shopping_list' | 'add_product' | 'reports';