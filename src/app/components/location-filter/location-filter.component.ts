import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocationFilter, LocationStats, ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-location-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './location-filter.component.html',
  styleUrls: ['./location-filter.component.css']
})
export class LocationFilterComponent implements OnInit {
  @Input() isLoading = false;
  @Input() locationError: string | null = null;
  @Input() currentFilter: LocationFilter = {};
  @Output() locationRequest = new EventEmitter<void>();
  @Output() filterChange = new EventEmitter<LocationFilter>();
  @Output() clearFiltersRequest = new EventEmitter<void>();

  countrySearch: string = '';
  citySearch: string = '';
  
  // Dynamic data from API
  locationStats: LocationStats | null = null;
  allCountries: Array<{country: string, count: number}> = [];
  allCities: {[country: string]: Array<{city: string, count: number}>} = {};
  
  // Fallback static data
  fallbackCountries = [
    'Poland', 'Germany', 'France', 'Spain', 'Italy', 'United Kingdom', 
    'Netherlands', 'Belgium', 'Sweden', 'Norway', 'Denmark', 'Finland',
    'Switzerland', 'Austria', 'Portugal', 'Greece', 'Ireland', 'Romania',
    'Bulgaria', 'Hungary', 'Czech Republic', 'Slovakia', 'Croatia'
  ];

  fallbackCities: { [country: string]: string[] } = {
    'Poland': ['Warsaw', 'Krakow', 'Gdansk', 'Poznan', 'Wroclaw', 'Lodz', 'Szczecin', 'Bydgoszcz'],
    'Germany': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart', 'Dusseldorf', 'Dresden'],
    'France': ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Bordeaux', 'Strasbourg'],
    'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao', 'Malaga', 'Alicante', 'Zaragoza'],
    'Italy': ['Rome', 'Milan', 'Naples', 'Turin', 'Florence', 'Venice', 'Bologna', 'Genoa'],
    'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Glasgow', 'Liverpool', 'Edinburgh', 'Bristol', 'Leeds'],
  };

  constructor(private profileService: ProfileService) {}

  ngOnInit(): void {
    this.loadLocationStats();
  }

  loadLocationStats(): void {
    this.profileService.getLocationStats().subscribe({
      next: (stats) => {
        this.locationStats = stats;
        this.allCountries = stats.countries;
        this.allCities = stats.cities;
      },
      error: (error) => {
        console.error('Failed to load location stats:', error);
        // Fallback to static data
        this.allCountries = this.fallbackCountries.map(country => ({country, count: 0}));
        this.allCities = Object.keys(this.fallbackCities).reduce((acc, country) => {
          acc[country] = this.fallbackCities[country].map(city => ({city, count: 0}));
          return acc;
        }, {} as {[country: string]: Array<{city: string, count: number}>});
      }
    });
  }

  get countries(): Array<{country: string, count: number}> {
    return this.allCountries.length > 0 ? this.allCountries : 
           this.fallbackCountries.map(country => ({country, count: 0}));
  }
  onCountrySearchChange(searchText: string): void {
    const existingCountries = this.countries.map(c => c.country);
    if (!existingCountries.includes(searchText) && searchText.trim()) {
      this.filterChange.emit({ 
        country: searchText,
        city: undefined
      });
    }
  }

  onCitySearchChange(searchText: string): void {
    const cities = this.getCitiesForCountry(this.currentFilter.country);
    if (!cities.includes(searchText) && searchText.trim()) {
      this.filterChange.emit({ 
        ...this.currentFilter,
        city: searchText 
      });
    }
  }

  onCountrySelect(country: string): void {
    this.countrySearch = country;
    const filter: LocationFilter = { country };
    
    if (this.currentFilter.country !== country) {
      this.citySearch = '';
    } else {
      filter.city = this.currentFilter.city;
    }

    this.filterChange.emit(filter);
  }

  onCitySelect(city: string): void {
    this.citySearch = city;
    this.filterChange.emit({
      ...this.currentFilter,
      city
    });
  }

  getCitiesForCountry(country?: string): string[] {
    if (!country) return [];
    
    // First try to get from API data
    if (this.allCities[country]) {
      return this.allCities[country].map(c => c.city);
    }
    
    // Fallback to static data
    return this.fallbackCities[country] || [];
  }

  getCitiesWithCountsForCountry(country?: string): Array<{city: string, count: number}> {
    if (!country) return [];
    
    // Try to get from API data with counts
    if (this.allCities[country]) {
      return this.allCities[country];
    }
    
    // Fallback to static data without counts
    return (this.fallbackCities[country] || []).map(city => ({city, count: 0}));
  }

  get filteredCountries(): Array<{country: string, count: number}> {
    const countries = this.countries;
    if (!this.countrySearch.trim()) return countries;
    
    const searchText = this.countrySearch.toLowerCase();
    return countries.filter(countryData => 
      countryData.country.toLowerCase().includes(searchText)
    );
  }

  get filteredCities(): Array<{city: string, count: number}> {
    const cities = this.getCitiesWithCountsForCountry(this.currentFilter.country);
    if (!this.citySearch.trim()) return cities;
    
    const searchText = this.citySearch.toLowerCase();
    return cities.filter(cityData => 
      cityData.city.toLowerCase().includes(searchText)
    );
  }

  useLocation(): void {
    this.locationRequest.emit();
  }

  clearFilters(): void {
    this.countrySearch = '';
    this.citySearch = '';
    this.clearFiltersRequest.emit();
  }
}
