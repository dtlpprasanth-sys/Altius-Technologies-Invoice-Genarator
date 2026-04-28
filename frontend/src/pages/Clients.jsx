import React, { useEffect, useState } from 'react';
import { clientApi } from '../services/api';
import { 
  Plus, Trash2, Edit2, X, Check, Users, MapPin, 
  ShieldCheck, Phone, Mail, Landmark, ChevronDown, ChevronRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import ClientRegistrationModal from '../components/ClientRegistrationModal';

const emptyClient = {
  clientType: 'Business', name: '', displayName: '', clientCode: '', logoUrl: '',
  primaryContactName: '', email: '', phone: '', website: '',
  billingAddress: { address1: '', city: '', state: '', country: 'India', pincode: '' },
  gstin: '', panNumber: '', taxType: 'GST',
  preferredCurrency: 'INR', paymentTerms: 'Net 30'
};

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const fetchClients = async () => {
    setLoading(true);
    try { const { data } = await clientApi.getAll(); setClients(data); }
    catch { toast.error('Failed to load clients'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClients(); }, []);

  const openCreate = () => {
    setEditingClient(null);
    setIsClientModalOpen(true);
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setIsClientModalOpen(true);
  };


  return (
    <div className="p-10 bg-[#F8F9FD] min-h-screen animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">Clients</h2>
            <p className="text-slate-400 font-bold mt-1">Manage your professional relationships and global tax compliance</p>
          </div>
          <button 
            onClick={openCreate} 
            className="bg-[#8B5CF6] text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-purple-100 flex items-center gap-3 hover:scale-[1.02] transition-all active:scale-[0.98]"
          >
            <Plus size={20}/> Add New Client
          </button>
        </div>



        <ClientRegistrationModal 
          isOpen={isClientModalOpen} 
          onClose={() => {
            setIsClientModalOpen(false);
            setEditingClient(null);
          }} 
          editingClient={editingClient}
          onSuccess={fetchClients}
        />

        {/* Clients Grid */}
        {loading ? (
          <div className="flex justify-center py-48"><div className="w-16 h-16 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin"/></div>
        ) : clients.length === 0 ? (
          <div className="bg-white rounded-[3rem] border-4 border-dashed border-slate-100 p-32 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-slate-200">
              <Users size={48}/>
            </div>
            <h3 className="text-2xl font-black text-slate-800">No clients registered yet</h3>
            <p className="text-slate-400 font-bold mt-2 max-w-sm mx-auto leading-relaxed">Start by adding your first client to create professional tax-ready invoices.</p>
            <button onClick={openCreate} className="bg-[#8B5CF6] text-white font-black mt-10 inline-flex items-center gap-3 px-10 py-4 rounded-2xl shadow-xl shadow-purple-100 hover:scale-[1.02] transition-all">
              <Plus size={20}/> Add Your First Client
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
            {clients.map(c => (
              <div key={c._id} className="bg-white border border-slate-50 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300 group relative">
                <div className="absolute top-6 right-6 flex gap-2 translate-x-10 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                  <button onClick={()=>handleEdit(c)} className="w-10 h-10 flex items-center justify-center bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-600 hover:text-white transition-all"><Edit2 size={16}/></button>
                  <button onClick={()=>{ if(window.confirm(`Delete ${c.name}?`)) clientApi.delete(c._id).then(fetchClients) }} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                </div>
                
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 bg-[#1A1C2E] rounded-[1.25rem] flex items-center justify-center text-white text-2xl font-black shadow-lg">
                    {c.name.charAt(0).toLowerCase()}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-xl leading-tight">{c.name}</h4>
                    <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">{c.clientCode || 'Standard Client'}</span>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-4 text-slate-500 font-bold">
                    <Mail size={16} className="text-slate-300"/>
                    <span className="text-sm truncate">{c.email || 'No email registered'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-500 font-bold">
                    <Phone size={16} className="text-slate-300"/>
                    <span className="text-sm">{c.phone || 'No contact provided'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <ShieldCheck size={16} className="text-slate-300"/>
                    <span className="text-xs font-black bg-slate-50 text-slate-400 px-3 py-1.5 rounded-lg uppercase tracking-wider">GST: {c.gstin || 'UNREGISTERED'}</span>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-50">
                  <div className="flex gap-2">
                    <div className="px-3 py-1.5 bg-purple-50 rounded-lg text-[10px] font-black text-purple-600 uppercase tracking-widest">{c.preferredCurrency || 'INR'}</div>
                    <div className="px-3 py-1.5 bg-slate-50 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {c.defaultDueDate ? `NET ${c.defaultDueDate}` : 'DUE ON RECEIPT'}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-200 group-hover:text-purple-300 transition-colors"/>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Clients;
