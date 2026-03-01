import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from './SupabaseClient'; 
import './tabledetail.css';

const MASTER_COLUMNS = [
  { name: 'Name', source_key: 'google_name' },
  { name: 'Japanese Name', source_key: 'japanese_name' },
  { name: 'Tabelog Address', source_key: 'tabelog_address' },
  { name: 'Prefecture', source_key: 'prefecture' },
  { name: 'City', source_key: 'city' },
  { name: 'Tabelog Link', source_key: 'tabelog_url' },
  { name: 'Tabelog Rating', source_key: 'tabelog_rating' },
  { name: 'Reservation Availability', source_key: 'reservation_availability' },
  { name: 'Reservation Info', source_key: 'reservation_info' },
  { name: 'Google Maps Link', source_key: 'google_url' },
  { name: 'Google Rating', source_key: 'google_rating' },
  { name: '# Google Ratings', source_key: 'amount_google_ratings' },
  { name: 'Price Level', source_key: 'price_level' },
  { name: 'Establishment Type', source_key: 'type' },
  { name: 'Secondary Type', source_key: 'genre' },
  { name: 'Extra Operational Info', source_key: 'operational_info' },
  { name: 'Website', source_key: 'website' },
  { name: 'Phone Number', source_key: 'phone_number' },
  { name: 'Google Address', source_key: 'google_address' }
];

const TableDetail = () => {
  const { tableId } = useParams();

  const [listName, setListName] = useState('Loading...');
  const [columns, setColumns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [columnType, setColumnType] = useState('default'); 
  const [selectedDefaultCol, setSelectedDefaultCol] = useState('');
  const [customColName, setCustomColName] = useState('');
  const [isAddingCol, setIsAddingCol] = useState(false);
  
  // NEW: State for our inline error message
  const [errorMessage, setErrorMessage] = useState('');

  const [rows, setRows] = useState([
    { id: 1, google_name: 'Ichiran Ramen', tabelog_rating: '3.8', city: 'Tokyo' },
    { id: 2, google_name: 'Kichi Kichi Omurice', tabelog_rating: '3.5', city: 'Kyoto' }
  ]);

  useEffect(() => {
    const fetchTableData = async () => {
      setIsLoading(true);

      const { data: listData } = await supabase
        .from('user_spreadsheets')
        .select('name')
        .eq('list_id', tableId)
        .single();

      if (listData) setListName(listData.name);

      const { data: colData } = await supabase
        .from('spreadsheet_columns')
        .select('*')
        .eq('list_id', tableId)
        .order('order_index', { ascending: true });

      if (colData) setColumns(colData);

      setIsLoading(false);
    };

    if (tableId) fetchTableData();
  }, [tableId]);

  const availableDefaultColumns = MASTER_COLUMNS.filter(masterCol => {
    return !columns.some(col => col.source_key === masterCol.source_key);
  });

  useEffect(() => {
    if (availableDefaultColumns.length > 0) {
      const isSelectedValid = availableDefaultColumns.some(col => col.source_key === selectedDefaultCol);
      if (!isSelectedValid) {
        setSelectedDefaultCol(availableDefaultColumns[0].source_key);
      }
    } else {
      setSelectedDefaultCol(''); 
      setColumnType('custom'); 
    }
  }, [availableDefaultColumns, selectedDefaultCol]);

  const handleAddColumn = async (e) => {
    e.preventDefault();
    setErrorMessage(''); // Clear previous errors
    setIsAddingCol(true);

    let newColData = {
      list_id: tableId,
      order_index: columns.length + 1, 
      is_visible: true
    };

    if (columnType === 'default') {
      const masterInfo = MASTER_COLUMNS.find(c => c.source_key === selectedDefaultCol);
      if (!masterInfo) return setIsAddingCol(false);
      
      newColData.name = masterInfo.name;
      newColData.source_key = masterInfo.source_key;
      newColData.source_type = 'master'; 
    } else {
      const trimmedName = customColName.trim();
      if (!trimmedName) return setIsAddingCol(false);

      const lowerCaseName = trimmedName.toLowerCase();
      const matchesExisting = columns.some(col => col.name.toLowerCase() === lowerCaseName);
      const matchesMaster = MASTER_COLUMNS.some(col => col.name.toLowerCase() === lowerCaseName);

      if (matchesExisting || matchesMaster) {
        // TRIGGER INLINE ERROR INSTEAD OF ALERT
        setErrorMessage("This column name is already in use or is a reserved default name.");
        setIsAddingCol(false);
        return; 
      }
      
      newColData.name = trimmedName;
      newColData.source_key = `custom_${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
      newColData.source_type = 'custom';
    }

    try {
      const { data: insertedCol, error } = await supabase
        .from('spreadsheet_columns')
        .insert([newColData])
        .select()
        .single();

      if (error) throw error;

      setColumns([...columns, insertedCol]);
      
      closeModal();

    } catch (error) {
      console.error("Error adding column:", error);
      setErrorMessage("Failed to add column to database. Please try again.");
    } finally {
      setIsAddingCol(false);
    }
  };

  const closeModal = () => {
    setIsColumnModalOpen(false);
    setCustomColName('');
    setErrorMessage('');
    if (availableDefaultColumns.length > 0) {
      setColumnType('default');
    }
  };

  if (isLoading) return <div className="table-page-wrapper">Loading your table...</div>;

  return (
    <div className="table-page-wrapper">
      <div className="table-header">
        <Link to="/tables" style={{ position: 'absolute', left: 0, textDecoration: 'none', color: '#6366f1', fontWeight: 'bold' }}>
          ← Back to Dashboard
        </Link>
        <div className="header-title-container">
          <h1>{listName}</h1>
          <p className="header-subtitle">Restaurant List</p>
        </div>
        <div className="table-actions">
          <button className="btn-secondary" onClick={() => setIsColumnModalOpen(true)}>
            + Add Column
          </button>
          <button className="btn-primary">+ Add Restaurant</button>
        </div>
      </div>

      <div className="spreadsheet-container">
        <table className="spreadsheet-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.id}>{col.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((col) => (
                  <td key={`${row.id}-${col.id}`}>
                    {row[col.source_key] || ''} 
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isColumnModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add a Column</h2>
            
            <div className="radio-group">
              <label style={{ opacity: availableDefaultColumns.length === 0 ? 0.5 : 1, cursor: availableDefaultColumns.length === 0 ? 'not-allowed' : 'pointer' }}>
                <input 
                  type="radio" 
                  value="default" 
                  checked={columnType === 'default'} 
                  onChange={() => {
                    setColumnType('default');
                    setErrorMessage(''); // Clear error on switch
                  }} 
                  disabled={availableDefaultColumns.length === 0}
                /> Master Data
              </label>
              <label style={{ cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  value="custom" 
                  checked={columnType === 'custom'} 
                  onChange={() => {
                    setColumnType('custom');
                    setErrorMessage(''); // Clear error on switch
                  }} 
                /> Custom Column
              </label>
            </div>

            <form onSubmit={handleAddColumn}>
              {columnType === 'default' ? (
                <div className="form-group">
                  <label className="form-label">Select Data to Add:</label>
                  {availableDefaultColumns.length > 0 ? (
                    <select 
                      value={selectedDefaultCol} 
                      onChange={(e) => setSelectedDefaultCol(e.target.value)}
                      className="form-input"
                    >
                      {availableDefaultColumns.map(col => (
                        <option key={col.source_key} value={col.source_key}>
                          {col.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p style={{ color: '#10b981', fontSize: '0.9rem', margin: 0 }}>You have already added all available master columns!</p>
                  )}
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Custom Column Name:</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Who ordered what?" 
                    value={customColName}
                    onChange={(e) => {
                      setCustomColName(e.target.value);
                      if (errorMessage) setErrorMessage(''); // Clear error instantly when they start typing
                    }}
                    className={`form-input ${errorMessage ? 'input-error' : ''}`}
                    autoFocus
                  />
                  {/* INLINE ERROR MESSAGE */}
                  {errorMessage && <div className="error-message">{errorMessage}</div>}
                </div>
              )}

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={closeModal}
                  disabled={isAddingCol}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={isAddingCol || (columnType === 'default' && availableDefaultColumns.length === 0)}
                >
                  {isAddingCol ? 'Adding...' : 'Add Column'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableDetail;