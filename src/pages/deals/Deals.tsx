import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Filter,
  Search,
  X,
  Download,
  RefreshCw,
} from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { dealsApi } from '../../api/deals';
import { usersApi } from '../../api/users';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Deal, DealFilters, DealStage, DealStatus } from '../../types/deal';
import type { User } from '../../types/user';

const STAGE_COLORS: Record<DealStage, string> = {
  lead: 'bg-blue-100 text-blue-800',
  qualified: 'bg-purple-100 text-purple-800',
  proposal: 'bg-yellow-100 text-yellow-800',
  negotiation: 'bg-orange-100 text-orange-800',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-gray-100 text-gray-800',
};

const STATUS_COLORS: Record<DealStatus, string> = {
  open: 'bg-green-100 text-green-800',
  won: 'bg-blue-100 text-blue-800',
  lost: 'bg-gray-100 text-gray-800',
};

// Helper function to calculate weighted amount
const calculateWeightedAmount = (amount: number, probability: number): number => {
  return amount * (probability / 100);
};

// Helper to add weighted amount to a deal
const enrichDealWithWeightedAmount = (deal: Deal): Deal & { weighted_amount: number } => ({
  ...deal,
  weighted_amount: calculateWeightedAmount(deal.amount, deal.probability)
});

export default function Deals() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  // Data states
  const [deals, setDeals] = useState<(Deal & { weighted_amount: number })[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const hasFetched = useRef(false); 

  // Filter states
  const [filters, setFilters] = useState<DealFilters>({
    page: 1,
    limit: 20,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Summary stats - calculated using useMemo
  const summary = useMemo(() => {
    const openDeals = deals.filter(d => d.status === 'open');
    return {
      total_value: openDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
      weighted_value: openDeals.reduce((sum, d) => sum + (d.weighted_amount || 0), 0),
      open_deals: openDeals.length,
    };
  }, [deals]);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchDeals();
      fetchUsers();
    }
  }, []);

  
  useEffect(() => {
    if (hasFetched.current) {
      fetchDeals();
    }
  }, [filters.page, filters.limit, filters.stage, filters.status, filters.user_id, filters.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm || undefined, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const response = await dealsApi.getDeals(filters);

      // Access the nested data structure correctly
      const items = response.data?.data || [];

      // Enrich deals with calculated weighted amount
      const enrichedDeals = items.map(enrichDealWithWeightedAmount);
      setDeals(enrichedDeals);

      setTotalItems(response.data?.pagination?.total || 0);
      setTotalPages(response.data?.pagination?.pages || 1);

    } catch (error) {
      toast.error('Failed to load deals');
      // Set empty state on error
      setDeals([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (user?.role === 'admin') {
      try {
        const response = await usersApi.getUsers();
        setUsers(response.data?.data || []);
      } catch (error) {
        console.error('Failed to load users');
        setUsers([]);
      }
    }
  };

  const handleFilterChange = (key: keyof DealFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 20 });
    setSearchTerm('');
    setShowFilters(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await dealsApi.getDeals({ ...filters, limit: 1000 });
      const items = response.data?.data || [];

      // Enrich with weighted amount for export
      const enrichedItems = items.map(enrichDealWithWeightedAmount);

      // Convert to CSV with safe access
      const csv = [
        ['ID', 'Name', 'Contact', 'Company', 'Stage', 'Status', 'Amount', 'Probability', 'Weighted Amount', 'Expected Close', 'Owner'],
        ...enrichedItems.map((deal: any) => [
          deal?.id || '',
          deal?.name || '',
          deal?.contact ? `${deal.contact.first_name || ''} ${deal.contact.last_name || ''}`.trim() : '',
          deal?.contact?.company || '',
          deal?.stage || '',
          deal?.status || '',
          deal?.amount || 0,
          `${deal?.probability || 0}%`,
          deal?.weighted_amount || 0,
          deal?.expected_close_date ? formatDate(deal.expected_close_date) : '',
          deal?.owner ? `${deal.owner.first_name || ''} ${deal.owner.last_name || ''}`.trim() : '',
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deals_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Export completed');
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const activeFilterCount = Object.keys(filters).filter(key =>
    !['page', 'limit'].includes(key) && filters[key as keyof DealFilters]
  ).length;

  // Safe check for empty state
  const hasNoDeals = !loading && deals.length === 0;
  const hasNoFilters = !Object.keys(filters).some(k =>
    !['page', 'limit'].includes(k) && filters[k as keyof DealFilters]
  );

  // ========== SHOW LOADING FIRST ==========
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen pb-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Empty state
  if (hasNoDeals && hasNoFilters) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-deep-ink">Deals</h1>
            <p className="text-gray-600 mt-1">Manage your sales pipeline</p>
          </div>
          <Button onClick={() => navigate('/deals/new')}>
            <Plus size={18} className="mr-2" /> Add Deal
          </Button>
        </div>

        <GlassCard className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus size={32} className="text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-deep-ink mb-2">No deals yet</h2>
            <p className="text-gray-600 mb-6">
              Start tracking your sales pipeline by creating your first deal.
            </p>
            <Button size="lg" onClick={() => navigate('/deals/new')}>
              <Plus size={18} className="mr-2" /> Create Your First Deal
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-deep-ink">Deals</h1>
          <p className="text-gray-600 mt-1">Manage your sales pipeline</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exporting || deals.length === 0}
          >
            <Download size={18} className="mr-2" />
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
          <Button onClick={() => navigate('/deals/new')}>
            <Plus size={18} className="mr-2" /> Add Deal
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-4">
          <p className="text-sm text-gray-500">Open Deals</p>
          <p className="text-2xl font-bold text-deep-ink">{summary.open_deals}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-gray-500">Total Value</p>
          <p className="text-2xl font-bold text-deep-ink">{formatCurrency(summary.total_value)}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-gray-500">Weighted Pipeline</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(summary.weighted_value)}</p>
        </GlassCard>
      </div>

      {/* Search and Filters */}
      <GlassCard className="p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={activeFilterCount > 0 ? 'primary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} className="mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-2 bg-white/20">{activeFilterCount}</Badge>
            )}
          </Button>
          <Button variant="outline" onClick={fetchDeals}>
            <RefreshCw size={18} />
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-deep-ink">Filters</h3>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X size={16} className="mr-2" /> Clear All
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                value={filters.stage || ''}
                onChange={(e) => handleFilterChange('stage', e.target.value || undefined)}
              >
                <option value="">All Stages</option>
                <option value="lead">Lead</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </Select>

              <Select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </Select>

              {user?.role === 'admin' && (
                <Select
                  value={filters.user_id || ''}
                  onChange={(e) => handleFilterChange('user_id', e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">All Owners</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name}
                    </option>
                  ))}
                </Select>
              )}

              <Select
                value={filters.limit || 20}
                onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
              >
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </Select>

              <Input
                type="number"
                placeholder="Min Amount"
                value={filters.min_amount || ''}
                onChange={(e) => handleFilterChange('min_amount', e.target.value ? Number(e.target.value) : undefined)}
              />

              <Input
                type="number"
                placeholder="Max Amount"
                value={filters.max_amount || ''}
                onChange={(e) => handleFilterChange('max_amount', e.target.value ? Number(e.target.value) : undefined)}
              />

              <Input
                type="date"
                placeholder="From Date"
                value={filters.date_from || ''}
                onChange={(e) => handleFilterChange('date_from', e.target.value || undefined)}
              />

              <Input
                type="date"
                placeholder="To Date"
                value={filters.date_to || ''}
                onChange={(e) => handleFilterChange('date_to', e.target.value || undefined)}
              />
            </div>
          </div>
        )}
      </GlassCard>

      {/* Deals Table */}
      <GlassCard className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No deals match your filters</p>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Probability
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expected Close
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deals.map((deal) => (
                    <tr
                      key={deal.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/deals/${deal.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-deep-ink">{deal.name}</div>
                        {deal.is_overdue && (
                          <Badge className="mt-1 bg-red-100 text-red-800">Overdue</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {deal.contact ? (
                          <>
                            <div className="text-sm font-medium text-deep-ink">
                              {deal.contact.first_name} {deal.contact.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {deal.contact.company || '-'}
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-400">No contact</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={STAGE_COLORS[deal.stage]}>
                          {deal.stage}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-deep-ink">
                          {formatCurrency(deal.amount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Weighted: {formatCurrency(deal.weighted_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-deep-ink">{deal.probability}%</span>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary rounded-full h-2"
                              style={{ width: `${deal.probability}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {deal.expected_close_date ? formatDate(deal.expected_close_date) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={STATUS_COLORS[deal.status]}>
                          {deal.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {deal.owner ? (
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary mr-2">
                              {deal.owner.first_name?.[0] || ''}{deal.owner.last_name?.[0] || ''}
                            </div>
                            {deal.owner.first_name} {deal.owner.last_name}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/deals/${deal.id}/edit`);
                          }}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((filters.page || 1) - 1) * (filters.limit || 20) + 1} to{' '}
                  {Math.min((filters.page || 1) * (filters.limit || 20), totalItems)} of {totalItems} deals
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filters.page === 1}
                    onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filters.page === totalPages}
                    onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </GlassCard>
    </div>
  );
}