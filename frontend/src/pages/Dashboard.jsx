import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { invoiceApi } from '../services/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import {
  FileText, DollarSign, Clock, CheckCircle, TrendingUp, Plus,
  ArrowUpRight, BarChart3, Users
} from 'lucide-react';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, sub, icon: Icon, color, trend, trendUp }) => (
  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
    <div className="flex items-center gap-2 mt-2">
      {trend && (
        <span className={`text-xs font-bold px-2 py-1 rounded-md ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trendUp ? '↑' : '↓'} {trend}
        </span>
      )}
      {sub && <span className="text-xs font-medium text-slate-400">{sub}</span>}
    </div>
  </div>
);

const Dashboard = () => {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, overdue: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await invoiceApi.getAll({ limit: 100 });
        const inv = data.invoices || [];
        setInvoices(inv.slice(0, 5));
        const paid = inv.filter(i => i.status === 'paid');
        const pending = inv.filter(i => i.status === 'sent' || i.status === 'draft');
        const overdue = inv.filter(i => i.status === 'overdue');
        const revenue = paid.reduce((s, i) => s + (i.totalInINR || i.total || 0), 0);
        
        // Mock logic for charting connected to actual total revenue
        const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
        const mockChart = months.map((m, i) => ({
          name: m,
          revenue: i === 5 ? (revenue || 42000) : Math.floor(Math.random() * 30000) + 10000
        }));
        setChartData(mockChart);

        const pendingAmount = pending.reduce((s, i) => s + (i.total || 0), 0);
        const overdueAmount = overdue.reduce((s, i) => s + (i.total || 0), 0);
        
        setStats({ total: inv.length, paid: paid.length, pending: pendingAmount, overdue: overdueAmount, revenue });
      } catch {
        /* empty */
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === 'paid') return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">Paid</span>;
    if (s === 'draft') return <span className="bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">Draft</span>;
    if (s === 'overdue') return <span className="bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">Overdue</span>;
    return <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">{status || 'Pending'}</span>;
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-8 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-500 text-sm mt-0.5">Welcome back! Here's your overview.</p>
        </div>
        <Link to="/invoices/new" className="bg-[#8B5CF6] text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-purple-200 hover:bg-[#7C3AED] transition-all flex items-center gap-2">
          <Plus size={18} /> New Invoice
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Invoices" value={stats.total} icon={FileText} color="bg-purple-500" trend="12% from last month" trendUp={true} />
        <StatCard title="Total Revenue" value={formatCurrency(stats.revenue)} icon={DollarSign} color="bg-emerald-500" trend="8% from last month" trendUp={true} />
        <StatCard title="Pending Amount" value={formatCurrency(stats.pending)} icon={Clock} color="bg-amber-500" trend="5% from last month" trendUp={false} />
        <StatCard title="Overdue Amount" value={formatCurrency(stats.overdue)} icon={CheckCircle} color="bg-rose-500" sub="Needs immediate attention" />
      </div>

      {/* Revenue Chart Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] mb-8">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <TrendingUp size={20} className="text-purple-600" />
          Revenue Overview
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} tickFormatter={(val) => `₹${val/1000}k`} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                formatter={(value) => [formatCurrency(value), 'Revenue']}
              />
              <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={4} dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#8B5CF6', strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 size={20} className="text-purple-600" />
            Recent Invoices
          </h3>
          <Link to="/invoices" className="text-sm text-purple-600 font-bold hover:text-purple-700 flex items-center gap-1 hover:underline">
            View all <ArrowUpRight size={16} />
          </Link>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 mt-4">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm border border-slate-100">
              <FileText size={32} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No invoices found.</h3>
            <p className="text-slate-500 font-medium mb-6">Create your first one to see stats here!</p>
            <Link to="/invoices/new" className="bg-purple-600 text-white font-bold text-sm px-8 py-3 rounded-xl shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all flex items-center gap-2 mx-auto w-max">
              <Plus size={18} /> Create Invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice #</th>
                  <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Client</th>
                  <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv._id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                    <td className="py-4 px-4 font-bold text-slate-800">{inv.invoiceNumber}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-100 to-indigo-100 text-purple-700 flex items-center justify-center text-xs font-bold border border-purple-200 flex-shrink-0">
                          {getInitials(inv.clientName)}
                        </div>
                        <span className="font-semibold text-slate-700 truncate max-w-[150px]">{inv.clientName || '-'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm font-medium text-slate-500">{formatDate(inv.invoiceDate)}</td>
                    <td className="py-4 px-4 font-bold text-slate-800">{formatCurrency(inv.total, inv.currency)}</td>
                    <td className="py-4 px-4">{statusBadge(inv.status)}</td>
                    <td className="py-4 px-4 text-right">
                      <Link to={`/invoices/${inv._id}`} className="text-xs text-purple-600 font-bold hover:underline px-3 py-1.5 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
