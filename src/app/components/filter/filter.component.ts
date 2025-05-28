import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PhysicalAttributeFilter {
  attribute: string;
  value: string | number | boolean | { min: number | null; max: number | null };
}

interface FilterData {
  username?: string;
  physicalAttribute?: PhysicalAttributeFilter | null;
}

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.css']
})
export class FilterComponent {
  @Output() filterChange = new EventEmitter<FilterData>();

  // Username search
  username: string = '';

  // Physical attribute filters  
  selectedAttribute: string = '';
  selectedValue: string = '';
  showEnumDropdown: boolean = false;
  
  heightRange = {
    min: null as number | null,
    max: null as number | null
  };
  
  weightRange = {
    min: null as number | null,
    max: null as number | null
  };

  onUsernameChange() {
    this.emitFilterChange();
  }

  onAttributeChange() {
    this.selectedValue = '';
    this.heightRange = { min: null, max: null };
    this.weightRange = { min: null, max: null };
    
    this.showEnumDropdown = ['gender', 'ethnicity', 'bodyType', 'hairColor', 'eyeColor', 'bustType'].includes(this.selectedAttribute);
    
    this.emitFilterChange();
  }

  onValueChange() {
    this.emitFilterChange();
  }

  onRangeChange() {
    this.emitFilterChange();
  }

  emitFilterChange() {
    const filterData: FilterData = {};

    // Add username filter if present
    if (this.username.trim()) {
      filterData.username = this.username.trim();
    }

    // Add physical attribute filter if present
    if (this.selectedAttribute && this.selectedValue) {
      filterData.physicalAttribute = {
        attribute: this.selectedAttribute,
        value: this.selectedValue
      };
    } else if (this.selectedAttribute === 'height' && (this.heightRange.min || this.heightRange.max)) {
      filterData.physicalAttribute = {
        attribute: 'height',
        value: this.heightRange
      };
    } else if (this.selectedAttribute === 'weight' && (this.weightRange.min || this.weightRange.max)) {
      filterData.physicalAttribute = {
        attribute: 'weight',
        value: this.weightRange
      };
    }

    this.filterChange.emit(filterData);
  }

  clearAllFilters() {
    this.username = '';
    this.selectedAttribute = '';
    this.selectedValue = '';
    this.heightRange = { min: null, max: null };
    this.weightRange = { min: null, max: null };
    this.showEnumDropdown = false;
    this.filterChange.emit({});
  }

  clearUsernameFilter() {
    this.username = '';
    this.emitFilterChange();
  }

  clearPhysicalFilter() {
    this.selectedAttribute = '';
    this.selectedValue = '';
    this.heightRange = { min: null, max: null };
    this.weightRange = { min: null, max: null };
    this.showEnumDropdown = false;
    this.emitFilterChange();
  }
}
