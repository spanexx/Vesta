export interface UserProfile {
    _id: string;
    // User Fields
    username: string;
    email: string;
    password?: string;
    birthdate: Date;
    verified: boolean;
    status: 'active' | 'suspended' | 'pending';
    role: ('girlfriend' | 'wife' | 'mistress' | 'pornstar' | 'onenight')[];
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
    services: {
      included: string[];
      extra: {
        [key: string]: number;
      };
    };
    rates: {
      incall: { [duration: string]: number };
      outcall: { [duration: string]: number };
      currency?: string;
    };
    level: 'vip' | 'premium' | 'standard';
    physicalAttributes?: {
      /** female, male, or other */
      gender?: string;
      /** height in centimeters (cm) */
      height?: number;
      /** weight in kilograms (kg) */
      weight?: number;
      /** e.g., Asian, Black, Caucasian, Hispanic, Indian, Middle Eastern, Mixed, Other */
      ethnicity?: string;
      /** e.g., 32A, 34B, 36C, etc. */
      bustSize?: string;
      /** Natural, Enhanced, etc. */
      bustType?: string;
      /** Shaved, Trimmed, Natural, etc. */
      pubicHair?: string;
      /** true/false */
      tattoos?: boolean;
      /** true/false */
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
      whatsapp?: string;  // Add this line
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