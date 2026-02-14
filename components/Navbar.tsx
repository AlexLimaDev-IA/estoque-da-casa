import React, { useState, useRef, useEffect } from 'react';
import { ViewType, AppNotification } from '../types';

interface NavbarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  userName: string;
  userPhoto: string;
  onProfileUpdate: (name: string, photo: string) => void;
  notifications: AppNotification[];
  onDismissNotification: (id: string) => void;
  onDismissAll: () => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  userName,
  userPhoto,
  onProfileUpdate,
  notifications,
  onDismissNotification,
  onDismissAll,
  onLogout
}) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [editPhoto, setEditPhoto] = useState(userPhoto);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOpenProfile = () => {
    setEditName(userName);
    setEditPhoto(userPhoto);
    setShowProfile(true);
    setShowNotifications(false);
  };

  const handleSave = () => {
    onProfileUpdate(editName, editPhoto);
    setShowProfile(false);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setEditPhoto(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setEditPhoto('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const displayPhoto = userPhoto || 'https://picsum.photos/seed/user/100/100';

  const getIconColor = (color: string) => {
    switch (color) {
      case 'rose': return 'text-rose-500 bg-rose-500/10';
      case 'amber': return 'text-amber-500 bg-amber-500/10';
      case 'primary': return 'text-primary bg-primary/10';
      default: return 'text-slate-500 bg-slate-100';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => onViewChange('inventory')} className="flex items-center gap-3">
                <div className="bg-primary rounded-lg p-1.5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-2xl">inventory_2</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white hidden sm:block">
                  Estoque da Casa
                </h1>
              </button>
            </div>

            <nav className="hidden md:flex items-center gap-1 sm:gap-6">
              <button
                onClick={() => onViewChange('inventory')}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${currentView === 'inventory' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                Estoque
              </button>
              <button
                onClick={() => onViewChange('shopping_list')}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${currentView === 'shopping_list' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                Lista de Compras
              </button>
              <button
                onClick={() => onViewChange('reports')}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${currentView === 'reports' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                Relatórios
              </button>
            </nav>

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative flex size-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="material-symbols-outlined">notifications</span>
                  {notifications.length > 0 && (
                    <span className="absolute top-2 right-2 size-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_10px_40px_-5px_rgba(0,0,0,0.15)] border border-slate-200 dark:border-slate-800 overflow-hidden transform origin-top-right transition-all z-50">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Notificações</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{notifications.length} alertas</p>
                      </div>
                      {notifications.length > 0 && (
                        <button
                          onClick={onDismissAll}
                          className="text-[10px] font-bold text-primary hover:text-primary-hover uppercase tracking-widest hover:bg-primary/10 px-2 py-1 rounded transition-colors"
                        >
                          Limpar tudo
                        </button>
                      )}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center flex flex-col items-center gap-3">
                          <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                            <span className="material-symbols-outlined text-2xl">notifications_off</span>
                          </div>
                          <p className="text-xs font-bold text-slate-400">Nenhuma notificação nova.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {notifications.map(notif => (
                            <div key={notif.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group relative">
                              <div className="flex gap-4">
                                <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${getIconColor(notif.color)}`}>
                                  <span className="material-symbols-outlined text-xl">{notif.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{notif.title}</h4>
                                    <span className="text-[10px] font-medium text-slate-400 shrink-0">Agora</span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDismissNotification(notif.id);
                                  }}
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-all rounded"
                                >
                                  <span className="material-symbols-outlined text-base">close</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Button */}
              <button
                onClick={handleOpenProfile}
                className="h-10 w-10 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center overflow-hidden transition-transform hover:scale-110 active:scale-95 cursor-pointer"
              >
                <img className="w-full h-full object-cover" alt="User avatar" src={displayPhoto} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowProfile(false)}
          />
          {/* Modal */}
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Meu Perfil</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-1">Personalize seu perfil</p>
              </div>
              <button
                onClick={() => setShowProfile(false)}
                className="size-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Photo Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <div className="size-24 rounded-full bg-primary/20 border-3 border-primary flex items-center justify-center overflow-hidden shadow-lg shadow-primary/10">
                    {editPhoto ? (
                      <img className="w-full h-full object-cover" alt="User avatar" src={editPhoto} />
                    ) : (
                      <span className="material-symbols-outlined text-4xl text-primary/50">person</span>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 size-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-110 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                  >
                    Escolher foto
                  </button>
                  {editPhoto && (
                    <>
                      <span className="text-slate-300">|</span>
                      <button
                        onClick={handleRemovePhoto}
                        className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                      >
                        Remover
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Nome</label>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="material-symbols-outlined text-slate-400 text-xl">person</span>
                  <input
                    type="text"
                    placeholder="Digite seu nome..."
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => setShowProfile(false)}
                className="flex-1 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-white bg-primary hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95"
              >
                Salvar
              </button>
            </div>

            <div className="p-6 pt-0">
              <button
                onClick={onLogout}
                className="w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 transition-all"
              >
                Sair da Conta
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;