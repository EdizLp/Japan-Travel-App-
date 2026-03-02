import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './SupabaseClient'; 
import { useAuth } from './AuthProvider';   

const TablesDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Grab the logged-in user
  
  // Dashboard State
  const [myTables, setMyTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // --- NEW: Fetch the user's lists when the dashboard loads ---
  useEffect(() => {
    const fetchMyTables = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('user_spreadsheets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }); // Newest lists first
        
      if (error) {
        console.error("Error fetching tables:", error);
      } else {
        setMyTables(data || []);
      }
      setIsLoading(false);
    };

    fetchMyTables();
  }, [user]);

  // --- NEW: Handle Form Submission & Save to Supabase ---
  const handleCreateList = async (e) => {
    e.preventDefault(); 
    if (!newTableName.trim() || !user) return;

    setIsCreating(true); // Disables the button so they don't double-click

    try {
      // 1. Create the new list in user_spreadsheets
      const { data: newList, error: listError } = await supabase
        .from('user_spreadsheets')
        .insert([
          { name: newTableName, user_id: user.id } 
          // Note: list_id is generated automatically by Supabase!
        ])
        .select()
        .single(); // Returns the single object we just created

      if (listError) throw listError;

      // 2. Prepare the 12 default columns you requested
      const defaultColumns = [
        { list_id: newList.list_id, name: 'Restaurant Name', source_key: 'google_name', source_type: 'master', order_index: 1 },
        { list_id: newList.list_id, name: 'Tabelog Rating', source_key: 'tabelog_rating', source_type: 'master', order_index: 2 },
        { list_id: newList.list_id, name: 'Tabelog Link', source_key: 'tabelog_url', source_type: 'master', order_index: 3 },
        { list_id: newList.list_id, name: 'Reservation Availability', source_key: 'reservation_availability', source_type: 'master', order_index: 4 },
        { list_id: newList.list_id, name: 'Establishment Type', source_key: 'type', source_type: 'master', order_index: 5 },
        { list_id: newList.list_id, name: 'Prefecture', source_key: 'prefecture', source_type: 'master', order_index: 6 },
        { list_id: newList.list_id, name: 'City', source_key: 'city', source_type: 'master', order_index: 7 },
        { list_id: newList.list_id, name: 'Google Rating', source_key: 'google_rating', source_type: 'master', order_index: 8 },
        { list_id: newList.list_id, name: 'Operational Info', source_key: 'operational_info', source_type: 'master', order_index: 9 },
        { list_id: newList.list_id, name: 'Price', source_key: 'price_level', source_type: 'master', order_index: 10 },
        { list_id: newList.list_id, name: 'Google Maps Link', source_key: 'google_url', source_type: 'master', order_index: 11 },
        { list_id: newList.list_id, name: 'Opening Times', source_key: 'opening_times', source_type: 'master', order_index: 12 }
      ];

      // 3. Insert all 12 default columns at once into spreadsheet_columns
      const { error: colError } = await supabase
        .from('spreadsheet_columns')
        .insert(defaultColumns);

      if (colError) throw colError;

      // 4. Reset modal state and instantly navigate to the new table!
      setIsModalOpen(false);
      setNewTableName('');
      navigate(`/tables/${newList.list_id}`);

    } catch (error) {
      console.error("Error creating table:", error.message);
      alert("Failed to create the list. Check console for details.");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) return <div style={{ padding: '2rem' }}>Loading your lists...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>My Restaurant Lists</h1>
      <button 
        className="btn-primary" 
        style={{ marginBottom: '2rem' }}
        onClick={() => setIsModalOpen(true)}
      >
        + Create New List
      </button>
      
      {/* --- GRID OF REAL SUPABASE TABLES --- */}
      {myTables.length === 0 ? (
        <p>You don't have any lists yet. Create one above!</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
          {myTables.map((table) => (
            <div key={table.list_id} style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
              <h3>{table.name}</h3>
              <p>Created: {new Date(table.created_at).toLocaleDateString()}</p>
              <Link to={`/tables/${table.list_id}`}>
                <button className="btn-secondary" style={{ marginTop: '10px' }}>Open List</button>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* --- THE POPUP MODAL --- */}
      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2>Name your new list</h2>
            <form onSubmit={handleCreateList}>
              <input 
                type="text" 
                placeholder="e.g., Osaka Street Food" 
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                style={inputStyle}
                autoFocus
                disabled={isCreating}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Quick inline styles for the modal
const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
};
const modalContentStyle = {
  background: 'white', padding: '2rem', borderRadius: '8px', width: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
};
const inputStyle = {
  width: '100%', padding: '10px', marginTop: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box'
};

export default TablesDashboard;