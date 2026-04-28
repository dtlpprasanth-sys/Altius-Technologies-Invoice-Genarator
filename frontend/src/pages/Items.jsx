import React, { useEffect, useState } from 'react';
import { productApi } from '../services/api';
import { Plus, Trash2, Edit2, Box, X, Check } from 'lucide-react';
import { toast } from 'react-toastify';

const Items = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', hsnCode: '' });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await productApi.getAll();
      setItems(data);
    } catch {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ name: '', hsnCode: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ name: item.name, hsnCode: item.hsnCode || '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete item "${name}"?`)) {
      try {
        await productApi.delete(id);
        toast.success('Item deleted');
        fetchItems();
      } catch {
        toast.error('Failed to delete item');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Item Name is required');
    
    try {
      if (editingItem) {
        await productApi.update(editingItem.id, formData);
        toast.success('Item updated');
      } else {
        await productApi.create(formData);
        toast.success('Item created');
      }
      setIsModalOpen(false);
      fetchItems();
    } catch {
      toast.error('Failed to save item');
    }
  };

  return (
    <div className="p-10 bg-[#F8F9FD] min-h-screen animate-fade-in">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">Item Master</h2>
            <p className="text-slate-400 font-bold mt-1">Manage your products and services with HSN/SAC codes</p>
          </div>
          <button 
            onClick={openCreate} 
            className="bg-[#8B5CF6] text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-purple-100 flex items-center gap-3 hover:scale-[1.02] transition-all active:scale-[0.98]"
          >
            <Plus size={20}/> Add New Item
          </button>
        </div>

        {/* Items List */}
        {loading ? (
          <div className="flex justify-center py-48"><div className="w-16 h-16 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin"/></div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-[3rem] border-4 border-dashed border-slate-100 p-32 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-slate-200">
              <Box size={48}/>
            </div>
            <h3 className="text-2xl font-black text-slate-800">No items registered yet</h3>
            <p className="text-slate-400 font-bold mt-2 max-w-sm mx-auto leading-relaxed">Add your products or services here so you can easily select them while creating invoices.</p>
            <button onClick={openCreate} className="bg-[#8B5CF6] text-white font-black mt-10 inline-flex items-center gap-3 px-10 py-4 rounded-2xl shadow-xl shadow-purple-100 hover:scale-[1.02] transition-all">
              <Plus size={20}/> Add Your First Item
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-widest w-1/2">Item Name</th>
                  <th className="py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-widest w-1/4">HSN / SAC Code</th>
                  <th className="py-5 px-8 text-right text-xs font-black text-slate-400 uppercase tracking-widest w-1/4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors last:border-0 group">
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                          <Box size={18} />
                        </div>
                        <span className="font-bold text-slate-800 text-base">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-5 px-8">
                      {item.hsnCode ? (
                        <span className="px-3 py-1.5 bg-slate-100 text-slate-600 font-bold text-xs rounded-lg uppercase tracking-wider">{item.hsnCode}</span>
                      ) : (
                        <span className="text-slate-400 text-sm font-medium italic">-</span>
                      )}
                    </td>
                    <td className="py-5 px-8 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(item)} className="w-9 h-9 flex items-center justify-center bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-600 hover:text-white transition-all">
                          <Edit2 size={16}/>
                        </button>
                        <button onClick={() => handleDelete(item.id, item.name)} className="w-9 h-9 flex items-center justify-center bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
              <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-black text-slate-800">{editingItem ? 'Edit Item' : 'New Item'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm">
                  <X size={16}/>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Item Name <span className="text-rose-500">*</span></label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-600/10 transition-all placeholder:font-medium placeholder:text-slate-400" 
                    placeholder="Enter product or service name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">HSN / SAC Code</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-600/10 transition-all placeholder:font-medium placeholder:text-slate-400" 
                    placeholder="Enter HSN or SAC code"
                    value={formData.hsnCode}
                    onChange={e => setFormData({ ...formData, hsnCode: e.target.value })}
                  />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leave blank if not applicable</p>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-50">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors text-sm">
                    Cancel
                  </button>
                  <button type="submit" className="bg-[#8B5CF6] text-white font-black px-8 py-3 rounded-xl shadow-lg shadow-purple-200 hover:bg-[#7C3AED] transition-all flex items-center gap-2 text-sm">
                    <Check size={16} strokeWidth={3}/> {editingItem ? 'Save Changes' : 'Create Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Items;
