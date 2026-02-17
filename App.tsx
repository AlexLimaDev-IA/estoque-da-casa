import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import AuthPage from './pages/AuthPage';
import { ViewType, Product, Category, Status, ConsumptionType, PurchaseRecord, AppNotification } from './types';
import Navbar from './components/Navbar';
import InventoryPage from './pages/InventoryPage';
import ShoppingListPage from './pages/ShoppingListPage';
import AddProductPage from './pages/AddProductPage';
import ReportsPage from './pages/ReportsPage';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('inventory');
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [shoppingListIds, setShoppingListIds] = useState<Set<string>>(new Set());
  const [userName, setUserName] = useState<string>('');
  const [userPhoto, setUserPhoto] = useState<string>('');
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRecord[]>([]);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Auth Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email: string | undefined) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, photo_data')
        .eq('id', userId)
        .single();

      if (data) {
        if (data.display_name) setUserName(data.display_name);
        if (data.photo_data) setUserPhoto(data.photo_data);
      } else if (email) {
        // Fallback to email if no profile exists yet
        setUserName(email.split('@')[0]);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Fetch Data
  const fetchData = async () => {
    if (!session?.user) return;

    try {
      // Products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (productsError) throw productsError;

      // Map DB fields to App types if necessary (snake_case to camelCase)
      const mappedProducts: Product[] = (productsData || []).map(p => ({
        id: p.id,
        name: p.name,
        category: p.category as Category,
        unit: p.unit,
        contentPerUnit: p.content_per_unit || '1',
        measurementUnit: p.measurement_unit || 'un',
        currentQuantity: Number(p.current_quantity),
        minQuantity: Number(p.min_quantity),
        pricePerUnit: Number(p.price_per_unit),
        pricePerKg: Number(p.price_per_kg),
        isEssential: p.is_essential,
        status: p.status as Status,
        consumptionType: p.consumption_type as ConsumptionType,
        imageUrl: p.image_url,
        expirationDate: p.expiration_date,
        averageConsumption: Number(p.average_consumption || 0),
        // Price history would ideally be a separate fetch or join, but for now we might leave empty or fetch if needed
        // For simplicity in this step, we'll initialize empty and maybe fetch on demand or in a refined query
        priceHistory: []
      }));

      // Calculate status locally to be sure
      const syncedProducts = syncProducts(mappedProducts);
      setProducts(syncedProducts);

      // Shopping List (Manually added items)
      // In this version, we'll store manually added IDs in local state or fetch from a table if we implemented `shopping_list` table fully for manual adds.
      // The requirement plan said `shopping_list` table exists.
      const { data: listData, error: listError } = await supabase
        .from('shopping_list')
        .select('product_id, is_completed')
        .eq('is_completed', false);

      if (listError) throw listError;

      const ids = new Set((listData || []).map(i => i.product_id));
      setShoppingListIds(ids);

      // Purchase History
      const { data: historyData, error: historyError } = await supabase
        .from('purchase_history')
        .select('*')
        .order('date', { ascending: false });

      if (historyError) throw historyError;

      const mappedHistory: PurchaseRecord[] = (historyData || []).map(h => ({
        id: h.id,
        date: h.date,
        totalAmount: Number(h.total_amount),
        items: h.items // jsonb should map directly if structure matches
      }));
      setPurchaseHistory(mappedHistory);

    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Erro ao carregar dados. Verifique sua conexão.');
    }
  };

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  // Gera notificações dinâmicas baseadas no estado atual
  const notifications = useMemo<AppNotification[]>(() => {
    const now = new Date().toISOString();
    const notifs: AppNotification[] = [];

    // ── ESTOQUE ──
    products.forEach(p => {
      if (p.currentQuantity <= 0) {
        notifs.push({
          id: `out_${p.id}`,
          category: 'stock',
          type: 'item_out',
          icon: 'error',
          color: 'rose',
          title: 'Sem Estoque',
          message: `${p.name} está sem estoque.`,
          timestamp: now,
          read: false
        });
      } else if (p.currentQuantity <= p.minQuantity) {
        notifs.push({
          id: `low_${p.id}`,
          category: 'stock',
          type: 'item_low',
          icon: 'warning',
          color: 'amber',
          title: 'Item Acabando',
          message: `${p.name} está abaixo do mínimo (${p.currentQuantity}/${p.minQuantity}).`,
          timestamp: now,
          read: false
        });
      }
    });

    // ── COMPRAS ──
    // Consider items in shopping list (low stock OR manually added)
    const lowStockItems = products.filter(p => p.currentQuantity < p.minQuantity).map(p => p.id);
    const allShoppingIds = new Set([...lowStockItems, ...Array.from(shoppingListIds)]);

    if (allShoppingIds.size > 0) {
      notifs.push({
        id: 'list_ready',
        category: 'shopping',
        type: 'list_ready',
        icon: 'checklist',
        color: 'primary',
        title: 'Lista Pronta',
        message: `Há ${allShoppingIds.size} ${allShoppingIds.size === 1 ? 'item' : 'itens'} para comprar.`,
        timestamp: now,
        read: false
      });
    }

    // ── FINANCEIRO ──
    // (Simplificado por enquanto, pois priceHistory precisa ser buscado detalhadamente)

    return notifs.filter(n => !dismissedNotifications.has(n.id));
  }, [products, shoppingListIds, dismissedNotifications]);

  const handleDismissNotification = (id: string) => {
    setDismissedNotifications(prev => new Set(prev).add(id));
  };

  const handleDismissAllNotifications = () => {
    setDismissedNotifications(prev => {
      const next = new Set(prev);
      notifications.forEach(n => next.add(n.id));
      return next;
    });
  };

  // Sincroniza o status visual baseado nas regras de negócio
  const syncProducts = (list: Product[]) => {
    return list.map(p => {
      let status = Status.NORMAL;
      if (p.currentQuantity <= 0) {
        status = Status.CRITICAL;
      } else if (p.currentQuantity <= p.minQuantity) {
        status = Status.WARNING;
      }
      return { ...p, status };
    });
  };

  const handleConsume = async (id: string, amount: number = 1) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    let newQuantity = product.currentQuantity;
    let newContentPerUnit = product.contentPerUnit;

    if (product.consumptionType === ConsumptionType.WHOLE) {
      newQuantity = Math.max(0, product.currentQuantity - 1);
    } else {
      const initialQuantity = product.currentQuantity;
      if (initialQuantity <= 0) return;
      newQuantity = Math.max(0, initialQuantity - amount);

      if (['kg', 'g'].includes(product.measurementUnit)) {
        const totalWeight = parseFloat((product.contentPerUnit || '0').toString().replace(',', '.'));
        if (!isNaN(totalWeight) && totalWeight > 0 && initialQuantity > 0) {
          const weightPerUnit = totalWeight / initialQuantity;
          const newWeight = weightPerUnit * newQuantity;
          newContentPerUnit = newWeight.toFixed(3);
        }
      }
    }

    // Optimistic Update
    setProducts(prev => syncProducts(prev.map(p => p.id === id ? { ...p, currentQuantity: newQuantity, contentPerUnit: newContentPerUnit } : p)));

    // DB Update
    const { error } = await supabase
      .from('products')
      .update({
        current_quantity: newQuantity,
        content_per_unit: newContentPerUnit,
        status: newQuantity <= 0 ? Status.CRITICAL : newQuantity <= product.minQuantity ? Status.WARNING : Status.NORMAL
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating stock:', error);
      fetchData(); // Revert on error
    }
  };


  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    // Optimistic
    setProducts(prev => prev.filter(p => p.id !== id));

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      console.error('Error deleting product', error);
      fetchData();
    }
  };

  const handleSaveProduct = async (newProduct: Product) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const productToSave = {
      user_id: user.id,
      name: newProduct.name,
      category: newProduct.category,
      unit: newProduct.unit,
      content_per_unit: newProduct.contentPerUnit,
      measurement_unit: newProduct.measurementUnit,
      current_quantity: newProduct.currentQuantity,
      min_quantity: newProduct.minQuantity,
      price_per_unit: newProduct.pricePerUnit,
      price_per_kg: newProduct.pricePerKg,
      is_essential: newProduct.isEssential,
      status: newProduct.status,
      consumption_type: newProduct.consumptionType,
      image_url: newProduct.imageUrl,
      expiration_date: newProduct.expirationDate,
      average_consumption: newProduct.averageConsumption
    };

    if (newProduct.id && products.some(p => p.id === newProduct.id)) {
      // Update
      const { error } = await supabase
        .from('products')
        .update(productToSave)
        .eq('id', newProduct.id);

      if (error) {
        console.error('Error updating product:', error);
        alert(`Erro ao atualizar produto: ${error.message}`);
      } else {
        fetchData();
        setEditingProduct(null);
        setCurrentView('inventory');
      }
    } else {
      // Insert
      const { error } = await supabase.from('products').insert(productToSave);
      if (error) {
        console.error('Error creating product:', error);
        alert(`Erro ao criar produto: ${error.message}`);
      } else {
        fetchData();
        setEditingProduct(null);
        setCurrentView('inventory');
      }
    }
  };

  const handleConfirmPurchase = async (purchasedQuantities: Record<string, number>) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    // Build purchase record
    const purchaseItems = Object.entries(purchasedQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId);
        if (!product) return null;
        return {
          productId,
          productName: product.name,
          category: product.category,
          quantity,
          unitPrice: product.pricePerUnit,
          total: product.pricePerUnit * quantity
        };
      })
      .filter(Boolean) as any[];

    if (purchaseItems.length === 0) return;

    const totalAmount = purchaseItems.reduce((sum: number, item: any) => sum + item.total, 0);

    // 1. Save Purchase History
    const { error: histError } = await supabase.from('purchase_history').insert({
      user_id: user.id,
      date: new Date().toISOString(),
      total_amount: totalAmount,
      items: purchaseItems
    });

    if (histError) {
      console.error('Error saving history', histError);
      alert('Erro ao salvar compra');
      return;
    }

    // 2. Update Products & Price History
    // Note: In a real app we'd use a transaction or RPC. For now we loop.
    for (const item of purchaseItems) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        // Create price history entry
        await supabase.from('historical_prices').insert({
          product_id: product.id,
          price: product.pricePerUnit,
          date: new Date().toISOString().split('T')[0]
        });

        // Update quantity
        await supabase.from('products').update({
          current_quantity: product.currentQuantity + item.quantity,
          status: Status.NORMAL // Assuming bought items restore status
        }).eq('id', product.id);
      }
    }

    // 3. Clear Shopping List (Manual adds)
    // We assume purchased means we accept the suggested list or manual adds.
    // If we had a 'shopping_list' table sync, we would delete/update items here.
    // For manual adds stored in Supabase:
    if (shoppingListIds.size > 0) {
      // Convert Set to array
      const ids = Array.from(shoppingListIds);
      // Remove from DB or mark completed
      await supabase.from('shopping_list').delete().in('product_id', ids);
    }

    setShoppingListIds(new Set());
    setCurrentView('inventory');
    fetchData(); // Refresh all data
  };


  const handleEditProduct = (p: Product) => {
    setEditingProduct(p);
    setCurrentView('add_product');
  };

  const handleManualAddToList = async (id: string) => {
    // Toggle logic: if in list, remove. If not, add.
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    if (shoppingListIds.has(id)) {
      // Remove
      const { error } = await supabase.from('shopping_list').delete().match({ product_id: id, user_id: user.id });
      if (!error) {
        setShoppingListIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } else {
      // Add
      const { error } = await supabase.from('shopping_list').insert({
        user_id: user.id,
        product_id: id,
        needed_quantity: 1, // Default, can be improved
        is_completed: false
      });
      if (!error) {
        setShoppingListIds(prev => new Set(prev).add(id));
      }
    }
  };

  const handleRemoveFromList = (id: string) => {
    // Just an alias for manual add (toggle)
    handleManualAddToList(id);
  };


  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-400">Carregando...</div>;
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      <Navbar
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          if (view !== 'add_product') setEditingProduct(null);
        }}
        userName={userName}
        userPhoto={userPhoto}
        onProfileUpdate={async (name, photo) => {
          setUserName(name);
          setUserPhoto(photo);

          if (session?.user) {
            const { error } = await supabase
              .from('profiles')
              .upsert({
                id: session.user.id,
                display_name: name,
                photo_data: photo,
                updated_at: new Date().toISOString()
              });

            if (error) {
              console.error('Error saving profile:', error);
              alert('Erro ao salvar perfil');
            }
          }
        }}
        notifications={notifications}
        onDismissNotification={handleDismissNotification}
        onDismissAll={handleDismissAllNotifications}
        onLogout={() => supabase.auth.signOut()}
      />

      <main className="flex-grow">
        {currentView === 'inventory' && (
          <InventoryPage
            products={products}
            onConsume={handleConsume}
            onEdit={handleEditProduct}
            onAddClick={() => setCurrentView('add_product')}
          />
        )}
        {currentView === 'shopping_list' && (
          <ShoppingListPage
            products={products}
            manuallyAddedIds={shoppingListIds}
            onRemoveFromList={handleRemoveFromList}
            onManualAdd={handleManualAddToList}
            onQuantityChange={(id, qty) => { }}
            onConfirmPurchase={handleConfirmPurchase}
          />
        )}
        {currentView === 'add_product' && (
          <AddProductPage
            product={editingProduct}
            onSave={handleSaveProduct}
            onCancel={() => {
              setEditingProduct(null);
              setCurrentView('inventory');
            }}
          />
        )}
        {currentView === 'reports' && (
          <ReportsPage products={products} purchaseHistory={purchaseHistory} />
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-background-dark border-t border-primary/10 flex justify-around items-center py-3 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button onClick={() => setCurrentView('inventory')} className={`flex flex-col items-center gap-1 ${currentView === 'inventory' ? 'text-primary' : 'text-gray-400'}`}>
          <span className="material-symbols-outlined">inventory</span>
          <span className="text-[10px] font-bold">Estoque</span>
        </button>
        <button onClick={() => setCurrentView('shopping_list')} className={`flex flex-col items-center gap-1 ${currentView === 'shopping_list' ? 'text-primary' : 'text-gray-400'}`}>
          <span className="material-symbols-outlined">shopping_cart</span>
          <span className="text-[10px] font-bold">Lista</span>
        </button>
        <button onClick={() => setCurrentView('reports')} className={`flex flex-col items-center gap-1 ${currentView === 'reports' ? 'text-primary' : 'text-gray-400'}`}>
          <span className="material-symbols-outlined">history</span>
          <span className="text-[10px] font-bold">Relatórios</span>
        </button>
      </nav>
    </div>
  );
};

export default App;