import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { invoiceApi } from '../services/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import {
  TrendingUp, Plus, Search, Bell, ArrowRight, 
  Clock, CheckCircle, AlertCircle, FileText,
  UserPlus, PackagePlus, Zap
} from 'lucide-react';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('6M');
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({ 
    totalCount: 0, 
    draftCount: 0, 
    submittedCount: 0,
    totalRevenue: 0, 
    pendingAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);

  useEffect(() => {
    const fetchData = async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const { data } = await invoiceApi.getAll({ limit: 500 });
        const inv = Array.isArray(data) ? data : (data.invoices || []);
        setAllInvoices(inv);
        
        const drafts    = inv.filter(i => i.status?.toLowerCase() === 'draft');
        const submitted = inv.filter(i => i.status?.toLowerCase() === 'sent');
        
        const revenue  = submitted.reduce((s, i) => s + (i.total || 0), 0);
        const pendAmt  = drafts.reduce((s, i) => s + (i.total || 0), 0);

        setStats({
          totalCount:     inv.length,
          draftCount:     drafts.length,
          submittedCount: submitted.length,
          totalRevenue:   revenue,
          pendingAmount:  pendAmt
        });

        setInvoices(inv.slice(0, 5));
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        if (!silent) setLoading(false);
      }
    };
    fetchData();

    // Synchronization: Refresh data when window gets focus (e.g. user switches back to tab)
    const handleFocus = () => fetchData(true);
    window.addEventListener('focus', handleFocus);

    // Synchronization: Background polling every 30 seconds
    const interval = setInterval(() => fetchData(true), 30000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (allInvoices.length === 0) return;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const rangeCount = timeRange === '3M' ? 3 : timeRange === '6M' ? 6 : 12;
    const dataPoints = [];

    for (let i = rangeCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      dataPoints.push({
        month: d.getMonth(),
        year: d.getFullYear(),
        name: monthNames[d.getMonth()],
        revenue: 0
      });
    }

    allInvoices.forEach(i => {
      const idate = new Date(i.invoiceDate);
      const imonth = idate.getMonth();
      const iyear = idate.getFullYear();
      const target = dataPoints.find(m => m.month === imonth && m.year === iyear);
      if (target && i.status?.toLowerCase() === 'sent') {
        target.revenue += (i.total || 0);
      }
    });

    setChartData(dataPoints.map(m => ({ name: m.name, revenue: m.revenue })));
  }, [allInvoices, timeRange]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#FAFAF8]">
      <div className="w-10 h-10 border-4 border-[#95BF47]/20 border-t-[#95BF47] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF8] animate-fade-in">
      
      {/* PAGE HEADER */}
      <header className="h-16 bg-white border-b border-[#E4E4E0] flex items-center justify-between px-8 sticky top-0 z-20">
        <div className="page-header-left">
          <h1 className="text-[26px] font-bold text-[#0C0E10] leading-tight font-heading">Dashboard</h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5 font-medium">Welcome back! Here's your overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/invoices/new" className="btn-green-sm ml-2 flex items-center gap-2 h-9 px-4 rounded-[5px] bg-[#95BF47] text-[#02172E] font-bold text-sm hover:bg-[#85AF37] transition-all">
            <Plus size={16} strokeWidth={3} /> New Invoice
          </Link>
        </div>
      </header>

      <div className="page-body p-6 px-8 max-w-[1600px] mx-auto w-full">
        
        {/* KPI BAND */}
        <div className="bg-white border border-[#E4E4E0] rounded-[5px] flex mb-6 shadow-sm overflow-hidden divide-x divide-[#E4E4E0]">
          <div className="flex-1 p-5 px-6">
            <div className="kpi-label">Total Invoices</div>
            <div className="kpi-value">{stats.totalCount}</div>
          </div>
          <div className="flex-1 p-5 px-6">
            <div className="kpi-label">Total Revenue</div>
            <div className="kpi-value">{formatCurrency(stats.totalRevenue)}</div>
          </div>
          <div className="flex-1 p-5 px-6">
            <div className="kpi-label">Draft Invoices</div>
            <div className="kpi-value">{stats.draftCount}</div>
            <div className="text-[12px] text-[#D97706] font-bold mt-1.5 flex items-center gap-1">Pending submission</div>
          </div>
          <div className="flex-1 p-5 px-6">
            <div className="kpi-label">Submitted Invoices</div>
            <div className="kpi-value">{stats.submittedCount}</div>
            <div className="text-[12px] text-[#95BF47] font-bold mt-1.5">Successfully submitted</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
          
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            
            {/* REVENUE OVERVIEW */}
            <div className="panel shadow-sm">
              <div className="flex items-center justify-between p-6 pb-0">
                <h3 className="text-[18px] font-bold text-[#0C0E10] font-heading">Revenue Overview</h3>
                <div className="flex gap-4">
                  {['3M', '6M', '1Y'].map(tab => (
                    <button 
                      key={tab} 
                      onClick={() => setTimeRange(tab)}
                      className={`text-[12px] font-bold pb-1 border-b-2 transition-all ${timeRange === tab ? 'text-[#0C0E10] border-[#95BF47]' : 'text-[#6B7280] border-transparent hover:text-[#0C0E10]'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-6 h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#95BF47" stopOpacity={0.12}/>
                        <stop offset="95%" stopColor="#95BF47" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="#F4F4F1" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 600 }} 
                      dy={10} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 600 }} 
                      tickFormatter={(val) => `₹${val/1000}k`} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '5px', border: '1px solid #E4E4E0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontFamily: 'Manrope' }}
                      itemStyle={{ fontWeight: 700, color: '#0C0E10' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#95BF47" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#colorRev)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RECENT INVOICES */}
            <div className="panel shadow-sm">
              <div className="flex items-center justify-between p-6 pb-4">
                <h3 className="text-[18px] font-bold text-[#0C0E10] font-heading">Recent Invoices</h3>
                <Link to="/invoices" className="text-[13px] font-bold text-[#95BF47] hover:underline flex items-center gap-1">
                  View all <ArrowRight size={14} />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#02172E] text-white">
                    <tr>
                      <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider">Invoice No</th>
                      <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider">Client</th>
                      <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E4E0]">
                    {invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-[#F3F8E8] transition-all group cursor-pointer" onClick={() => navigate(`/invoices/${inv.id}/edit`)}>
                        <td className="px-6 py-4 text-[14px] font-bold text-[#0C0E10]">{inv.invoiceNumber}</td>
                        <td className="px-6 py-4 text-[14px] text-[#0C0E10]">{inv.clientName}</td>
                        <td className="px-6 py-4 text-[13px] text-[#6B7280]">{formatDate(inv.invoiceDate)}</td>
                        <td className="px-6 py-4 text-[14px] font-bold text-right text-[#0C0E10]">{formatCurrency(inv.total, inv.currency)}</td>
                        <td className="px-6 py-4">
                          <span className={`status-badge ${
                            inv.status?.toLowerCase() === 'sent'  ? 'status-sent' :
                            inv.status?.toLowerCase() === 'draft' ? 'status-draft' :
                            'status-pending'
                          }`}>
                            {inv.status?.toLowerCase() === 'sent' ? 'Submitted' : (inv.status || 'Draft')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            
            {/* QUICK ACTIONS */}
            <div className="panel shadow-sm p-6 py-8">
              <h3 className="text-[18px] font-bold text-[#0C0E10] font-heading mb-6">Quick Actions</h3>
              <div className="space-y-1">
                <Link to="/invoices/new" className="flex items-center justify-between p-3.5 px-5 rounded-[5px] hover:bg-[#F3F8E8] transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-[5px] bg-[#F3F8E8] flex items-center justify-center text-[#95BF47] group-hover:bg-[#95BF47] group-hover:text-white transition-all">
                      <Zap size={18} fill="currentColor" />
                    </div>
                    <span className="text-[14px] font-medium text-[#0C0E10]">Create New Invoice</span>
                  </div>
                  <ArrowRight size={16} className="text-[#6B7280] opacity-0 group-hover:opacity-100 transition-all" />
                </Link>
                <Link to="/clients" className="flex items-center justify-between p-3.5 px-5 rounded-[5px] hover:bg-[#F3F8E8] transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-[5px] bg-[#02172E]/5 flex items-center justify-center text-[#02172E] group-hover:bg-[#02172E] group-hover:text-white transition-all">
                      <UserPlus size={18} />
                    </div>
                    <span className="text-[14px] font-medium text-[#0C0E10]">Add New Client</span>
                  </div>
                  <ArrowRight size={16} className="text-[#6B7280] opacity-0 group-hover:opacity-100 transition-all" />
                </Link>
                <Link to="/items" className="flex items-center justify-between p-3.5 px-5 rounded-[5px] hover:bg-[#F3F8E8] transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-[5px] bg-[#CC3A3A]/5 flex items-center justify-center text-[#CC3A3A] group-hover:bg-[#CC3A3A] group-hover:text-white transition-all">
                      <PackagePlus size={18} />
                    </div>
                    <span className="text-[14px] font-medium text-[#0C0E10]">Add Item to Master</span>
                  </div>
                  <ArrowRight size={16} className="text-[#6B7280] opacity-0 group-hover:opacity-100 transition-all" />
                </Link>
              </div>

              <div className="mt-10 pt-8 border-t border-[#E4E4E0]">
                <h3 className="text-[18px] font-bold text-[#0C0E10] font-heading mb-6">Invoice Status</h3>
                <div className="h-2 w-full rounded-full bg-[#E4E4E0] overflow-hidden flex">
                  <div style={{ width: `${(stats.draftCount / (stats.totalCount || 1)) * 100}%` }} className="bg-[#D97706] h-full transition-all duration-1000"></div>
                  <div style={{ width: `${(stats.submittedCount / (stats.totalCount || 1)) * 100}%` }} className="bg-[#95BF47] h-full transition-all duration-1000"></div>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-[2px] bg-[#D97706]"></div>
                      <span className="text-[12px] text-[#6B7280] font-medium">Draft</span>
                    </div>
                    <span className="text-[12px] font-bold text-[#0C0E10]">{stats.draftCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-[2px] bg-[#95BF47]"></div>
                      <span className="text-[12px] text-[#6B7280] font-medium">Submitted</span>
                    </div>
                    <span className="text-[12px] font-bold text-[#0C0E10]">{stats.submittedCount}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
