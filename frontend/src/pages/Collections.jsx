import { useEffect, useState } from "react";
import api from "../services/api";
import "./Collections.css";

function Collections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState("admin");
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ status: "" });
  const [editMessage, setEditMessage] = useState("");
  const [bins, setBins] = useState([]);
  const [collectors, setCollectors] = useState([]);

  useEffect(() => {
    fetchCollections();
    if (userRole === "admin") {
      fetchBinsAndCollectors();
    }
    const role = localStorage.getItem("userRole") || "admin";
    setUserRole(role);
  }, []);

  const fetchCollections = async () => {
    try {
      let res;
      const role = localStorage.getItem("userRole") || "admin";
      
      if (role === "collector") {
        res = await api.get("/collections/my");
      } else {
        res = await api.get("/collections");
      }
      
      setCollections(res.data);
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("⛔ Collections are managed by administrators and waste collectors");
      } else {
        setError("Failed to load collections");
      }
      setLoading(false);
      console.error(err);
    }
  };

  const fetchBinsAndCollectors = async () => {
    try {
      const [binsRes, collectorsRes] = await Promise.all([
        api.get("/bins"),
        api.get("/users/collectors")
      ]);
      setBins(binsRes.data || []);
      setCollectors(collectorsRes.data || []);
    } catch (err) {
      console.error("Failed to load bins/collectors", err);
    }
  };

  const completeCollection = async (id) => {
    try {
      await api.put(`/collections/complete/${id}`);
      setCollections(collections.map(c => 
        c.id === id ? { ...c, status: "completed" } : c
      ));
    } catch (err) {
      console.error("Failed to complete collection", err);
    }
  };

  const openEditModal = (collection) => {
    setEditingId(collection.id);
    setEditFormData({ status: collection.status });
    setEditMessage("");
  };

  const closeEditModal = () => {
    setEditingId(null);
    setEditFormData({ status: "" });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/collections/${editingId}`, { status: editFormData.status });
      setCollections(collections.map(c => 
        c.id === editingId ? { ...c, status: editFormData.status } : c
      ));
      setEditMessage("✅ Collection updated successfully!");
      setTimeout(() => {
        closeEditModal();
      }, 1500);
    } catch (err) {
      setEditMessage("❌ Failed to update collection");
      console.error(err);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "⏳";
      case "completed":
        return "✅";
      case "in-progress":
        return "🔄";
      case "collected":
        return "✔️";
      default:
        return "❓";
    }
  };

  if (loading) return <div className="collections-container"><p>Loading collections...</p></div>;
  if (error) {
    return (
      <div className="collections-container">
        <div className="page-header">
          <h1>🚚 Collections</h1>
          <p>Track and manage waste collection assignments</p>
        </div>
        <div className="permission-message">
          <p>{error}</p>
          <a href="/dashboard" className="btn btn-primary">← Back to Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div className="collections-container">
      <div className="page-header">
        <h1>🚚 Collections</h1>
        <p>Track and manage waste collection assignments</p>
      </div>

      {collections.length === 0 ? (
        <div className="empty-state">
          <p>📭 No collections at the moment</p>
        </div>
      ) : (
        <div className="collections-list">
          {collections.map((collection) => (
            <div key={collection.id} className={`collection-item ${collection.status?.toLowerCase() || 'pending'}`}>
              <div className="collection-header">
                <span className="collection-icon">{getStatusIcon(collection.status)}</span>
                <div className="collection-info">
                  <h3>Collection #{collection.id}</h3>
                  <p className="collection-details">
                    Bin #{collection.bin_id} • {collection.location || "Location not set"}
                  </p>
                </div>
                <span className="collection-status">{collection.status || "Pending"}</span>
              </div>

              <div className="collection-body">
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Location</span>
                    <span className="info-value">{collection.location || "N/A"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Bin Capacity</span>
                    <span className="info-value">{collection.capacity || "0"} L</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Current Fill</span>
                    <span className="info-value">{collection.current_fill || "0"}%</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Status</span>
                    <span className="info-value">{collection.bin_status || "Unknown"}</span>
                  </div>
                </div>
              </div>

              <div className="collection-footer">
                {userRole === "collector" && collection.status?.toLowerCase() === "pending" && (
                  <button
                    className="btn-small btn-primary"
                    onClick={() => completeCollection(collection.id)}
                  >
                    Complete Collection
                  </button>
                )}
                {userRole === "admin" && (
                  <>
                    <button 
                      className="btn-small btn-secondary"
                      onClick={() => openEditModal(collection)}
                    >
                      Edit
                    </button>
                    {collection.status?.toLowerCase() !== "completed" && collection.status?.toLowerCase() !== "collected" && (
                      <button className="btn-small btn-primary">Reassign</button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingId && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Collection #{editingId}</h2>
              <button className="modal-close" onClick={closeEditModal}>✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="modal-form">
              {editMessage && (
                <div className={editMessage.includes("✅") ? "success-message" : "error-message"}>
                  {editMessage}
                </div>
              )}

              <div className="form-group">
                <label>Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="collected">Collected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="modal-buttons">
                <button type="submit" className="btn btn-primary">Save Changes</button>
                <button type="button" className="btn btn-secondary" onClick={closeEditModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Collections;
