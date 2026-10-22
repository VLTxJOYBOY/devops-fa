import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createIssue, getRepresentatives } from '../utils/api';
import './ReportIssue.css';

const CATEGORIES = [
    { id: 'Road', label: 'Road & Potholes', icon: '🛣️', desc: 'Damaged pavement, potholes, or obstructions' },
    { id: 'Light', label: 'Street Lighting', icon: '💡', desc: 'Dark streets, flickering lamps, or damaged poles' },
    { id: 'Water', label: 'Water Supply', icon: '🚰', desc: 'Pipeline leaks, contamination, or water outage' },
    { id: 'Garbage', label: 'Sanitation & Waste', icon: '🗑️', desc: 'Overflowing dumpsters, illegal trash dumping' },
    { id: 'Other', label: 'General Hazard', icon: '⚠️', desc: 'Drainage, fallen trees, or public safety issues' }
];

const ReportIssue = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Road',
        area: '',
        taggedRepresentative: '',
        lat: '',
        lng: '',
        imageUrl: ''
    });
    const [representatives, setRepresentatives] = useState([]);
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const navigate = useNavigate();

    // Derived state for areas
    const availableAreas = [...new Set(representatives.map(r => r.area))].filter(Boolean);
    const filteredReps = representatives.filter(r => r.area === formData.area);

    useEffect(() => {
        const fetchReps = async () => {
            try {
                const { data } = await getRepresentatives();
                setRepresentatives(data);
            } catch (_err) {
                console.error("Failed to fetch representatives");
            }
        };
        fetchReps();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleCategorySelect = (categoryId) => {
        setFormData(prev => ({ ...prev, category: categoryId }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setLoading(true);

        const lat = parseFloat(formData.lat);
        const lng = parseFloat(formData.lng);

        if (isNaN(lat) || isNaN(lng)) {
            setError('Please provide valid numerical latitude and longitude coordinates.');
            setLoading(false);
            return;
        }

        try {
            await createIssue({
                title: formData.title,
                description: formData.description,
                category: formData.category,
                taggedRepresentative: formData.taggedRepresentative,
                lat,
                lng,
                imageUrl: formData.imageUrl || undefined
            });

            setSuccessMsg('Incident successfully dispatched to municipal queue!');
            setTimeout(() => {
                navigate('/');
            }, 1200);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit incident report');
        } finally {
            setLoading(false);
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    lat: position.coords.latitude.toFixed(6),
                    lng: position.coords.longitude.toFixed(6)
                }));
                setLocating(false);
            },
            (_err) => {
                // If denied or on local IP, provide a Nashik default
                setFormData(prev => ({
                    ...prev,
                    lat: '19.9975',
                    lng: '73.7898'
                }));
                setLocating(false);
            },
            { timeout: 8000 }
        );
    };

    const selectedRep = representatives.find(r => r._id === formData.taggedRepresentative);

    return (
        <div className="report-page-layout">
            <div className="report-glass-container">
                <div className="report-page-header">
                    <div className="report-badge">
                        <span className="beacon-cyan"></span>
                        <span>DISPATCH TERMINAL</span>
                    </div>
                    <h1>Report Civic <span className="title-gradient">Incident</span></h1>
                    <p>Log a localized public infrastructure breakdown for targeted municipal resolution.</p>
                </div>

                <form onSubmit={handleSubmit} className="report-interactive-form">
                    {/* Category Selector Grid */}
                    <div className="form-section-block">
                        <label className="section-label">1. Select Incident Category</label>
                        <div className="category-selection-grid">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    className={`category-tile ${formData.category === cat.id ? 'active' : ''}`}
                                    onClick={() => handleCategorySelect(cat.id)}
                                >
                                    <span className="tile-icon">{cat.icon}</span>
                                    <span className="tile-title">{cat.label}</span>
                                    <span className="tile-desc">{cat.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Incident Details */}
                    <div className="form-section-block">
                        <label className="section-label">2. Incident Details</label>
                        <div className="fields-stack">
                            <div className="form-group-item">
                                <label>Incident Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. Major Pothole near City Center Circle"
                                    className="cyber-input"
                                />
                            </div>

                            <div className="form-group-item">
                                <label>Detailed Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    rows="4"
                                    placeholder="Describe severity, hazards caused, street landmarks, duration..."
                                    className="cyber-textarea"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Zone & Representative Assignment */}
                    <div className="form-section-block">
                        <label className="section-label">3. Target Ward & Responsible Representative</label>
                        <div className="grid-two-col">
                            <div className="form-group-item">
                                <label>Select Municipal Area / Ward</label>
                                <select
                                    name="area"
                                    value={formData.area}
                                    onChange={(e) => setFormData({ ...formData, area: e.target.value, taggedRepresentative: '' })}
                                    required
                                    className="cyber-select"
                                >
                                    <option value="">-- Choose Area --</option>
                                    {availableAreas.map(area => (
                                        <option key={area} value={area}>{area}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group-item">
                                <label>Assign Official</label>
                                <select
                                    name="taggedRepresentative"
                                    value={formData.taggedRepresentative}
                                    onChange={handleChange}
                                    required
                                    disabled={!formData.area}
                                    className="cyber-select"
                                >
                                    <option value="">{formData.area ? '-- Choose Representative --' : 'First pick an Area'}</option>
                                    {filteredReps.map(rep => (
                                        <option key={rep._id} value={rep._id}>
                                            {rep.username} ({rep.designation})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {selectedRep && (
                            <div className="rep-preview-pill">
                                <span className="rep-pill-icon">👮</span>
                                <div>
                                    <strong>{selectedRep.username}</strong> ({selectedRep.designation})
                                    <span className="rep-pill-area">Responsible for {selectedRep.area}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* GPS Coordinates */}
                    <div className="form-section-block">
                        <div className="coords-header-row">
                            <label className="section-label">4. Geospatial Coordinates</label>
                            <button
                                type="button"
                                onClick={getCurrentLocation}
                                className="btn-auto-gps"
                                disabled={locating}
                            >
                                <span>{locating ? '📡 Acquiring GPS...' : '📍 Auto-Detect Location'}</span>
                            </button>
                        </div>

                        <div className="grid-two-col">
                            <div className="form-group-item">
                                <label>Latitude</label>
                                <input
                                    type="text"
                                    name="lat"
                                    value={formData.lat}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. 19.9975"
                                    className="cyber-input"
                                />
                            </div>

                            <div className="form-group-item">
                                <label>Longitude</label>
                                <input
                                    type="text"
                                    name="lng"
                                    value={formData.lng}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. 73.7898"
                                    className="cyber-input"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Photographic Evidence */}
                    <div className="form-section-block">
                        <label className="section-label">5. Photographic Evidence (Optional)</label>
                        <div className="form-group-item">
                            <input
                                type="url"
                                name="imageUrl"
                                value={formData.imageUrl}
                                onChange={handleChange}
                                placeholder="Paste image URL (https://...)"
                                className="cyber-input"
                            />
                        </div>

                        {formData.imageUrl && (
                            <div className="evidence-preview-box">
                                <span className="preview-label">Live Preview:</span>
                                <div className="preview-frame">
                                    <img
                                        src={formData.imageUrl}
                                        alt="Preview"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status Feedback */}
                    {error && (
                        <div className="report-feedback error">
                            <span>⚠️ {error}</span>
                        </div>
                    )}

                    {successMsg && (
                        <div className="report-feedback success">
                            <span>✓ {successMsg}</span>
                        </div>
                    )}

                    {/* Submit Bar */}
                    <div className="report-actions-bar">
                        <button
                            type="button"
                            className="btn-cancel-report"
                            onClick={() => navigate('/')}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-submit-report"
                            disabled={loading}
                        >
                            {loading ? 'Transmitting Incident...' : 'Transmit Report ➔'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportIssue;
