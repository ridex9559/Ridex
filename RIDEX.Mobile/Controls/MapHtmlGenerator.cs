namespace RIDEX.Mobile.Controls;

public static class MapHtmlGenerator
{
    public static string GenerateLiveMapHtml(
        double initialLat = 19.5447,
        double initialLon = 73.7663,
        int zoom = 12,
        string polylineGeoJson = "")
    {
        return $@"<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"" />
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"" />
    <title>RIDEX Live Map</title>
    <link rel=""stylesheet"" href=""https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"" />
    <script src=""https://unpkg.com/leaflet@1.9.4/dist/leaflet.js""></script>
    <style>
        body, html, #map {{
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: #0b0f19;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }}
        .rider-marker {{
            display: flex;
            align-items: center;
            justify-content: center;
            background: #FF6B00;
            color: #fff;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            box-shadow: 0 0 12px rgba(255, 107, 0, 0.8), 0 2px 6px rgba(0,0,0,0.6);
            border: 2px solid #ffffff;
            font-size: 18px;
            transition: all 0.3s ease;
        }}
        .rider-separated {{
            background: #FF1744 !important;
            box-shadow: 0 0 15px rgba(255, 23, 68, 0.9) !important;
            animation: pulse-red 1.5s infinite;
        }}
        @keyframes pulse-red {{
            0% {{ transform: scale(1); }}
            50% {{ transform: scale(1.15); }}
            100% {{ transform: scale(1); }}
        }}
        .rider-popup {{
            background: #161D27;
            color: #FFFFFF;
            padding: 6px 10px;
            border-radius: 8px;
            font-size: 12px;
            border: 1px solid #334155;
        }}
    </style>
</head>
<body>
    <div id=""map""></div>
    <script>
        var map = L.map('map', {{ zoomControl: false }}).setView([{initialLat}, {initialLon}], {zoom});

        L.tileLayer('https://{{s}}.tile.openstreetmap.org/{{z}}/{{x}}/{{y}}.png', {{
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }}).addTo(map);

        var riderMarkers = {{}};

        window.updateRider = function(id, name, lat, lon, speed, heading, isSeparated) {{
            if (riderMarkers[id]) {{
                riderMarkers[id].setLatLng([lat, lon]);
                var popupContent = '<div class=""rider-popup""><strong>' + name + '</strong><br>' + speed + ' km/h</div>';
                riderMarkers[id].setPopupContent(popupContent);
            }} else {{
                var iconHtml = '<div class=""rider-marker ' + (isSeparated ? 'rider-separated' : '') + '"">🏍️</div>';
                var customIcon = L.divIcon({{
                    html: iconHtml,
                    className: 'custom-rider-icon',
                    iconSize: [36, 36],
                    iconAnchor: [18, 18]
                }});

                var marker = L.marker([lat, lon], {{ icon: customIcon }}).addTo(map);
                marker.bindPopup('<div class=""rider-popup""><strong>' + name + '</strong><br>' + speed + ' km/h</div>');
                riderMarkers[id] = marker;
            }}
        }};

        // Add demo route line if coordinates supplied
        try {{
            var coords = [[19.9975,73.7898],[19.9328,73.5307],[19.5447,73.7663],[19.3400,73.7740],[18.5204,73.8567]];
            var polyline = L.polyline(coords, {{ color: '#00E5FF', weight: 5, opacity: 0.85 }}).addTo(map);
        }} catch(e) {{}}
    </script>
</body>
</html>";
    }
}
