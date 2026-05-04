import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { clientApi } from '../services/api';
import { 
  Plus, Trash2, Edit3, X, Check, Users, MapPin, 
  ShieldCheck, Phone, Mail, Landmark, ChevronDown, ChevronRight,
  MoreHorizontal, Search, ExternalLink, Globe, LayoutGrid
} from 'lucide-react';
import { toast } from 'react-toastify';
import ConfirmDialog from '../components/ConfirmDialog';
import ClientRegistrationModal from '../components/ClientRegistrationModal';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null, name: '' });

  const fetchClients = async () => {
    setLoading(true);
    try { 
      const { data } = await clientApi.getAll(); 
      setClients(data); 
    }
    catch { 
      toast.error('Failed to load clients'); 
    }
    finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchClients(); 

    // Synchronization: Refresh on focus
    const handleFocus = () => fetchClients();
    window.addEventListener('focus', handleFocus);
    
    // Synchronization: Polling (15s)
    const interval = setInterval(fetchClients, 15000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  const openCreate = () => {
    setEditingClient(null);
    setIsClientModalOpen(true);
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setIsClientModalOpen(true);
  };

  const handleDelete = (id, name) => {
    setDeleteDialog({ isOpen: true, id, name });
  };

  const confirmDelete = async () => {
    try {
      await clientApi.delete(deleteDialog.id);
      toast.success('Client deleted successfully');
      fetchClients();
    } catch {
      toast.error('Failed to delete client');
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
      <div className="w-10 h-10 border-4 border-[#95BF47]/20 border-t-[#95BF47] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF8] animate-fade-in">
      
      {/* PAGE HEADER */}
      <header className="h-16 bg-white border-b border-[#E4E4E0] flex items-center justify-between px-8 sticky top-0 z-20">
        <div className="page-header-left">
          <h1 className="text-[26px] font-bold text-[#0C0E10] leading-tight font-heading">Clients</h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5 font-medium">Manage your professional relationships and global tax compliance</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={openCreate} className="btn-green-sm ml-2 flex items-center gap-2 h-9 px-4 rounded-[5px] bg-[#95BF47] text-[#02172E] font-bold text-sm hover:bg-[#85AF37] transition-all">
            <Plus size={16} strokeWidth={3} /> Add New Client
          </button>
        </div>
      </header>

      {/* PAGE BODY */}
      <div className="page-body p-8 px-8 max-w-[1400px] mx-auto w-full">
        
        {/* CONTROL BAR */}
        <div className="control-bar h-[52px] bg-white border border-[#E4E4E0] rounded-[5px] flex items-center justify-between px-5 mb-6 shadow-sm">
          <div className="filter-tabs flex items-center gap-6 h-full">
            <div className="filter-tab active h-full flex items-center text-[13px] font-bold text-[#0C0E10] border-b-2 border-[#95BF47] cursor-pointer px-1">Active Clients</div>
          </div>
          <div className="search-box flex items-center bg-white border border-[#E4E4E0] rounded-[5px] w-[300px] h-9 px-3 transition-all focus-within:border-[#95BF47] focus-within:ring-4 focus-within:ring-[#95BF47]/10">
            <Search size={16} className="text-[#6B7280] shrink-0" />
            <input 
              type="text" 
              className="ml-2 bg-transparent border-none outline-none text-[13px] text-[#0C0E10] w-full placeholder:text-[#6B7280]" 
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* CLIENTS GRID */}
        {filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            {filteredClients.map(c => (
              <div key={c.id} className="client-card panel shadow-sm hover:shadow-md transition-all group flex flex-col min-h-[220px]">
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-12 h-12 bg-[#02172E] rounded-[5px] flex items-center justify-center text-white text-[18px] font-bold shadow-lg shadow-navy/10 group-hover:scale-105 transition-transform">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(c)}
                        className="w-8 h-8 flex items-center justify-center text-[#6B7280] hover:text-[#95BF47] hover:bg-[#F3F8E8] rounded-[3px] transition-all"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(c.id, c.name)}
                        className="w-8 h-8 flex items-center justify-center text-[#6B7280] hover:text-[#CC3A3A] hover:bg-[#CC3A3A]/10 rounded-[3px] transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <h4 className="font-heading text-[18px] font-bold text-[#0C0E10] mb-1 truncate">{c.name}</h4>
                  <div className="text-[11px] font-bold text-[#95BF47] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <ShieldCheck size={12} /> {c.clientType || 'Business'}
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5 text-[#6B7280]">
                      <Mail size={14} className="shrink-0" />
                      <span className="text-[13px] truncate font-medium">{c.email || 'No email registered'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[#6B7280]">
                      <Globe size={14} className="shrink-0" />
                      <span className="text-[13px] truncate font-medium">{c.billingAddress?.country || 'No address'}</span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-[#FAFAF8] border-t border-[#E4E4E0] flex items-center justify-between rounded-b-[5px]">
                  <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                    {c.clientCode || 'STD-CLIENT'}
                  </span>
                  <Link 
                    to={`/invoices?search=${encodeURIComponent(c.name)}`}
                    className="text-[#95BF47] hover:text-[#85AF37] transition-colors flex items-center gap-1 text-[13px] font-bold"
                  >
                    View Invoices <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[5px] border border-[#E4E4E0] shadow-sm">
            <div className="w-20 h-20 bg-[#FAFAF8] rounded-full flex items-center justify-center text-[#D0D0CA] mb-6">
              <Users size={40} />
            </div>
            <h3 className="text-[22px] font-bold text-[#0C0E10] font-heading">No clients found</h3>
            <p className="text-[14px] text-[#6B7280] mt-1 max-w-[360px] text-center">
              {searchQuery ? "Try adjusting your search filters." : "Start by adding your first client to create professional, tax-ready invoices."}
            </p>
            {!searchQuery && (
              <button onClick={openCreate} className="btn-primary mt-8 h-12 px-10">
                Register Your First Client
              </button>
            )}
          </div>
        )}
      </div>

      {/* MODAL: CLIENT REGISTRATION */}
      <ClientRegistrationModal 
        isOpen={isClientModalOpen} 
        onClose={() => {
          setIsClientModalOpen(false);
          setEditingClient(null);
        }} 
        editingClient={editingClient}
        onSuccess={fetchClients}
      />

      <ConfirmDialog 
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ ...deleteDialog, isOpen: false })}
        onConfirm={confirmDelete}
        title="Delete Client"
        message={`Are you sure you want to delete "${deleteDialog.name}"? This will remove all their records and compliance history.`}
        confirmText="Delete Client"
      />
    </div>
  );
};

export default Clients;
