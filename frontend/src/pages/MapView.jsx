import { useState, useEffect } from 'react';
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
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapView = () => {
    const [issues, setIssues] = useState([]);
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'Reported': return '#ed8936';
            case 'In Progress': return '#4299e1';
            case 'Resolved': return '#48bb78';
            default: return '#718096';
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading map...</p>
            </div>
        );
    }

    // Nashik, Maharashtra coordinates
    const nashikCenter = [19.9975, 73.7898];
    const defaultCenter = issues.length > 0 && issues[0].location
        ? [issues[0].location.lat, issues[0].location.lng]
        : nashikCenter;

    return (
        <div className="map-view">
            <div className="map-header">
                <h1>Nashik Civic Issues Map</h1>
                <p>📍 {issues.length} issues reported in Nashik</p>
            </div>

            <MapContainer
                center={defaultCenter}
                zoom={13}
                className="map-container"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {issues.map(issue => (
                    <Marker
                        key={issue._id}
                        position={[issue.location.lat, issue.location.lng]}
                    >
                        <Popup>
                            <div className="popup-content">
                                <h3>{issue.title}</h3>
                                <p className="popup-category">📍 {issue.category}</p>
                                <p className="popup-description">{issue.description}</p>
                                <span
                                    className="popup-status"
                                    style={{ background: getStatusColor(issue.status) }}
                                >
                                    {issue.status}
                                </span>
                                <p className="popup-upvotes">👍 {issue.upvotes?.length || 0} upvotes</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default MapView;
