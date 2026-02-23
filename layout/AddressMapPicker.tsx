import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Loader2 } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface AddressMapPickerProps {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  placeholder?: string;
}

interface Location {
  lat: number;
  lng: number;
}

// Component to handle map clicks
function LocationMarker({ 
  position, 
  setPosition, 
  onLocationSelect 
}: { 
  position: Location | null; 
  setPosition: (pos: Location) => void;
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPosition(newPos);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position ? <Marker position={[position.lat, position.lng]} /> : null;
}

// Component to recenter map
function RecenterMap({ center }: { center: Location }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], 17);
  }, [center, map]);
  return null;
}

export default function AddressMapPicker({ value, onChange, placeholder }: AddressMapPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [position, setPosition] = useState<Location | null>(null);
  const [mapCenter, setMapCenter] = useState<Location>({ lat: -6.2088, lng: 106.8456 }); // Jakarta default
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search for address using Nominatim (OpenStreetMap)
  const searchAddress = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setShowResults(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=id&limit=5`,
        {
          headers: {
            "Accept-Language": "id",
          },
        }
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            "Accept-Language": "id",
          },
        }
      );
      const data = await response.json();
      if (data.display_name) {
        onChange(data.display_name, lat, lng);
      }
    } catch (error) {
      console.error("Reverse geocode error:", error);
    }
  };

  // Handle location select from map click
  const handleLocationSelect = (lat: number, lng: number) => {
    reverseGeocode(lat, lng);
  };

  // Handle search result selection
  const handleResultSelect = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const newPos = { lat, lng };
    
    setPosition(newPos);
    setMapCenter(newPos);
    onChange(result.display_name, lat, lng);
    setShowResults(false);
    setSearchQuery(result.display_name);
  };

  // Handle Enter key in search
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchAddress();
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPosition(newPos);
          setMapCenter(newPos);
          reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  };

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative" ref={searchRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || "Cari alamat atau nama lokasi..."}
              className="pr-10"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <Button type="button" variant="outline" size="icon" onClick={searchAddress}>
            <Search className="w-4 h-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={getCurrentLocation} title="Gunakan lokasi saya">
            <MapPin className="w-4 h-4" />
          </Button>
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors border-b last:border-b-0"
                onClick={() => handleResultSelect(result)}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <span className="line-clamp-2">{result.display_name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="h-[300px] rounded-lg overflow-hidden border">
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker 
            position={position} 
            setPosition={setPosition}
            onLocationSelect={handleLocationSelect}
          />
          {position && <RecenterMap center={position} />}
        </MapContainer>
      </div>

      {/* Selected Address */}
      {value && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Alamat terpilih:</p>
          <p className="text-sm font-medium">{value}</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Klik pada peta untuk memilih lokasi atau gunakan pencarian untuk menemukan alamat
      </p>
    </div>
  );
}
