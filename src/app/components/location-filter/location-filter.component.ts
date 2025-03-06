import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterPipe } from '../../pipes/filter.pipe';
import { LocationFilter } from '../../services/profile.service';

@Component({
  selector: 'app-location-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterPipe],
  templateUrl: './location-filter.component.html',
  styleUrls: ['./location-filter.component.css']
})
export class LocationFilterComponent {
  @Input() isLoading = false;
  @Input() locationError: string | null = null;
  @Input() currentFilter: LocationFilter = {};
  @Output() locationRequest = new EventEmitter<void>();
  @Output() filterChange = new EventEmitter<LocationFilter>();
  @Output() clearFiltersRequest = new EventEmitter<void>();

  countrySearch: string = '';
  citySearch: string = '';

  countries = [
    'Poland', 'Germany', 'France', 'Spain', 'Italy', 'United Kingdom', 
    'Netherlands', 'Belgium', 'Sweden', 'Norway', 'Denmark', 'Finland',
    'Switzerland', 'Austria', 'Portugal', 'Greece', 'Ireland', 'Romania',
    'Bulgaria', 'Hungary', 'Czech Republic', 'Slovakia', 'Croatia'
  ];

  cities: { [country: string]: string[] } = {
    'Poland': ['Warsaw', 'Krakow', 'Gdansk', 'Poznan', 'Wroclaw', 'Lodz', 'Szczecin', 'Bydgoszcz'],
    'Germany': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart', 'Dusseldorf', 'Dresden'],
    'France': ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Bordeaux', 'Strasbourg'],
    'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao', 'Malaga', 'Alicante', 'Zaragoza'],
    'Italy': ['Rome', 'Milan', 'Naples', 'Turin', 'Florence', 'Venice', 'Bologna', 'Genoa'],
    'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Glasgow', 'Liverpool', 'Edinburgh', 'Bristol', 'Leeds'],
  };

  onCountrySearchChange(searchText: string): void {
    if (!this.countries.includes(searchText) && searchText.trim()) {
      this.filterChange.emit({ 
        country: searchText,
        city: undefined
      });
    }
  }

  onCitySearchChange(searchText: string): void {
    if (!this.getCitiesForCountry(this.currentFilter.country).includes(searchText) && searchText.trim()) {
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
    return country ? this.cities[country] || [] : [];
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
