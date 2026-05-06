import React, { useEffect, useState } from 'react';
import { productApi } from '../services/api';
import { 
  Plus, Trash2, Edit3, Box, X, Check, Search, 
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import ConfirmDialog from '../components/ConfirmDialog';

const Items = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null, name: '' });
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({ name: '', hsnCode: '998313' });

  const fetchItems = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await productApi.getAll();
      setItems(data);
    } catch {
      if (!silent) toast.error('Failed to load items');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { 
    fetchItems(); 

    // Synchronization: Refresh on focus
    const handleFocus = () => {
      if (!isModalOpen) fetchItems(true);
    };
    window.addEventListener('focus', handleFocus);

    // Synchronization: Polling (15s)
    const interval = setInterval(() => {
      if (!isModalOpen) fetchItems(true);
    }, 15000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [isModalOpen]);

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ name: '', hsnCode: '998313' });
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ name: item.name, hsnCode: item.hsnCode || '' });
    setIsModalOpen(true);
  };

  const handleDelete = (id, name) => {
    setDeleteDialog({ isOpen: true, id, name });
  };

  const confirmDelete = async () => {
    try {
      await productApi.delete(deleteDialog.id);
      toast.success('Item deleted');
      fetchItems();
    } catch {
      toast.error('Failed to delete item');
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

  // Filter and Paginate
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.hsnCode && item.hsnCode.includes(searchQuery))
  );

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

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
          <h1 className="text-[26px] font-bold text-[#0C0E10] leading-tight font-heading">Item Master</h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5 font-medium">Manage your products and services with HSN/SAC codes</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={openCreate} className="btn-green-sm ml-2 flex items-center gap-2 h-9 px-4 rounded-[5px] bg-[#95BF47] text-[#02172E] font-bold text-sm hover:bg-[#85AF37] transition-all">
            <Plus size={16} strokeWidth={3} /> New Item Entry
          </button>
        </div>
      </header>

      {/* PAGE BODY */}
      <div className="page-body p-8 px-8 max-w-[1400px] mx-auto w-full">
        
        {/* CONTROL BAR */}
        <div className="control-bar h-[52px] bg-white border border-[#E4E4E0] rounded-[5px] flex items-center justify-between px-5 mb-4 shadow-sm">
          <div className="filter-tabs flex items-center gap-6 h-full">
            <div className="filter-tab active h-full flex items-center text-[13px] font-bold text-[#0C0E10] border-b-2 border-[#95BF47] cursor-pointer px-1">All Items</div>
          </div>
          <div className="search-box flex items-center bg-white border border-[#E4E4E0] rounded-[5px] w-[280px] h-9 px-3 transition-all focus-within:border-[#95BF47] focus-within:ring-4 focus-within:ring-[#95BF47]/10">
            <Search size={16} className="text-[#6B7280] shrink-0" />
            <input 
              type="text" 
              className="ml-2 bg-transparent border-none outline-none text-[13px] text-[#0C0E10] w-full placeholder:text-[#6B7280]" 
              placeholder="Search by name or HSN code..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
          </div>
        </div>

        {/* TABLE CONTAINER */}
        <div className="table-container panel shadow-sm">
          <table className="data-table w-full border-collapse">
            <thead className="table-head bg-[#02172E]">
              <tr>
                <th className="text-white text-[11px] font-bold uppercase tracking-wider text-left px-6 h-12">Item Name</th>
                <th className="text-white text-[11px] font-bold uppercase tracking-wider text-left px-6 h-12 w-[200px]">HSN / SAC Code</th>
                <th className="text-white text-[11px] font-bold uppercase tracking-wider text-center px-6 h-12 w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item.id} className="group border-b border-[#E4E4E0] hover:bg-[#F3F8E8] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#FAFAF8] group-hover:bg-white rounded-[5px] flex items-center justify-center text-[#6B7280] transition-colors border border-[#E4E4E0]">
                          <Box size={16} />
                        </div>
                        <span className="text-[14px] font-bold text-[#0C0E10]">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.hsnCode ? (
                        <span className="text-[13px] font-bold text-[#6B7280] bg-[#FAFAF8] px-2 py-1 rounded-[3px] border border-[#E4E4E0] group-hover:bg-white group-hover:border-[#95BF47]/30 transition-all">
                          {item.hsnCode}
                        </span>
                      ) : (
                        <span className="text-[#D0D0CA] italic text-[13px]">No Code</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="table-actions flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(item)}
                          className="w-8 h-8 flex items-center justify-center text-[#6B7280] hover:text-[#95BF47] hover:bg-white rounded-[5px] transition-all"
                          title="Edit Item"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id, item.name)}
                          className="w-8 h-8 flex items-center justify-center text-[#6B7280] hover:text-[#CC3A3A] hover:bg-white rounded-[5px] transition-all"
                          title="Delete Item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">
                    <div className="flex flex-col items-center justify-center py-20 bg-white">
                      <div className="w-16 h-16 bg-[#FAFAF8] rounded-full flex items-center justify-center text-[#D0D0CA] mb-4">
                        <Box size={32} />
                      </div>
                      <h3 className="text-[18px] font-bold text-[#0C0E10] font-heading">No items found</h3>
                      <p className="text-[14px] text-[#6B7280] mt-1 max-w-[300px] text-center">
                        {searchQuery ? "Try searching for a different term." : "Start by adding your first product or service."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* PAGINATION */}
          <div className="pagination flex items-center justify-between px-6 py-3 bg-white border-t border-[#E4E4E0]">
            <span className="text-[13px] text-[#6B7280]">
              Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredItems.length)} of {filteredItems.length} items
            </span>
            <div className="page-nums flex items-center gap-1">
              <button 
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`w-8 h-8 flex items-center justify-center rounded-[5px] transition-all ${
                  currentPage === 1 ? 'text-[#D0D0CA] cursor-not-allowed' : 'text-[#6B7280] hover:bg-[#F3F8E8] hover:text-[#95BF47]'
                }`}
              >
                <ChevronLeft size={18} />
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => paginate(i + 1)}
                  className={`w-8 h-8 flex items-center justify-center text-[13px] font-bold rounded-[5px] transition-all ${
                    currentPage === i + 1 
                    ? 'bg-[#F3F8E8] text-[#95BF47] border border-[#95BF47]/20' 
                    : 'text-[#6B7280] hover:bg-[#FAFAF8]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button 
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`w-8 h-8 flex items-center justify-center rounded-[5px] transition-all ${
                  (currentPage === totalPages || totalPages === 0) ? 'text-[#D0D0CA] cursor-not-allowed' : 'text-[#6B7280] hover:bg-[#F3F8E8] hover:text-[#95BF47]'
                }`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: NEW ITEM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#02172E]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-[5px] w-full max-w-md shadow-2xl overflow-hidden animate-scale-up border border-[#E4E4E0]">
            <div className="modal-header px-6 py-4 border-b border-[#E4E4E0] flex items-center justify-between bg-[#FAFAF8]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#02172E] rounded-[3px] flex items-center justify-center text-white text-[14px]">📦</div>
                <h3 className="text-[18px] font-bold text-[#0C0E10] font-heading">{editingItem ? 'Edit Item' : 'New Item Entry'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-[#6B7280] hover:text-[#0C0E10] transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="field-group">
                <label className="field-label text-[11px] font-bold uppercase tracking-[0.15em] text-[#6B7280] mb-1.5 block">Item Name <span className="text-[#CC3A3A]">*</span></label>
                <input 
                  className="field-input w-full" 
                  placeholder="e.g. Software Development"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              
              <div className="field-group">
                <label className="field-label text-[11px] font-bold uppercase tracking-[0.15em] text-[#6B7280] mb-1.5 block">HSN / SAC Code</label>
                <input 
                  className="field-input w-full" 
                  placeholder="e.g. 998313"
                  value={formData.hsnCode}
                  onChange={e => setFormData({ ...formData, hsnCode: e.target.value })}
                />
                <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mt-1.5">Leave blank if not applicable</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E4E4E0]">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-[13px] font-bold text-[#6B7280] hover:text-[#0C0E10] px-4">
                  Cancel
                </button>
                <button type="submit" className="btn-navy h-10 px-6 text-sm">
                  <Check size={16} className="mr-2" strokeWidth={3} /> {editingItem ? 'Save Changes' : 'Create Item Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog 
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ ...deleteDialog, isOpen: false })}
        onConfirm={confirmDelete}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteDialog.name}"? This will remove it from your product list.`}
        confirmText="Delete Item"
      />
    </div>
  );
};

export default Items;
