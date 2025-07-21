import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { LucideAngularModule } from 'lucide-angular';
import { ThemeService } from '../../../../core/services/theme.service';
import { Subscription } from 'rxjs';

interface LocationData {
  lat: number;
  lng: number;
  address?: string;
  display_name?: string;
}

@Component({
  selector: 'app-location-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './location-picker.component.html',
  styleUrls: ['./location-picker.component.scss']
})
export class LocationPickerComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  
  @Input() initialLocation?: { lat: number; lng: number };
  @Input() placeholder: string = 'Search for a location...';
  @Input() height: string = '400px';
  @Input() visible: boolean = false;
  
  @Output() locationSelected = new EventEmitter<LocationData>();
  
  map: L.Map | null = null;
  marker: L.Marker | null = null;
  searchQuery: string = '';
  searchResults: any[] = [];
  isSearching: boolean = false;
  showResults: boolean = false;
  selectedLocation: LocationData | null = null;
  private searchTimeout: any;
  private pendingMarker: { lat: number; lng: number } | null = null;
  private themeSubscription: Subscription | null = null;
  private currentTileLayer: L.TileLayer | null = null;
  
  // Default to San Francisco if no initial location
  defaultLat = 37.7749;
  defaultLng = -122.4194;
  defaultZoom = 13;
  
  constructor(
    private cdr: ChangeDetectorRef,
    private themeService: ThemeService
  ) {}
  
  ngOnInit(): void {
    // Use local assets for Leaflet icons
    const iconRetinaUrl = 'marker-icon-2x.png';
    const iconUrl = 'marker-icon.png';
    const shadowUrl = 'marker-shadow.png';
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    
    // Subscribe to theme changes
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      if (this.map) {
        this.updateMapTheme(theme);
      }
    });
  }
  
  ngAfterViewInit(): void {
    // Only initialize if visible
    if (this.visible) {
      // Need longer delay for modal to fully render
      setTimeout(() => {
        this.initializeMap();
      }, 500);
    }
  }
  
  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    // When modal becomes visible, initialize or refresh map
    if (changes['visible'] && changes['visible'].currentValue === true) {
      setTimeout(() => {
        if (this.map) {
          // Map exists, just refresh size
          this.map.invalidateSize();
        } else {
          // First time opening, initialize map
          this.initializeMap();
        }
      }, 300);
    }
  }
  
  private initializeMap(): void {
    // Don't initialize if container not available or map already exists
    if (!this.mapContainer || !this.mapContainer.nativeElement || this.map) {
      return;
    }
    
    try {
      const lat = this.initialLocation?.lat || this.defaultLat;
      const lng = this.initialLocation?.lng || this.defaultLng;
      
      // Set container height if percentage is used
      const container = this.mapContainer.nativeElement;
      if (this.height.includes('%')) {
        container.style.height = '100%';
      } else {
        container.style.height = this.height;
      }
      
      // Initialize map
      this.map = L.map(container, {
        center: [lat, lng],
        zoom: this.defaultZoom,
        zoomControl: true,
        attributionControl: true
      });
      
      // Add theme-aware tile layer
      this.addTileLayer(this.themeService.getCurrentTheme());
      
      // Add event listeners
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.onMapClick(e.latlng.lat, e.latlng.lng);
      });
      
      // Force size recalculation after a delay
      setTimeout(() => {
        this.map?.invalidateSize();
      }, 200);
      
      // Add initial marker if location provided
      if (this.initialLocation) {
        this.addMarker(lat, lng);
        this.reverseGeocode(lat, lng);
      }
      
      // Check if there's a pending marker from a search result selected before map was ready
      if (this.pendingMarker) {
        this.addMarker(this.pendingMarker.lat, this.pendingMarker.lng);
        this.reverseGeocode(this.pendingMarker.lat, this.pendingMarker.lng);
        this.pendingMarker = null;
      }
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }
  
  private onMapClick(lat: number, lng: number): void {
    this.addMarker(lat, lng);
    this.reverseGeocode(lat, lng);
  }
  
  private addMarker(lat: number, lng: number): void {
    // Check if map is initialized
    if (!this.map) {
      console.warn('Map not initialized yet, storing marker coordinates for later');
      // Store the coordinates to add marker when map is ready
      this.pendingMarker = { lat, lng };
      return;
    }
    
    // Remove existing marker
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }
    
    // Add new marker with animation
    this.marker = L.marker([lat, lng], {
      draggable: true,
      autoPan: true
    }).addTo(this.map);
    
    // Add drag end handler
    this.marker.on('dragend', (e: any) => {
      const position = e.target.getLatLng();
      this.reverseGeocode(position.lat, position.lng);
    });
    
    // Animate to marker
    this.map.flyTo([lat, lng], 15, {
      duration: 1
    });
  }
  
  searchLocation(): void {
    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    if (!this.searchQuery || this.searchQuery.trim().length < 2) {
      this.searchResults = [];
      this.showResults = false;
      this.cdr.detectChanges();
      return;
    }
    
    this.isSearching = true;
    this.showResults = true;
    this.cdr.detectChanges();
    
    // Debounce search
    this.searchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.searchQuery)}&limit=5&addressdetails=1`
        );
        
        if (response.ok) {
          const results = await response.json();
          this.searchResults = results;
          this.showResults = results.length > 0;
          // Force change detection
          this.cdr.detectChanges();
        } else {
          this.searchResults = [];
          console.error('Search failed:', response.status);
        }
      } catch (error) {
        console.error('Search error:', error);
        this.searchResults = [];
      } finally {
        this.isSearching = false;
        // Force change detection after updating search state
        this.cdr.detectChanges();
      }
    }, 500); // 500ms debounce
  }
  
  selectSearchResult(result: any): void {
    try {
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      
      // Set the selected location first
      this.selectedLocation = {
        lat,
        lng,
        address: result.display_name,
        display_name: result.display_name
      };
      
      // Update search query
      this.searchQuery = result.display_name;
      this.showResults = false;
      this.searchResults = [];
      
      // Try to add marker (will be deferred if map not ready)
      this.addMarker(lat, lng);
      
      // Emit the location - do this last to ensure all UI updates are done
      this.locationSelected.emit(this.selectedLocation);
      
      // Force change detection to ensure UI updates
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error selecting search result:', error);
      // Don't let errors bubble up and close the modal
    }
  }
  
  private async reverseGeocode(lat: number, lng: number): Promise<void> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        this.selectedLocation = {
          lat,
          lng,
          address: data.display_name,
          display_name: data.display_name
        };
        
        this.locationSelected.emit(this.selectedLocation);
        this.searchQuery = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      } else {
        throw new Error(`Reverse geocoding failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      // Fallback to coordinates
      this.selectedLocation = { 
        lat, 
        lng,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        display_name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      };
      this.locationSelected.emit(this.selectedLocation);
      this.searchQuery = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }
  
  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.showResults = false;
  }
  
  onSearchBlur(): void {
    // Delay hiding results to allow click on result
    setTimeout(() => {
      this.showResults = false;
    }, 300);
  }
  
  onSearchFocus(): void {
    if (this.searchResults.length > 0) {
      this.showResults = true;
    }
  }
  
  getCurrentLocation(): void {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          this.addMarker(lat, lng);
          this.reverseGeocode(lat, lng);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your location. Please enable location services.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  }
  
  private addTileLayer(theme: string): void {
    // Remove existing tile layer
    if (this.currentTileLayer) {
      this.map?.removeLayer(this.currentTileLayer);
    }
    
    // Create new tile layer based on theme
    if (theme === 'night') {
      // Dark theme - CartoDB Dark Matter
      this.currentTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      });
    } else {
      // Light theme - CartoDB Positron
      this.currentTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      });
    }
    
    // Add to map
    this.currentTileLayer.addTo(this.map!);
  }
  
  private updateMapTheme(theme: string): void {
    if (this.map) {
      this.addTileLayer(theme);
    }
  }
} 