import { useEffect, useRef } from 'react';

const GoogleMap = ({ 
    center = { lat: 9.9252, lng: 78.1198 }, // Madurai coordinates
    zoom = 15,
    height = '400px',
    width = '100%',
    className = ''
}) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);

    useEffect(() => {
        const initMap = () => {
            if (window.google && window.google.maps && mapRef.current) {
                // Create map
                const map = new window.google.maps.Map(mapRef.current, {
                    center: center,
                    zoom: zoom,
                    mapTypeId: window.google.maps.MapTypeId.ROADMAP,
                    styles: [
                        {
                            featureType: "poi",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }]
                        }
                    ]
                });

                // Add marker for Fatima College
                const marker = new window.google.maps.Marker({
                    position: center,
                    map: map,
                    title: 'Fatima College, Mary Land, Madurai',
                    icon: {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="16" cy="16" r="12" fill="#2563eb" stroke="white" stroke-width="2"/>
                                <circle cx="16" cy="16" r="4" fill="white"/>
                            </svg>
                        `),
                        scaledSize: new window.google.maps.Size(32, 32),
                        anchor: new window.google.maps.Point(16, 16)
                    }
                });

                // Add info window
                const infoWindow = new window.google.maps.InfoWindow({
                    content: `
                        <div style="padding: 10px; max-width: 250px;">
                            <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
                                Fatima College
                            </h3>
                            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                                Mary Land, Madurai<br>
                                Tamil Nadu, India - 625018
                            </p>
                            <div style="display: flex; gap: 8px; margin-top: 8px;">
                                <a href="https://www.google.com/maps/dir/?api=1&destination=${center.lat},${center.lng}" 
                                   target="_blank" 
                                   style="background: #2563eb; color: white; padding: 4px 8px; border-radius: 4px; text-decoration: none; font-size: 12px;">
                                    Get Directions
                                </a>
                            </div>
                        </div>
                    `
                });

                // Show info window on marker click
                marker.addListener('click', () => {
                    infoWindow.open(map, marker);
                });

                // Store map instance
                mapInstanceRef.current = map;
            }
        };

        // Check if Google Maps is already loaded
        if (window.google && window.google.maps) {
            initMap();
        } else {
            // Wait for Google Maps to load
            const checkGoogleMaps = setInterval(() => {
                if (window.google && window.google.maps) {
                    clearInterval(checkGoogleMaps);
                    initMap();
                }
            }, 100);

            // Cleanup interval after 10 seconds
            setTimeout(() => {
                clearInterval(checkGoogleMaps);
            }, 10000);
        }

        // Cleanup function
        return () => {
            if (mapInstanceRef.current) {
                // Clean up map instance if needed
                mapInstanceRef.current = null;
            }
        };
    }, [center.lat, center.lng, zoom]);

    return (
        <div 
            ref={mapRef} 
            style={{ height, width }} 
            className={`rounded-lg ${className}`}
        />
    );
};

export default GoogleMap;