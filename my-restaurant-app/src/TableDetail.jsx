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
  const [rows, setRows] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);

  // Column Modal State
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [columnType, setColumnType] = useState('default'); 
  const [selectedDefaultCol, setSelectedDefaultCol] = useState('');
  const [customColName, setCustomColName] = useState('');
  const [isAddingCol, setIsAddingCol] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Multi-Select & Delete State
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copy To Lists State
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [userLists, setUserLists] = useState([]);
  const [selectedTargetLists, setSelectedTargetLists] = useState([]);
  const [isCopying, setIsCopying] = useState(false);

  // Success Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // INTERACTION STATES
  const [editingCell, setEditingCell] = useState({ rowId: null, colKey: null });
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, row: null, col: null });

  // COLUMN RESIZING STATE
  const [colWidths, setColWidths] = useState({});
  const [isResizing, setIsResizing] = useState(false);
  const [resizeData, setResizeData] = useState({ colKey: null, startX: 0, startWidth: 0 });

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

      const { data: rowData } = await supabase
        .from('unified_spreadsheet_data')
        .select('*')
        .eq('list_id', tableId);
      if (rowData) setRows(rowData);

      const { data: allLists } = await supabase
        .from('user_spreadsheets')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (allLists) {
        setUserLists(allLists.filter(list => list.list_id !== tableId));
      }

      setIsLoading(false);
    };

    if (tableId) fetchTableData();
  }, [tableId]);

  // Handle clicking outside the context menu to close it
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(prev => ({ ...prev, visible: false }));
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Handle column resizing logic
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      // Allows width to go down to 20px
      const newWidth = Math.max(20, resizeData.startWidth + (e.clientX - resizeData.startX));
      setColWidths(prev => ({ ...prev, [resizeData.colKey]: newWidth }));
    };

    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeData]);

  const startResize = (e, colKey) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    const cell = e.target.closest('th, td');
    setIsResizing(true);
    setResizeData({ colKey, startX: e.clientX, startWidth: cell.getBoundingClientRect().width });
  };

  // --- COLUMN LOGIC ---
  const availableDefaultColumns = MASTER_COLUMNS.filter(masterCol => {
    return !columns.some(col => col.source_key === masterCol.source_key);
  });

  useEffect(() => {
    if (availableDefaultColumns.length > 0) {
      const isSelectedValid = availableDefaultColumns.some(col => col.source_key === selectedDefaultCol);
      if (!isSelectedValid) setSelectedDefaultCol(availableDefaultColumns[0].source_key);
    } else {
      setSelectedDefaultCol(''); 
      setColumnType('custom'); 
    }
  }, [availableDefaultColumns, selectedDefaultCol]);

  const handleAddColumn = async (e) => {
    e.preventDefault();
    setErrorMessage(''); 
    setIsAddingCol(true);

    let newColData = { list_id: tableId, order_index: columns.length + 1, is_visible: true };

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
      setIsColumnModalOpen(false);
      setCustomColName('');
    } catch (error) {
      console.error("Error adding column:", error);
      setErrorMessage("Failed to add column to database. Please try again.");
    } finally {
      setIsAddingCol(false);
    }
  };

  // --- MULTI-SELECT & BULK ACTIONS ---
  const handleSelectRow = (rowId) => {
    setSelectedRowIds(prev => prev.includes(rowId) ? prev.filter(id => id !== rowId) : [...prev, rowId]);
  };
  const handleSelectAllRows = (e) => {
    if (e.target.checked) setSelectedRowIds(rows.map(r => r.row_id));
    else setSelectedRowIds([]);
  };

  const handleDeleteSelected = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('spreadsheet_rows').delete().in('row_id', selectedRowIds);
      if (error) throw error;
      setRows(prevRows => prevRows.filter(row => !selectedRowIds.includes(row.row_id)));
      setSelectedRowIds([]);
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting rows:", error);
      setErrorMessage("Failed to delete the selected restaurants.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleTargetList = (listId) => {
    setSelectedTargetLists(prev => prev.includes(listId) ? prev.filter(id => id !== listId) : [...prev, listId]);
  };

  const handleCopySelected = async () => {
    if (selectedTargetLists.length === 0 || selectedRowIds.length === 0) return;
    setIsCopying(true);

    const selectedGoogleIds = rows.filter(r => selectedRowIds.includes(r.row_id)).map(r => r.google_id);
    const insertPromises = [];
    selectedTargetLists.forEach(targetListId => {
      selectedGoogleIds.forEach(googleId => {
        insertPromises.push(supabase.from('spreadsheet_rows').insert([{ list_id: targetListId, google_id: googleId }]));
      });
    });

    try {
      const results = await Promise.all(insertPromises);
      const realErrors = results.filter(res => res.error && res.error.code !== '23505'); 
      const duplicateErrors = results.filter(res => res.error && res.error.code === '23505');
      
      if (realErrors.length > 0) {
        setSuccessMessage('Copied most, but some failed due to a database connection issue.');
        setIsSuccessModalOpen(true);
      } else {
        const totalAttempted = insertPromises.length;
        const duplicates = duplicateErrors.length;
        const successfulAdds = totalAttempted - duplicates;
        
        let finalMessage = duplicates === 0 ? `Successfully copied ${successfulAdds} restaurant(s) to your lists!` :
                           duplicates === totalAttempted ? 'No new restaurants copied. All selected items were already in these lists!' :
                           `Successfully copied ${successfulAdds} restaurant(s)! (Skipped ${duplicates} duplicate(s)).`;
        
        setIsCopyModalOpen(false);
        setSelectedRowIds([]);
        setSelectedTargetLists([]); 
        setSuccessMessage(finalMessage);
        setIsSuccessModalOpen(true);
      }
    } catch (error) {
      console.error("Error copying rows:", error);
      setSuccessMessage("Failed to copy. Please try again.");
      setIsSuccessModalOpen(true);
    } finally {
      setIsCopying(false);
    }
  };

  // --- INLINE EDITING LOGIC ---
  const handleSaveEdit = async (rowId, colKey, newValue) => {
    const row = rows.find(r => r.row_id === rowId);
    
    // Merge the new override/value into their custom_fields JSON payload
    const updatedCustomFields = { ...(row.custom_fields || {}) };
    updatedCustomFields[colKey] = newValue;

    try {
      const { error } = await supabase
        .from('spreadsheet_rows')
        .update({ custom_fields: updatedCustomFields })
        .eq('row_id', rowId);

      if (error) throw error;

      // Update Local State so UI updates instantly
      setRows(prevRows => prevRows.map(r => 
        r.row_id === rowId ? { ...r, custom_fields: updatedCustomFields } : r
      ));
    } catch (error) {
      console.error("Error saving edit:", error);
      alert("Failed to save changes.");
    }
    setEditingCell({ rowId: null, colKey: null }); // Close Input
  };

  const handleResetToDefault = async (rowId, colKey) => {
    const row = rows.find(r => r.row_id === rowId);
    const updatedCustomFields = { ...(row.custom_fields || {}) };
    
    // By deleting the key, we remove the override. The table will naturally fallback to Master data or "-"
    delete updatedCustomFields[colKey];

    try {
      await supabase.from('spreadsheet_rows').update({ custom_fields: updatedCustomFields }).eq('row_id', rowId);
      setRows(prevRows => prevRows.map(r => r.row_id === rowId ? { ...r, custom_fields: updatedCustomFields } : r));
    } catch (error) {
      console.error("Error resetting cell:", error);
    }
  };

  // --- CONTEXT MENU LOGIC ---
  const handleContextMenu = (e, row, col) => {
    e.preventDefault(); 
    e.stopPropagation();
    setContextMenu({ visible: true, x: e.pageX, y: e.pageY, row, col });
  };

  const handleMenuAction = (action) => {
    const { row, col } = contextMenu;
    
    if (action === 'copy-row') {
      setSelectedRowIds([row.row_id]);
      setIsCopyModalOpen(true);
    } else if (action === 'copy-cell') {
      const val = getCellValue(row, col);
      navigator.clipboard.writeText(val !== '-' ? val : '');
    } else if (action === 'edit') {
      setEditingCell({ rowId: row.row_id, colKey: col.source_key });
    } else if (action === 'reset') {
      handleResetToDefault(row.row_id, col.source_key);
    }
    
    setContextMenu({ ...contextMenu, visible: false }); 
  };

  // --- TABLE RENDERING HELPERS ---
  const getCellValue = (row, col) => {
    if (row.custom_fields && row.custom_fields[col.source_key] !== undefined) {
      return row.custom_fields[col.source_key];
    }
    return row[col.source_key];
  };

  const renderFormattedValue = (value, col, row) => {
    if (!value || value === 'N/A' || value === -1 || value === '-1') return '-';
    if (col.source_key === 'tabelog_url') return <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: '500' }}>Tabelog</a>;
    if (col.source_key === 'google_url') return <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: '500' }}>Maps</a>;
    if (col.source_key === 'tabelog_rating' || col.source_key === 'google_rating') return `⭐ ${value}`;
    if (col.source_key === 'google_name') {
      let name = value;
      if (name === 'No English Name') return row.japanese_name && row.japanese_name !== 'N/A' ? row.japanese_name : 'Unknown Restaurant';
      if (name.includes('No English Name')) return name.replace('No English Name', '').replace('()', '').replace('[]', '').trim();
      return name;
    }
    return value;
  };

  if (isLoading) return <div className="table-page-wrapper">Loading your table...</div>;
  const allSelected = rows.length > 0 && selectedRowIds.length === rows.length;

  return (
    <div className="table-page-wrapper" style={{ paddingBottom: selectedRowIds.length > 0 ? '100px' : '2rem' }}>
      <div className="table-header">
        <Link to="/tables" className="back-link">← Back to Dashboard</Link>
        <div className="header-title-container">
          <h1>{listName}</h1>
          <p className="header-subtitle">Restaurant List</p>
        </div>
        <div className="table-actions">
          <button className="btn-secondary" onClick={() => setIsColumnModalOpen(true)}>+ Add Column</button>
          <Link to="/master-list"><button className="btn-primary">+ Add Restaurant</button></Link>
        </div>
      </div>

      <div className="spreadsheet-container" style={{ maxHeight: '75vh', overflow: 'auto' }}>
        <table className="spreadsheet-table">
          <thead>
            <tr>
              <th className="checkbox-cell sticky-col-1">
                <label className="checkbox-hit-area">
                  <input type="checkbox" className="custom-checkbox" checked={allSelected} onChange={handleSelectAllRows} />
                </label>
              </th>
              {columns.map((col, index) => (
                <th 
                  key={col.id} 
                  className={index === 0 ? 'sticky-col-2' : ''}
                  style={{ width: colWidths[col.source_key] || '150px' }}
                >
                  {col.name}
                  <div 
                    className={`col-resizer ${isResizing && resizeData.colKey === col.source_key ? 'resizing' : ''}`}
                    onMouseDown={(e) => startResize(e, col.source_key)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} style={{ padding: '2rem', color: '#6b7280', textAlign: 'center' }}>
                  No restaurants added yet. Click "+ Add Restaurant" to get started!
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.row_id} style={{ backgroundColor: selectedRowIds.includes(row.row_id) ? '#eff6ff' : 'transparent' }}>
                  <td className="checkbox-cell sticky-col-1">
                    <label className="checkbox-hit-area">
                      <input type="checkbox" className="custom-checkbox" checked={selectedRowIds.includes(row.row_id)} onChange={() => handleSelectRow(row.row_id)} />
                    </label>
                  </td>
                  {columns.map((col, index) => {
                    const isEditing = editingCell.rowId === row.row_id && editingCell.colKey === col.source_key;
                    const cellValue = getCellValue(row, col);

                    return (
                      <td 
                        key={`${row.row_id}-${col.id}`} 
                        className={index === 0 ? 'sticky-col-2' : ''}
                        onDoubleClick={() => setEditingCell({ rowId: row.row_id, colKey: col.source_key })}
                        onContextMenu={(e) => {
                          e.preventDefault(); 
                          e.stopPropagation();
                          handleContextMenu(e, row, col);
                        }}
                        style={{ 
                          fontWeight: col.source_key === 'google_name' ? '600' : 'normal', 
                          width: colWidths[col.source_key] || '150px'
                        }}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            className="cell-edit-input"
                            autoFocus
                            defaultValue={cellValue === '-' ? '' : cellValue}
                            onBlur={(e) => handleSaveEdit(row.row_id, col.source_key, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.target.blur(); // Save
                              if (e.key === 'Escape') setEditingCell({ rowId: null, colKey: null }); // Cancel
                            }}
                          />
                        ) : (
                          renderFormattedValue(cellValue, col, row)
                        )}
                        <div 
                          className={`col-resizer ${isResizing && resizeData.colKey === col.source_key ? 'resizing' : ''}`}
                          onMouseDown={(e) => startResize(e, col.source_key)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- CUSTOM RIGHT CLICK MENU --- */}
      {contextMenu.visible && (
        <div 
          className="context-menu" 
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()} 
        >
          <div className="context-menu-item" onClick={() => handleMenuAction('copy-row')}>
            ↗️ Copy row to...
          </div>
          <div className="context-menu-item" onClick={() => handleMenuAction('copy-cell')}>
            📋 Copy Cell
          </div>
          <div className="context-menu-item" onClick={() => handleMenuAction('edit')}>
            ✏️ Edit Field
          </div>
          <div className="context-menu-item danger" onClick={() => handleMenuAction('reset')}>
            ↺ Reset to Default
          </div>
        </div>
      )}

      {/* --- FLOATING ACTION BAR --- */}
      {selectedRowIds.length > 0 && (
        <div className="floating-action-bar">
          <span>{selectedRowIds.length} Restaurant{selectedRowIds.length > 1 ? 's' : ''} Selected</span>
          <button className="btn-primary" onClick={() => setIsCopyModalOpen(true)}>
            Copy to Lists...
          </button>
          <button className="btn-danger" onClick={() => setIsDeleteModalOpen(true)}>
            Delete
          </button>
          <button 
            className="btn-secondary" 
            style={{ backgroundColor: 'transparent', color: '#9ca3af', border: 'none', padding: 0 }}
            onClick={() => setSelectedRowIds([])}
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* --- MODALS --- */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#ef4444' }}>Delete Restaurants?</h2>
            <p style={{ marginBottom: '2rem', color: '#4b5563' }}>
              Are you sure you want to remove <strong>{selectedRowIds.length}</strong> restaurant{selectedRowIds.length > 1 ? 's' : ''} from this list? This cannot be undone.
            </p>
            <div className="modal-actions" style={{ justifyContent: 'center', gap: '15px' }}>
              <button className="btn-secondary" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>Cancel</button>
              <button className="btn-danger" onClick={handleDeleteSelected} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCopyModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Copy to Lists</h2>
            <p style={{ marginBottom: '1.5rem', color: '#4b5563', fontSize: '0.9rem' }}>
              Select the lists where you want to copy the <strong>{selectedRowIds.length}</strong> selected restaurant{selectedRowIds.length > 1 ? 's' : ''}.
            </p>

            {userLists.length === 0 ? (
              <p style={{ color: '#ef4444', marginBottom: '1.5rem' }}>You don't have any other lists yet!</p>
            ) : (
              <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '10px' }}>
                {userLists.map(list => (
                  <label key={list.list_id} style={{ display: 'flex', alignItems: 'center', padding: '8px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}>
                    <input 
                      type="checkbox" 
                      className="custom-checkbox"
                      style={{ marginRight: '10px' }}
                      checked={selectedTargetLists.includes(list.list_id)}
                      onChange={() => handleToggleTargetList(list.list_id)}
                    />
                    {list.name}
                  </label>
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setIsCopyModalOpen(false)} disabled={isCopying}>Cancel</button>
              <button 
                className="btn-primary" 
                onClick={handleCopySelected} 
                disabled={isCopying || selectedTargetLists.length === 0}
              >
                {isCopying ? 'Copying...' : 'Copy Here'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isColumnModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add a Column</h2>
            <div className="radio-group">
              <label style={{ opacity: availableDefaultColumns.length === 0 ? 0.5 : 1, cursor: availableDefaultColumns.length === 0 ? 'not-allowed' : 'pointer' }}>
                <input type="radio" value="default" checked={columnType === 'default'} onChange={() => { setColumnType('default'); setErrorMessage(''); }} disabled={availableDefaultColumns.length === 0} /> Master Data
              </label>
              <label style={{ cursor: 'pointer' }}>
                <input type="radio" value="custom" checked={columnType === 'custom'} onChange={() => { setColumnType('custom'); setErrorMessage(''); }} /> Custom Column
              </label>
            </div>

            <form onSubmit={handleAddColumn}>
              {columnType === 'default' ? (
                <div className="form-group">
                  <label className="form-label">Select Data to Add:</label>
                  {availableDefaultColumns.length > 0 ? (
                    <select value={selectedDefaultCol} onChange={(e) => setSelectedDefaultCol(e.target.value)} className="form-input">
                      {availableDefaultColumns.map(col => <option key={col.source_key} value={col.source_key}>{col.name}</option>)}
                    </select>
                  ) : (
                    <p style={{ color: '#10b981', fontSize: '0.9rem', margin: 0 }}>You have already added all available master columns!</p>
                  )}
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Custom Column Name:</label>
                  <input type="text" placeholder="e.g., Who ordered what?" value={customColName} onChange={(e) => { setCustomColName(e.target.value); if (errorMessage) setErrorMessage(''); }} className={`form-input ${errorMessage ? 'input-error' : ''}`} autoFocus />
                  {errorMessage && <div className="error-message">{errorMessage}</div>}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setIsColumnModalOpen(false); setCustomColName(''); setErrorMessage(''); }} disabled={isAddingCol}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isAddingCol || (columnType === 'default' && availableDefaultColumns.length === 0)}>
                  {isAddingCol ? 'Adding...' : 'Add Column'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSuccessModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center', maxWidth: '400px' }}>
            <h2 style={{ color: successMessage.includes('Failed') ? '#ef4444' : '#10b981', marginBottom: '1rem' }}>
              {successMessage.includes('Failed') ? 'Error' : 'Update Complete'}
            </h2>
            <p style={{ fontSize: '1.05rem', marginBottom: '2rem', color: '#4b5563', lineHeight: '1.5' }}>
              {successMessage}
            </p>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={() => setIsSuccessModalOpen(false)}
                style={{ width: '100%' }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TableDetail;