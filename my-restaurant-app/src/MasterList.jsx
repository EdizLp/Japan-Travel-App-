import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from './SupabaseClient';
import { useAuth } from './AuthProvider';
import './tabledetail.css'; 

const MasterList = () => {
  const { user, profile } = useAuth(); // Profile grabs the user's role!
  const [restaurants, setRestaurants] = useState([]);
  const [myTables, setMyTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Multi-Select State
  const [selectedRestIds, setSelectedRestIds] = useState([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTableIds, setSelectedTableIds] = useState([]);
  const [isAdding, setIsAdding] = useState(false);

  // Success Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Right-Click State
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, row: null, colKey: null });

  // COLUMN RESIZING STATE
  const [colWidths, setColWidths] = useState({});
  const [isResizing, setIsResizing] = useState(false);
  const [resizeData, setResizeData] = useState({ colKey: null, startX: 0, startWidth: 0 });

  useEffect(() => {
    const fetchMasterData = async () => {
      setIsLoading(true);
      const { data: masterData } = await supabase
        .from('master_restaurant_list')
        .select('*')
        .limit(100); 

      if (masterData) setRestaurants(masterData);

      if (user) {
        const { data: tablesData } = await supabase
          .from('user_spreadsheets')
          .select('*')
          .eq('user_id', user.id);

        if (tablesData && tablesData.length > 0) {
          setMyTables(tablesData);
        }
      }
      setIsLoading(false);
    };
    fetchMasterData();
  }, [user]);

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

  // --- CLEANUP HELPERS ---
  const formatText = (text) => (!text || text === 'N/A') ? '-' : text;
  const formatRating = (rating) => (!rating || rating === -1 || rating === '-1' || rating === 'N/A') ? '-' : `⭐ ${rating}`;

  const getDisplayName = (rest) => {
    let name = rest.google_name;
    if (!name || name === 'N/A' || name === 'No English Name') {
      return formatText(rest.japanese_name) !== '-' ? rest.japanese_name : 'Unknown Restaurant';
    }
    if (name.includes('No English Name')) {
      name = name.replace('No English Name', '').replace('()', '').replace('[]', '').trim();
    }
    return name;
  };

  // --- SELECTION LOGIC ---
  const handleSelectRest = (google_id) => {
    setSelectedRestIds(prev => 
      prev.includes(google_id) ? prev.filter(id => id !== google_id) : [...prev, google_id]
    );
  };

  const handleSelectAllRests = (e) => {
    if (e.target.checked) setSelectedRestIds(restaurants.map(r => r.google_id));
    else setSelectedRestIds([]);
  };

  const handleSelectTable = (table_id) => {
    setSelectedTableIds(prev => 
      prev.includes(table_id) ? prev.filter(id => id !== table_id) : [...prev, table_id]
    );
  };

  // --- CONTEXT MENU LOGIC ---
  const handleContextMenu = (e, row, colKey) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ visible: true, x: e.pageX, y: e.pageY, row, colKey });
  };

  const handleMenuAction = (action) => {
    const { row, colKey } = contextMenu;
    
    if (action === 'copy-row') {
      setSelectedRestIds([row.google_id]);
      setIsModalOpen(true);
    } else if (action === 'copy-cell') {
      const val = row[colKey];
      navigator.clipboard.writeText(val !== '-' ? val : '');
    } else if (action === 'edit-master') {
      // Future feature for admins to edit master database directly
      alert("Admin Edit triggered for: " + row.google_name);
    }
    
    setContextMenu({ ...contextMenu, visible: false });
  };

  // --- BULK INSERT LOGIC ---
  const handleAddToTables = async (e) => {
    e.preventDefault();
    if (selectedTableIds.length === 0 || selectedRestIds.length === 0) return;
    
    setIsAdding(true);

    const insertPromises = [];
    selectedTableIds.forEach(listId => {
      selectedRestIds.forEach(googleId => {
        insertPromises.push(
          supabase.from('spreadsheet_rows').insert([{ list_id: listId, google_id: googleId }])
        );
      });
    });

    try {
      const results = await Promise.all(insertPromises);
      
      const realErrors = results.filter(res => res.error && res.error.code !== '23505'); 
      const duplicateErrors = results.filter(res => res.error && res.error.code === '23505');
      
      if (realErrors.length > 0) {
        setSuccessMessage('Added most, but some failed due to a database connection issue.');
        setIsSuccessModalOpen(true);
      } else {
        const totalAttempted = insertPromises.length;
        const duplicates = duplicateErrors.length;
        const successfulAdds = totalAttempted - duplicates;
        
        let finalMessage = '';
        if (duplicates === 0) {
          finalMessage = `Successfully added ${successfulAdds} restaurant(s) to your lists!`;
        } else if (duplicates === totalAttempted) {
          finalMessage = 'No new restaurants added. All selected items were already in these lists!';
        } else {
          finalMessage = `Successfully added ${successfulAdds} restaurant(s)! (Skipped ${duplicates} duplicate${duplicates > 1 ? 's' : ''} to keep your lists clean).`;
        }
        
        setIsModalOpen(false);
        setSelectedRestIds([]); 
        setSelectedTableIds([]); 
        setSuccessMessage(finalMessage);
        setIsSuccessModalOpen(true);
      }
    } catch (error) {
      console.error("Bulk add error:", error);
      setSuccessMessage("Failed to add restaurants. Try again.");
      setIsSuccessModalOpen(true);
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) return <div className="table-page-wrapper">Loading database...</div>;
  const allSelected = restaurants.length > 0 && selectedRestIds.length === restaurants.length;

  // Render Array for clean master table mapping
  const masterColumns = [
    { key: 'google_name', label: 'Name' },
    { key: 'prefecture', label: 'Prefecture' },
    { key: 'city', label: 'City' },
    { key: 'type', label: 'Type' },
    { key: 'tabelog_rating', label: 'Tabelog' },
    { key: 'tabelog_url', label: 'Tabelog Link' },
    { key: 'google_url', label: 'Google Maps' },
  ];

  return (
    <div className="table-page-wrapper" style={{ paddingBottom: selectedRestIds.length > 0 ? '100px' : '2rem' }}>
      <div className="table-header">
        <Link to="/tables" className="back-link">← Back to Dashboard</Link>
        <div className="header-title-container">
          <h1>Master Restaurant Database</h1>
          <p className="header-subtitle">Select verified restaurants and add them to your lists.</p>
        </div>
      </div>

      <div className="spreadsheet-container" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
        <table className="spreadsheet-table master-table">
          <thead>
            <tr>
              <th className="checkbox-cell sticky-col-1">
                <label className="checkbox-hit-area">
                  <input type="checkbox" className="custom-checkbox" checked={allSelected} onChange={handleSelectAllRests} />
                </label>
              </th>
              {masterColumns.map((col, index) => (
                <th 
                  key={col.key} 
                  className={index === 0 ? 'sticky-col-2' : ''}
                  style={{ width: colWidths[col.key] || '150px' }}
                >
                  {col.label}
                  <div 
                    className={`col-resizer ${isResizing && resizeData.colKey === col.key ? 'resizing' : ''}`}
                    onMouseDown={(e) => startResize(e, col.key)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {restaurants.map((rest) => (
              <tr key={rest.google_id} style={{ backgroundColor: selectedRestIds.includes(rest.google_id) ? '#eff6ff' : 'transparent' }}>
                <td className="checkbox-cell sticky-col-1">
                    <label className="checkbox-hit-area">
                      <input type="checkbox" className="custom-checkbox" checked={selectedRestIds.includes(rest.google_id)} onChange={() => handleSelectRest(rest.google_id)} />
                    </label>
                </td>
                
                {masterColumns.map((col, index) => {
                  let cellContent;
                  if (col.key === 'google_name') cellContent = getDisplayName(rest);
                  else if (col.key === 'prefecture') cellContent = formatText(rest.prefecture);
                  else if (col.key === 'city') cellContent = formatText(rest.city);
                  else if (col.key === 'type') cellContent = formatText(rest.type);
                  else if (col.key === 'tabelog_rating') cellContent = formatRating(rest.tabelog_rating);
                  else if (col.key === 'tabelog_url') cellContent = rest.tabelog_url && rest.tabelog_url !== 'N/A' ? <a href={rest.tabelog_url} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: '500' }}>Tabelog</a> : '-';
                  else if (col.key === 'google_url') cellContent = rest.google_url && rest.google_url !== 'N/A' ? <a href={rest.google_url} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: '500' }}>Maps</a> : '-';

                  return (
                    <td 
                      key={col.key}
                      className={index === 0 ? 'sticky-col-2' : ''}
                      onContextMenu={(e) => handleContextMenu(e, rest, col.key)}
                      style={{ 
                        fontWeight: index === 0 ? '600' : 'normal',
                        width: colWidths[col.key] || '150px'
                      }}
                    >
                      {cellContent}
                      <div 
                        className={`col-resizer ${isResizing && resizeData.colKey === col.key ? 'resizing' : ''}`}
                        onMouseDown={(e) => startResize(e, col.key)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- ROLE BASED CONTEXT MENU --- */}
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
          
          {/* ONLY SHOW THIS TO SUPERUSERS / EDITORS */}
          {(profile?.role === 'superuser' || profile?.role === 'editor') && (
            <div className="context-menu-item danger" onClick={() => handleMenuAction('edit-master')}>
              ⚙️ Edit Master Data (Admin)
            </div>
          )}
        </div>
      )}

      {/* --- FLOATING ACTION BAR --- */}
      {selectedRestIds.length > 0 && (
        <div className="floating-action-bar">
          <span>{selectedRestIds.length} Restaurant{selectedRestIds.length > 1 ? 's' : ''} Selected</span>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            Copy to Lists...
          </button>
          <button 
            className="btn-secondary" 
            style={{ backgroundColor: 'transparent', color: '#9ca3af', border: 'none', padding: 0 }}
            onClick={() => setSelectedRestIds([])}
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* --- SELECT TABLE MODAL --- */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Copy to Lists</h2>
            <p>Select which lists to add these <strong>{selectedRestIds.length}</strong> restaurants to:</p>
            
            <form onSubmit={handleAddToTables}>
              {myTables.length > 0 ? (
                <div className="table-checklist">
                  {myTables.map(table => (
                    <label key={table.list_id} className="table-checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={selectedTableIds.includes(table.list_id)}
                        onChange={() => handleSelectTable(table.list_id)}
                      />
                      {table.name}
                    </label>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#ef4444', marginTop: '1rem' }}>
                  You don't have any lists yet! Go back to the dashboard and create one first.
                </p>
              )}

              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isAdding}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isAdding || myTables.length === 0 || selectedTableIds.length === 0}>
                  {isAdding ? 'Adding...' : 'Save to Lists'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* --- SUCCESS / RESULTS MODAL --- */}
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

export default MasterList;