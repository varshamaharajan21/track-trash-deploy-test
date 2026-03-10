import { useEffect, useState } from "react";
import api from "../services/api";
import "./Alerts.css";

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState("user");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    bin_id: "",
    message: "",
    description: "",
    severity: "info"
  });
  const [formMessage, setFormMessage] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "user";
    setUserRole(role);
    
    fetchAlerts();
    fetchBins();
  }, []);

  const fetchAlerts = async () => {
    try {
      const role = localStorage.getItem("userRole") || "user";
      let res;
      
      if (role === "admin") {
        res = await api.get("/alerts");
      } else {
        res = await api.get("/alerts/my");
      }
      
      setAlerts(res.data || []);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setError("Failed to load alerts");
      setLoading(false);
    }
  };

  const fetchBins = async () => {
    try {
      const res = await api.get("/bins");
      setBins(res.data || []);
    } catch (err) {
      console.error("Failed to load bins:", err);
    }
  };

  const handleSubmitAlert = async (e) => {
    e.preventDefault();
    setFormMessage("");

    if (!formData.bin_id || !formData.message) {
      setFormMessage("❌ Bin and message are required");
      return;
    }

    try {
      await api.post("/alerts", {
        bin_id: parseInt(formData.bin_id),
        message: formData.message,
        description: formData.description,
        severity: formData.severity
      });

      setFormMessage("✅ Alert sent successfully!");
      setFormData({
        bin_id: "",
        message: "",
        description: "",
        severity: "info"
      });
      
      setTimeout(() => {
        setShowForm(false);
        setFormMessage("");
        fetchAlerts();
      }, 1500);
    } catch (err) {
      setFormMessage("❌ Failed to send alert");
      console.error(err);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "🔴";
      case "warning":
        return "🟠";
      case "info":
        return "🔵";
      default:
        return "⚪";
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "#dc2626";
      case "warning":
        return "#f59e0b";
      case "info":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  if (loading) return <div className="alerts-container"><p>Loading alerts...</p></div>;

  return (
    <div className="alerts-container">
      <div className="page-header">
        <h1>⚠️ Alerts</h1>
        <p>{userRole === "admin" ? "Monitor all system alerts" : "Send and view your alerts"}</p>
      </div>

      {/* Create Alert Form for Non-Admins */}
      {userRole !== "admin" && (
        <div className="alert-creation-section">
          {!showForm ? (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              + Send New Alert
            </button>
          ) : (
            <form className="alert-form" onSubmit={handleSubmitAlert}>
              {formMessage && (
                <div className={formMessage.includes("✅") ? "success-message" : "error-message"}>
                  {formMessage}
                </div>
              )}

              <div className="form-group">
                <label>Bin *</label>
                <select
                  value={formData.bin_id}
                  onChange={(e) => setFormData({ ...formData, bin_id: e.target.value })}
                  required
                >
                  <option value="">Select a bin</option>
                  {bins.length > 0 ? (
                    bins.map((bin) => (
                      <option key={bin.id} value={bin.id}>
                        Bin #{bin.id} - {bin.location || "No location"}
                      </option>
                    ))
                  ) : (
                    <option disabled>No bins available</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Alert Message *</label>
                <input
                  type="text"
                  placeholder="Brief description of the alert..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Details</label>
                <textarea
                  placeholder="Additional details (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Severity</label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="form-buttons">
                <button type="submit" className="btn btn-primary">Send Alert</button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setFormMessage("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="empty-state">
          <p>{userRole === "admin" ? "✨ No alerts in the system" : "✨ You haven't sent any alerts yet"}</p>
        </div>
      ) : (
        <div className="alerts-list">
          {alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`alert-item ${alert.severity?.toLowerCase() || "info"}`}
              style={{ borderLeftColor: getSeverityColor(alert.severity) }}
            >
              <div className="alert-header">
                <span className="alert-icon">{getSeverityIcon(alert.severity)}</span>
                <div className="alert-title-section">
                  <h3>{alert.message || alert.type || "Alert"}</h3>
                  <p className="alert-bin">Bin #{alert.bin_id || "N/A"}</p>
                </div>
                <span className="alert-severity">{alert.severity || "Info"}</span>
              </div>
              <div className="alert-body">
                <p>{alert.description || "No additional details"}</p>
              </div>
              <div className="alert-footer">
                <span className="alert-time">
                  {alert.created_at ? new Date(alert.created_at).toLocaleString() : "Unknown time"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Alerts;
