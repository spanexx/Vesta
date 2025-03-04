import { User } from './user.model';

export interface Profile {
  user: User;
  fullName: string;
  username: string;
  bio: string;
  services: string[];
  rates: {
    incall: {
      '30 minutes': number;
      '1 hour': number;
    };
    outcall: {
      '30 minutes': number;
      '1 hour': number;
    };
  };
  physicalAttributes: {
    gender: string;
    birthdate: Date;
    height: number;
    weight: number;
    ethnicity: string;
    bustSize: string;
    bustType: string;
    pubicHair: string;
    tattoos: boolean;
    piercings: boolean;
  };
  availableToMeet: {  // Fixed typo from "availabileToMeet"
    meetingWith: string[];
    available24_7: boolean;
    advanceBooking: boolean;
  };
  contact: {
    phone: string;
    country: string;
    city: string;
    location: {
      type: 'Point';  // Fixed as enum value
      coordinates: [number, number];  // Tuple type for [longitude, latitude]
    };
  };
  level: 'standard' | 'premium' | 'vip';  
  distance: number; // Add this line
  workingTime: string;
  termsAccepted: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  moderationFlags: {
    contentWarnings: number;  
    lastReviewed: Date;
    reviewerNotes: string;
  };
  verificationDocuments: string[];
  images: string[];
  videos: string[];
}