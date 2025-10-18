import React, { useState, useRef } from 'react';
import { 
  Download, 
  Printer, 
  FileText, 
  FileSpreadsheet, 
  File, 
  Calendar,
  Filter,
  Settings,
  Eye,
  Share2,
  Mail,
  Copy,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import './ReportGenerator.css';

interface ReportColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'status' | 'boolean';
  format?: string;
  width?: number;
}

interface ReportFilter {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number' | 'boolean';
  options?: { value: string; label: string }[];
}

interface ReportData {
  [key: string]: any;
}

interface ReportGeneratorProps {
  title: string;
  data: ReportData[];
  columns: ReportColumn[];
  filters?: ReportFilter[];
  onExport?: (format: string, data: ReportData[], filters: any) => void;
  onPrint?: (data: ReportData[], filters: any) => void;
  className?: string;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  title,
  data,
  columns,
  filters = [],
  onExport,
  onPrint,
  className = ''
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    columns.map(col => col.key)
  );
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [exportFormat, setExportFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const reportRef = useRef<HTMLDivElement>(null);

  // Filter and sort data
  const filteredData = React.useMemo(() => {
    let filtered = [...data];
    
    // Apply filters
    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        filtered = filtered.filter(item => {
          const itemValue = item[key];
          if (typeof value === 'string') {
            return itemValue?.toString().toLowerCase().includes(value.toLowerCase());
          }
          return itemValue === value;
        });
      }
    });
    
    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return filtered;
  }, [data, appliedFilters, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  // Format cell value
  const formatCellValue = (value: any, column: ReportColumn) => {
    if (value === null || value === undefined) return '-';
    
    switch (column.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'QAR'
        }).format(Number(value));
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'number':
        return new Intl.NumberFormat('en-US').format(Number(value));
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'status':
        return (
          <span className={`status-badge status-${value.toLowerCase()}`}>
            {value}
          </span>
        );
      default:
        return String(value);
    }
  };

  // Export functions
  const exportToCSV = () => {
    const visibleColumns = columns.filter(col => selectedColumns.includes(col.key));
    const headers = visibleColumns.map(col => col.label);
    
    const csvContent = [
      headers.join(','),
      ...paginatedData.map(row => 
        visibleColumns.map(col => {
          const value = row[col.key];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const visibleColumns = columns.filter(col => selectedColumns.includes(col.key));
    const jsonData = paginatedData.map(row => {
      const filteredRow: any = {};
      visibleColumns.forEach(col => {
        filteredRow[col.label] = row[col.key];
      });
      return filteredRow;
    });
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    if (!reportRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const content = reportRef.current.innerHTML;
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .report-header { text-align: center; margin-bottom: 30px; }
            .report-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .report-meta { font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .status-badge { padding: 2px 6px; border-radius: 3px; font-size: 11px; }
            .status-active { background: #d4edda; color: #155724; }
            .status-pending { background: #fff3cd; color: #856404; }
            .status-completed { background: #d1ecf1; color: #0c5460; }
            .status-failed { background: #f8d7da; color: #721c24; }
          </style>
        </head>
        <body>
          <div class="report-header">
            <div class="report-title">${title}</div>
            <div class="report-meta">
              Generated on: ${new Date().toLocaleString()}<br>
              Total Records: ${filteredData.length}<br>
              Page: ${currentPage} of ${totalPages}
            </div>
          </div>
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExport = async (format: string) => {
    setIsExporting(true);
    try {
      switch (format) {
        case 'csv':
          exportToCSV();
          break;
        case 'json':
          exportToJSON();
          break;
        case 'pdf':
          exportToPDF();
          break;
        default:
          if (onExport) {
            await onExport(format, paginatedData, appliedFilters);
          }
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      if (onPrint) {
        await onPrint(paginatedData, appliedFilters);
      } else {
        exportToPDF();
      }
    } catch (error) {
      console.error('Print failed:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setAppliedFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setAppliedFilters({});
    setCurrentPage(1);
  };

  const toggleColumn = (columnKey: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  return (
    <div className={`report-generator ${className}`}>
      {/* Header */}
      <div className="report-header">
        <div className="header-left">
          <h2>{title}</h2>
          <p>Total Records: {filteredData.length} | Showing: {paginatedData.length}</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setShowPreview(!showPreview)}
            title="Preview"
          >
            <Eye size={16} />
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowFilters(!showFilters)}
            title="Filters"
          >
            <Filter size={16} />
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <Settings size={16} />
          </button>
          <div className="export-dropdown">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="format-select"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="pdf">PDF</option>
            </select>
            <button
              className="btn btn-primary"
              onClick={() => handleExport(exportFormat)}
              disabled={isExporting}
            >
              <Download size={16} />
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
          <button
            className="btn btn-primary"
            onClick={handlePrint}
            disabled={isPrinting}
          >
            <Printer size={16} />
            {isPrinting ? 'Printing...' : 'Print'}
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="report-filters">
          <div className="filters-header">
            <h3>Filters</h3>
            <button className="btn btn-sm btn-secondary" onClick={clearFilters}>
              Clear All
            </button>
          </div>
          <div className="filters-grid">
            {filters.map(filter => (
              <div key={filter.key} className="filter-group">
                <label>{filter.label}</label>
                {filter.type === 'select' ? (
                  <select
                    value={appliedFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  >
                    <option value="">All</option>
                    {filter.options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : filter.type === 'date' ? (
                  <input
                    type="date"
                    value={appliedFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  />
                ) : filter.type === 'number' ? (
                  <input
                    type="number"
                    value={appliedFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, Number(e.target.value))}
                  />
                ) : (
                  <input
                    type="text"
                    placeholder={`Filter by ${filter.label.toLowerCase()}...`}
                    value={appliedFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings */}
      {showSettings && (
        <div className="report-settings">
          <div className="settings-header">
            <h3>Report Settings</h3>
          </div>
          <div className="settings-content">
            <div className="setting-group">
              <label>Columns to Display</label>
              <div className="columns-list">
                {columns.map(column => (
                  <label key={column.key} className="column-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(column.key)}
                      onChange={() => toggleColumn(column.key)}
                    />
                    {column.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>Records per Page</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {showPreview && (
        <div className="report-preview">
          <div className="preview-header">
            <h3>Report Preview</h3>
            <p>This is how your report will look when exported or printed.</p>
          </div>
        </div>
      )}

      {/* Report Table */}
      <div className="report-table-container" ref={reportRef}>
        <table className="report-table">
          <thead>
            <tr>
              {columns
                .filter(col => selectedColumns.includes(col.key))
                .map(column => (
                  <th
                    key={column.key}
                    style={{ width: column.width ? `${column.width}px` : 'auto' }}
                    onClick={() => handleSort(column.key)}
                    className={sortColumn === column.key ? `sort-${sortDirection}` : ''}
                  >
                    {column.label}
                    {sortColumn === column.key && (
                      <span className="sort-indicator">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => (
              <tr key={index}>
                {columns
                  .filter(col => selectedColumns.includes(col.key))
                  .map(column => (
                    <td key={column.key}>
                      {formatCellValue(row[column.key], column)}
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="report-pagination">
          <div className="pagination-info">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
          </div>
          <div className="pagination-controls">
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportGenerator;
