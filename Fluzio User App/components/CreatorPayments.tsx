import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Send,
  Download,
  Eye,
  X
} from 'lucide-react';
import {
  getCreatorInvoices,
  getEarningsSummary,
  createInvoice,
  sendInvoice,
  updateInvoiceStatus,
  Invoice,
  EarningsSummary,
  InvoiceItem
} from '../services/creatorPaymentService';

interface CreatorPaymentsProps {
  creatorId: string;
  creatorName: string;
}

const CreatorPayments: React.FC<CreatorPaymentsProps> = ({ creatorId, creatorName }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | Invoice['status']>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  // Form state for creating invoice
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    projectName: '',
    dueDate: '',
    taxRate: 0,
    notes: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }] as InvoiceItem[]
  });

  useEffect(() => {
    loadData();
  }, [creatorId, selectedStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invoicesData, earningsData] = await Promise.all([
        getCreatorInvoices(creatorId, selectedStatus === 'ALL' ? undefined : selectedStatus),
        getEarningsSummary(creatorId)
      ]);
      setInvoices(invoicesData);
      setEarnings(earningsData);
    } catch (error) {
      console.error('Error loading payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!formData.clientName || !formData.clientEmail || formData.items.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    const result = await createInvoice(
      creatorId,
      creatorName,
      '', // clientId - would be populated if client is a registered user
      formData.clientName,
      formData.clientEmail,
      formData.items,
      new Date(formData.dueDate),
      formData.taxRate,
      formData.notes,
      undefined,
      formData.projectName || undefined
    );

    if (result.success) {
      setShowCreateModal(false);
      resetForm();
      loadData();
    } else {
      alert(`Error creating invoice: ${result.error}`);
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    const result = await sendInvoice(invoiceId);
    if (result.success) {
      loadData();
    } else {
      alert(`Error sending invoice: ${result.error}`);
    }
  };

  const handleMarkPaid = async (invoiceId: string) => {
    const result = await updateInvoiceStatus(invoiceId, 'PAID', new Date());
    if (result.success) {
      loadData();
    } else {
      alert(`Error marking invoice as paid: ${result.error}`);
    }
  };

  const resetForm = () => {
    setFormData({
      clientName: '',
      clientEmail: '',
      projectName: '',
      dueDate: '',
      taxRate: 0,
      notes: '',
      items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }]
    });
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-calculate total
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]
    });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculateInvoiceTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * (formData.taxRate / 100);
    return { subtotal, tax, total: subtotal + tax };
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'PAID': return 'text-green-600 bg-green-100';
      case 'SENT': return 'text-blue-600 bg-blue-100';
      case 'OVERDUE': return 'text-red-600 bg-red-100';
      case 'DRAFT': return 'text-gray-600 bg-gray-100';
      case 'CANCELLED': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'PAID': return <CheckCircle className="w-4 h-4" />;
      case 'SENT': return <Send className="w-4 h-4" />;
      case 'OVERDUE': return <AlertCircle className="w-4 h-4" />;
      case 'DRAFT': return <FileText className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading && !earnings) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const { subtotal, tax, total } = calculateInvoiceTotal();

  return (
    <div className="space-y-6">
      {/* Earnings Summary */}
      {earnings && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium opacity-90">Total Earnings</span>
              <DollarSign className="w-5 h-5 opacity-90" />
            </div>
            <p className="text-3xl font-bold">{formatCurrency(earnings.totalEarnings)}</p>
            <p className="text-xs mt-2 opacity-75">{earnings.paidInvoices} invoices paid</p>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Pending</span>
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(earnings.pendingEarnings)}</p>
            <p className="text-xs mt-2 text-gray-500">Awaiting payment</p>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">This Month</span>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(earnings.thisMonthEarnings)}</p>
            <p className="text-xs mt-2 text-gray-500">
              {earnings.lastMonthEarnings > 0 
                ? `${((earnings.thisMonthEarnings / earnings.lastMonthEarnings - 1) * 100).toFixed(1)}% vs last month`
                : 'First month'}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Avg Invoice</span>
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(earnings.averageInvoiceValue)}</p>
            <p className="text-xs mt-2 text-gray-500">{earnings.totalInvoices} total invoices</p>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['ALL', 'DRAFT', 'SENT', 'PAID', 'OVERDUE'] as const).map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedStatus === status
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </button>
      </div>

      {/* Invoices List */}
      <div className="space-y-3">
        {invoices.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No invoices found</p>
            <p className="text-sm text-gray-500 mt-1">Create your first invoice to get started</p>
          </div>
        ) : (
          invoices.map(invoice => (
            <div key={invoice.id} className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-emerald-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm font-semibold text-gray-900">{invoice.invoiceNumber}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      {invoice.status}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{invoice.clientName}</h3>
                  <p className="text-sm text-gray-600 mb-3">{invoice.clientEmail}</p>
                  
                  {invoice.projectName && (
                    <p className="text-sm text-gray-500 mb-2">Project: {invoice.projectName}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Due: {formatDate(invoice.dueDate)}</span>
                    <span>•</span>
                    <span>{invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 mb-4">{formatCurrency(invoice.total)}</p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewingInvoice(invoice)}
                      className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {invoice.status === 'DRAFT' && (
                      <button
                        onClick={() => handleSendInvoice(invoice.id)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Send"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    
                    {invoice.status === 'SENT' && (
                      <button
                        onClick={() => handleMarkPaid(invoice.id)}
                        className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                        title="Mark as Paid"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Create New Invoice</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Client Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    placeholder="Acme Corp"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Email *
                  </label>
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    placeholder="client@acme.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    placeholder="Brand Campaign"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Invoice Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Invoice Items *
                  </label>
                  <button
                    onClick={addItem}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                        placeholder="Description"
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-20 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                        placeholder="Qty"
                        min="1"
                      />
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-28 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                        placeholder="Price"
                        min="0"
                        step="0.01"
                      />
                      <div className="w-28 px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-right">
                        ${item.total.toFixed(2)}
                      </div>
                      {formData.items.length > 1 && (
                        <button
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  placeholder="0"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  rows={3}
                  placeholder="Additional notes or payment instructions..."
                />
              </div>

              {/* Invoice Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({formData.taxRate}%):</span>
                  <span className="font-medium">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-gray-200">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateInvoice}
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
                >
                  Create Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Invoice Details</h2>
              <button
                onClick={() => setViewingInvoice(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Invoice Number</p>
                  <p className="font-mono text-lg font-bold">{viewingInvoice.invoiceNumber}</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(viewingInvoice.status)}`}>
                  {getStatusIcon(viewingInvoice.status)}
                  {viewingInvoice.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">From</p>
                  <p className="font-semibold">{viewingInvoice.creatorName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">To</p>
                  <p className="font-semibold">{viewingInvoice.clientName}</p>
                  <p className="text-sm text-gray-600">{viewingInvoice.clientEmail}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Issue Date</p>
                  <p className="font-medium">{formatDate(viewingInvoice.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Due Date</p>
                  <p className="font-medium">{formatDate(viewingInvoice.dueDate)}</p>
                </div>
              </div>

              {viewingInvoice.projectName && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Project</p>
                  <p className="font-medium">{viewingInvoice.projectName}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Items</p>
                <div className="space-y-2">
                  {viewingInvoice.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-gray-600">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                      </div>
                      <p className="font-semibold">{formatCurrency(item.total)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t-2 border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(viewingInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax ({viewingInvoice.taxRate}%):</span>
                  <span className="font-medium">{formatCurrency(viewingInvoice.tax)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-2 border-t-2 border-gray-200">
                  <span>Total:</span>
                  <span>{formatCurrency(viewingInvoice.total)}</span>
                </div>
              </div>

              {viewingInvoice.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Notes</p>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{viewingInvoice.notes}</p>
                </div>
              )}

              {viewingInvoice.paidDate && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-green-800">
                    Paid on {formatDate(viewingInvoice.paidDate)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorPayments;
