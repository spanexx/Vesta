export interface UserProfile {
    _id: string;
    // User Fields
    username: string;
    email: string;
    password?: string;
    birthdate: Date;
    verified: boolean;
    status: 'active' | 'suspended' | 'pending';
    role: 'girlfriend' | 'wife' | 'mistress' | 'pornstar' | 'onenight';
    accountLevel?: 'vip' | 'regular';
    lastLogin?: Date;
    verificationDocuments: string[];
    emergencyContact?: {
      name?: string;
      phoneNumber?: string;
      relationship?: string;
    };
  
    // Profile Fields
    fullName?: string;
    bio?: string;
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
    level: 'vip' | 'premium' | 'standard';
    physicalAttributes?: {
      gender?: string;
      height?: number; // in cm
      weight?: number; // in kg
      ethnicity?: string;
      bustSize?: string;
      bustType?: string;
      pubicHair?: string;
      tattoos?: boolean;
      piercings?: boolean;
    };
    availableToMeet?: {
      meetingWith: string[];
      available24_7: boolean;
      advanceBooking: boolean;
    };
    contact?: {
      phone?: string;
      country?: string;
      city?: string;
      location?: {
        type: 'Point';
        coordinates: [number, number];
      };
    };
    profileLevel: 'standard' | 'premium' | 'vip';
    workingTime?: string;
    termsAccepted: boolean;
    verificationStatus: 'pending' | 'verified' | 'rejected';
    moderationFlags?: {
      contentWarnings: number;
      lastReviewed?: Date;
      reviewerNotes?: string;
    };
    images: string[];
    videos: string[];
    profilePicture: string | null;
    userlikes: number;
    viewerlikes: number;
    // Timestamps
    createdAt?: Date;
    updatedAt?: Date;
    [key: string]: any; // Add index signature to allow dynamic property access
  }