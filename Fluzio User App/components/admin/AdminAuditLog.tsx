import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from '../../services/firestoreCompat';
import { db } from '../../services/apiService';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { Download, Filter, RefreshCw, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import './AdminAuditLog.css';

interface AuditLog {
  id: string;
  adminUserId: string;
  adminEmail: string;
  adminRole: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: any;
  after?: any;
  changes?: any;
  reason?: string;
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: any;
  createdAt: string;
}

export const AdminAuditLog: React.FC = () => {
  const { adminData, hasPermission } = useAdminAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  
  // Filters
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterEntityType, setFilterEntityType] = useState<string>('all');
  const [filterAdmin, setFilterAdmin] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7d'); // 7d, 30d, 90d, all
  const [limitCount, setLimitCount] = useState<number>(100);

  // Action types
  const actionTypes = [
    'all', 'create', 'update', 'delete', 'approve', 'reject', 
    'verify', 'suspend', 'activate', 'assign', 'unassign'
  ];

  // Entity types
  const entityTypes = [
    'all', 'user', 'business', 'mission', 'reward', 'event', 
    'squad', 'admin', 'verification', 'subscription'
  ];

  useEffect(() => {
    loadLogs();
  }, [filterAction, filterEntityType, filterAdmin, dateRange, limitCount]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      console.log('[AdminAuditLog] Loading logs...');

      let q = query(
        collection(db, 'adminLogs'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      // Apply filters
      if (filterAction !== 'all') {
        q = query(q, where('action', '==', filterAction));
      }
      if (filterEntityType !== 'all') {
        q = query(q, where('entityType', '==', filterEntityType));
      }
      if (filterAdmin !== 'all') {
        q = query(q, where('adminUserId', '==', filterAdmin));
      }

      // Date range filtering (done client-side for simplicity)
      const snapshot = await getDocs(q);
      let logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AuditLog));

      // Apply date filtering
      if (dateRange !== 'all') {
        const now = new Date();
        const days = parseInt(dateRange.replace('d', ''));
        const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        
        logsData = logsData.filter(log => {
          const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.createdAt);
          return logDate >= cutoffDate;
        });
      }

      // Filter by admin scope
      if (adminData?.role !== 'SUPER_ADMIN') {
        // Non-super admins only see their own logs
        logsData = logsData.filter(log => log.adminUserId === adminData?.userId);
      }

      console.log(`[AdminAuditLog] Loaded ${logsData.length} logs`);
      setLogs(logsData);
    } catch (error) {
      console.error('[AdminAuditLog] Error loading logs:', error);
      alert('Error loading audit logs: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Timestamp', 'Admin Email', 'Role', 'Action', 'Entity Type', 
      'Entity ID', 'IP Address', 'Notes'
    ];
    
    const rows = logs.map(log => [
      formatTimestamp(log.timestamp || log.createdAt),
      log.adminEmail,
      log.adminRole,
      log.action,
      log.entityType,
      log.entityId,
      log.ipAddress || 'N/A',
      log.notes || log.reason || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  const getActionColor = (action: string): string => {
    const colors: Record<string, string> = {
      create: '#10b981',
      update: '#3b82f6',
      delete: '#ef4444',
      approve: '#10b981',
      reject: '#ef4444',
      verify: '#8b5cf6',
      suspend: '#f59e0b',
      activate: '#10b981',
      assign: '#3b82f6',
      unassign: '#6b7280'
    };
    return colors[action.toLowerCase()] || '#6b7280';
  };

  const toggleExpanded = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  const renderDiff = (before: any, after: any) => {
    if (!before || !after) return null;

    const changes: { field: string; before: any; after: any }[] = [];
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    allKeys.forEach(key => {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changes.push({
          field: key,
          before: before[key],
          after: after[key]
        });
      }
    });

    if (changes.length === 0) return null;

    return (
      <div className="audit-log-diff">
        <h4>Changes:</h4>
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Before</th>
              <th>After</th>
            </tr>
          </thead>
          <tbody>
            {changes.map((change, idx) => (
              <tr key={idx}>
                <td><strong>{change.field}</strong></td>
                <td className="before-value">{JSON.stringify(change.before)}</td>
                <td className="after-value">{JSON.stringify(change.after)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (!hasPermission('viewAuditLogs')) {
    return (
      <div className="admin-audit-log">
        <div className="no-permission">
          <p>⚠️ You don't have permission to view audit logs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-audit-log">
      <div className="audit-log-header">
        <h2>Admin Audit Logs</h2>
        <div className="audit-log-actions">
          <button onClick={loadLogs} disabled={loading} className="btn-refresh">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button onClick={exportToCSV} className="btn-export" disabled={logs.length === 0}>
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="audit-log-filters">
        <div className="filter-group">
          <label>Action:</label>
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)}>
            {actionTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Entity Type:</label>
          <select value={filterEntityType} onChange={e => setFilterEntityType(e.target.value)}>
            {entityTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Date Range:</label>
          <select value={dateRange} onChange={e => setDateRange(e.target.value)}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Limit:</label>
          <select value={limitCount} onChange={e => setLimitCount(parseInt(e.target.value))}>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="250">250</option>
            <option value="500">500</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading audit logs...</div>
      ) : logs.length === 0 ? (
        <div className="no-logs">No audit logs found</div>
      ) : (
        <div className="audit-log-list">
          <div className="audit-log-count">
            Showing {logs.length} log{logs.length !== 1 ? 's' : ''}
          </div>
          
          {logs.map(log => (
            <div key={log.id} className="audit-log-item">
              <div className="log-summary" onClick={() => toggleExpanded(log.id)}>
                <div className="log-main">
                  <span 
                    className="log-action" 
                    style={{ backgroundColor: getActionColor(log.action) }}
                  >
                    {log.action}
                  </span>
                  <span className="log-entity">{log.entityType}</span>
                  <span className="log-entity-id">{log.entityId}</span>
                </div>
                
                <div className="log-meta">
                  <span className="log-admin">{log.adminEmail}</span>
                  <span className="log-role">{log.adminRole}</span>
                  <span className="log-time">{formatTimestamp(log.timestamp || log.createdAt)}</span>
                  {expandedLog === log.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {expandedLog === log.id && (
                <div className="log-details">
                  <div className="log-detail-row">
                    <strong>Admin ID:</strong> {log.adminUserId}
                  </div>
                  
                  {log.ipAddress && (
                    <div className="log-detail-row">
                      <strong>IP Address:</strong> {log.ipAddress}
                    </div>
                  )}
                  
                  {log.userAgent && (
                    <div className="log-detail-row">
                      <strong>User Agent:</strong> {log.userAgent}
                    </div>
                  )}
                  
                  {log.reason && (
                    <div className="log-detail-row">
                      <strong>Reason:</strong> {log.reason}
                    </div>
                  )}
                  
                  {log.notes && (
                    <div className="log-detail-row">
                      <strong>Notes:</strong> {log.notes}
                    </div>
                  )}

                  {renderDiff(log.before, log.after)}

                  {log.changes && (
                    <div className="log-detail-row">
                      <strong>Changes:</strong>
                      <pre>{JSON.stringify(log.changes, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
