import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { getIssues } from '../utils/api';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// Fix for default marker icons in react-leaflet
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapView = () => {
    const [issues, setIssues] = useState([]);
    const [statusFilter, setStatusFilter] = useState('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchIssues = async () => {
            try {
                const { data } = await getIssues();
                setIssues(data);
            } catch (err) {
                console.error('Failed to fetch issues:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchIssues();
    }, []);

    // Filter valid geolocated issues
    const geoIssues = useMemo(() => {
        return issues
            .map(issue => {
                const lat = issue.lat != null ? Number(issue.lat) : (issue.location?.lat != null ? Number(issue.location.lat) : null);
                const lng = issue.lng != null ? Number(issue.lng) : (issue.location?.lng != null ? Number(issue.location.lng) : null);
                return { ...issue, computedLat: lat, computedLng: lng };
            })
            .filter(i => i.computedLat != null && i.computedLng != null && !isNaN(i.computedLat) && !isNaN(i.computedLng));
    }, [issues]);

    const filteredIssues = useMemo(() => {
        if (statusFilter === 'All') return geoIssues;
        return geoIssues.filter(i => i.status === statusFilter);
    }, [geoIssues, statusFilter]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Initializing Geospatial Radar Map...</p>
            </div>
        );
    }

    const defaultCenter = geoIssues.length > 0
        ? [geoIssues[0].computedLat, geoIssues[0].computedLng]
        : [19.9975, 73.7898];

    return (
        <div className="map-page-layout">
            {/* Map Top HUD */}
            <div className="map-hud-header">
                <div className="map-title-group">
                    <div className="radar-badge">
                        <span className="radar-ping"></span>
                        <span>GEOSPATIAL RADAR HUD</span>
                    </div>
                    <h1>Municipal <span className="title-gradient">Incident Radar</span></h1>
                </div>

                <div className="map-hud-filters">
                    {['All', 'Reported', 'In Progress', 'Resolved'].map(st => (
                        <button
                            key={st}
                            className={`hud-filter-btn ${statusFilter === st ? 'active ' + st.toLowerCase().replace(' ', '-') : ''}`}
                            onClick={() => setStatusFilter(st)}
                        >
                            {st} ({st === 'All' ? geoIssues.length : geoIssues.filter(i => i.status === st).length})
                        </button>
                    ))}
                </div>
            </div>

            {/* Leaflet Map Frame */}
            <div className="map-frame-wrapper">
                <MapContainer
                    center={defaultCenter}
                    zoom={13}
                    className="cyber-map-container"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {filteredIssues.map(issue => (
                        <Marker
                            key={issue._id}
                            position={[issue.computedLat, issue.computedLng]}
                        >
                            <Popup className="cyber-map-popup">
                                <div className="popup-card-content">
                                    <div className="popup-category-badge">
                                        <span>📍 {issue.category || 'General'}</span>
                                    </div>
                                    <h4 className="popup-title">{issue.title}</h4>
                                    <p className="popup-desc">{issue.description}</p>

                                    {issue.imageUrl && (
                                        <div className="popup-img-frame">
                                            <img src={issue.imageUrl} alt="Incident" />
                                        </div>
                                    )}

                                    <div className="popup-footer-row">
                                        <span className={`popup-status-pill ${issue.status?.toLowerCase().replace(' ', '-')}`}>
                                            {issue.status}
                                        </span>
                                        <span className="popup-upvotes">⚡ {issue.upvotes?.length || 0} Upvotes</span>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};

export default MapView;
