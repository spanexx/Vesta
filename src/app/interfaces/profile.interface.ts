export interface UserProfile {
  _id: string;
  email: string;
  birthdate: Date;
  verified: boolean;
  status: string;
  role: string;
  fullName: string;
  username: string;
  bio: string;
  services: string[];
  rates: {
    incall: number;
    outcall: number;
  };
  physicalAttributes: {
    gender: string;
    height: number;
    weight: number;
    ethnicity: string;
    bustSize?: string;
    bustType?: string;
    pubicHair?: string;
    tattoos: boolean;
    piercings: boolean;
  };
  availableToMeet: {
    meetingWith: string[];
    available24_7: boolean;
    advanceBooking: boolean;
  };
  contact: {
    phone: string;
    country: string;
    city: string;
    location?: {
      type: string;
      coordinates: number[];
    };
  };
  workingTime: string[];
  termsAccepted: boolean;
  verificationStatus: string;
  moderationFlags: {
    contentWarnings: string[];
    lastReviewed: Date;
    reviewerNotes: string;
  };
  verificationDocuments: string[];
  profileLevel: string;
  images: string[];
  videos: string[];
  user: string;
  level: string;
  distance?: number;
  profilePicture?: string;
}
