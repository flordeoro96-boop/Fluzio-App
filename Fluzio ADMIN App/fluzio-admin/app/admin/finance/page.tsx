'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
} from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Transaction, Payout, PayoutStatus } from '@/lib/types';
import { getTransactionsAction, getPayoutsAction, updatePayoutStatusAction } from './actions';

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<PayoutStatus>('PAID');
  const [failReason, setFailReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load transactions
      const txnFilters: any = {};
      if (typeFilter !== 'ALL') txnFilters.type = typeFilter;
      if (searchQuery) txnFilters.search = searchQuery;
      const txnResult = await getTransactionsAction(txnFilters);
      setTransactions(txnResult.transactions);

      // Load payouts
      const payoutFilters: any = {};
      if (statusFilter !== 'ALL') payoutFilters.status = statusFilter;
      if (searchQuery) payoutFilters.search = searchQuery;
      const payoutResult = await getPayoutsAction(payoutFilters);
      setPayouts(payoutResult.payouts);
    } catch (err: any) {
      setError(err.message || 'Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setTransactionsPage(1);
    setPayoutsPage(1);
    loadData();
  };

  const handleFilterChange = () => {
    loadData();
  };

  const exportTransactionsToCSV = () => {
    const headers = ['ID', 'Type', 'Amount', 'Currency', 'Source Type', 'Dest Type', 'Country', 'Date'];
    const rows = transactions.map(txn => [
      txn.id,
      txn.type,
      txn.amount,
      txn.currency,
      txn.sourceEntityType,
      txn.destEntityType,
      txn.countryId,
      txn.createdAt
        ? new Date(
            typeof txn.createdAt === 'object' && 'toMillis' in txn.createdAt
              ? txn.createdAt.toMillis()
              : txn.createdAt
          ).toLocaleDateString()
        : 'N/A'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportPayoutsToCSV = () => {
    const headers = ['ID', 'Amount', 'Currency', 'Status', 'Creator', 'Country', 'Fail Reason', 'Created'];
    const rows = payouts.map(payout => [
      payout.id,
      payout.amount,
      payout.currency,
      payout.status,
      payout.creatorId,
      payout.countryId,
      payout.failReason || 'N/A',
      payout.createdAt
        ? new Date(
            typeof payout.createdAt === 'object' && 'toMillis' in payout.createdAt
              ? payout.createdAt.toMillis()
              : payout.createdAt
          ).toLocaleDateString()
        : 'N/A'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payouts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleUpdatePayoutStatus = async () => {
    if (!selectedPayout) return;

    try {
      setProcessing(true);
      setError(null);
      await updatePayoutStatusAction(
        selectedPayout.id,
        newStatus,
        newStatus === 'FAILED' ? failReason : undefined
      );
      setShowStatusDialog(false);
      setSelectedPayout(null);
      setFailReason('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update payout status');
    } finally {
      setProcessing(false);
    }
  };

  const getPayoutStatusBadge = (status: PayoutStatus) => {
    const configs = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      HELD: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
      PAID: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      FAILED: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };
    const config = configs[status] || configs.PENDING;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  // Calculate stats
  const totalVolume = transactions.reduce((sum, txn) => sum + txn.amount, 0);
  const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);
  const pendingPayouts = payouts.filter((p) => p.status === 'PENDING').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Finance</h1>
        <p className="text-gray-600 mt-2">Manage payments, payouts, and financial reports</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total Volume</div>
                <div className="text-2xl font-bold">${totalVolume.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total Payouts</div>
                <div className="text-2xl font-bold">${totalPayouts.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Pending Payouts</div>
                <div className="text-2xl font-bold">{pendingPayouts}</div>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} variant="secondary">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); handleFilterChange(); }}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Types</SelectItem>
                      <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                      <SelectItem value="MISSION_PAYMENT">Mission Payment</SelectItem>
                      <SelectItem value="EVENT_TICKET">Event Ticket</SelectItem>
                      <SelectItem value="PAYOUT">Payout</SelectItem>
                      <SelectItem value="REFUND">Refund</SelectItem>
                      <SelectItem value="FEE">Fee</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={exportTransactionsToCSV} disabled={transactions.length === 0}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          {loading ? (
            <LoadingSkeleton count={8} />
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No transactions found"
              description={
                searchQuery || typeFilter !== 'ALL'
                  ? 'Try adjusting your filters or search query'
                  : 'Transactions will appear here once users start making payments'
              }
              action={
                searchQuery || typeFilter !== 'ALL'
                  ? {
                      label: 'Clear filters',
                      onClick: () => {
                        setSearchQuery('');
                        setTypeFilter('ALL');
                        setTransactionsPage(1);
                      },
                    }
                  : undefined
              }
            />
          ) : (
            <>
              <div className="space-y-3">
                {transactions.slice((transactionsPage - 1) * 20, transactionsPage * 20).map((txn) => (
                <Card key={txn.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge>{txn.type.replace('_', ' ')}</Badge>
                          <span className="text-sm text-gray-600">{txn.id}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium">{txn.sourceEntityType}</span>
                          <ArrowRight className="w-4 h-4" />
                          <span className="font-medium">{txn.destEntityType}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">${txn.amount.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">{txn.currency}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
              <Pagination
                currentPage={transactionsPage}
                totalItems={transactions.length}
                itemsPerPage={20}
                onPageChange={(page) => {
                  setTransactionsPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </>
          )}
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="Search payouts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} variant="secondary">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); handleFilterChange(); }}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="HELD">Held</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={exportPayoutsToCSV} disabled={payouts.length === 0}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payouts List */}
          {loading ? (
            <LoadingSkeleton count={8} />
          ) : payouts.length === 0 ? (
            <EmptyState
              icon={TrendingDown}
              title="No payouts found"
              description={
                searchQuery || statusFilter !== 'ALL'
                  ? 'Try adjusting your filters or search query'
                  : 'Payouts will appear here once businesses request withdrawals'
              }
              action={
                searchQuery || statusFilter !== 'ALL'
                  ? {
                      label: 'Clear filters',
                      onClick: () => {
                        setSearchQuery('');
                        setStatusFilter('ALL');
                        setPayoutsPage(1);
                      },
                    }
                  : undefined
              }
            />
          ) : (
            <>
              <div className="space-y-3">
                {payouts.slice((payoutsPage - 1) * 20, payoutsPage * 20).map((payout) => (
                <Card key={payout.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getPayoutStatusBadge(payout.status)}
                          <span className="text-sm text-gray-600">{payout.id}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Creator: <span className="font-medium">{payout.creatorId}</span>
                        </div>
                        {payout.failReason && (
                          <div className="text-sm text-red-600 mt-1">
                            Reason: {payout.failReason}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xl font-bold">${payout.amount.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">{payout.currency}</div>
                        </div>
                        {payout.status !== 'PAID' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPayout(payout);
                              setNewStatus(payout.status);
                              setShowStatusDialog(true);
                            }}
                          >
                            Update
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
              <Pagination
                currentPage={payoutsPage}
                totalItems={payouts.length}
                itemsPerPage={20}
                onPageChange={(page) => {
                  setPayoutsPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Payout Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payout Status</DialogTitle>
            <DialogDescription>
              Update status for payout: {selectedPayout?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={newStatus} onValueChange={(val) => setNewStatus(val as PayoutStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="HELD">Held</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>

            {newStatus === 'FAILED' && (
              <Input
                placeholder="Reason for failure..."
                value={failReason}
                onChange={(e) => setFailReason(e.target.value)}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePayoutStatus} disabled={processing}>
              {processing ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
