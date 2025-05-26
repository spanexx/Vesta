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
    lastLogin?: Date;
    verificationDocuments: {
        data: string;
        side: 'front' | 'back';
        uploadedAt: Date;
    }[];
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
        currency: string;
    };
    physicalAttributes?: {
        gender: 'female' | 'male' | 'other';
        height: number;
        weight: number;
        ethnicity: 'Asian' | 'Black' | 'Caucasian' | 'Hispanic' | 'Indian' | 'Middle Eastern' | 'Mixed' | 'Other';
        bustSize?: string;
        bustType: 'Natural' | 'Enhanced';
        pubicHair: 'Shaved' | 'Trimmed' | 'Natural';
        tattoos: boolean;
        piercings: boolean;
        // Added physical attributes
        hairColor?: 'Blonde' | 'Brown' | 'Black' | 'Red' | 'Auburn' | 'Grey' | 'White' | 'Colorful' | 'Other';
        eyeColor?: 'Blue' | 'Green' | 'Brown' | 'Hazel' | 'Grey' | 'Amber' | 'Other';
        bodyType?: 'Slim' | 'Athletic' | 'Average' | 'Curvy' | 'Full-figured' | 'Muscular' | 'Petite';
        skinTone?: 'Fair' | 'Light' | 'Medium' | 'Olive' | 'Tan' | 'Brown' | 'Dark';
        waistSize?: number;
        hipSize?: number;
        smoker?: 'Non-smoker' | 'Occasional' | 'Regular';
        drinker?: 'Non-drinker' | 'Social' | 'Regular';
        languages?: string[];
        nationality?: string;
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
        whatsapp?: string;
    };
    profileLevel: 'free' | 'standard' | 'premium' | 'vip';
    subscription?: {
        stripeSubscriptionId?: string;
        startDate?: Date;
        currentPeriodEnd?: Date;
        status: 'active' | 'canceled' | 'expired';
    };
    videoSubscription?: {
        isSubscribed: boolean;
        subscribedAt?: Date;
        expiresAt?: Date;
    };
    subscriberVideo: {
        url?: string;
        uploadedAt?: Date;
        title?: string;
        description?: string;
        likes: number;
        likedBy: string[];
    };
    workingTime?: string;
    termsAccepted: boolean;
    verificationStatus: 'pending' | 'reviewing' | 'verified' | 'rejected';
    moderationFlags: ModerationFlags;
    images: string[];
    videos: string[];
    profilePicture: string | null;
    stripeCustomerId?: string;
    likedProfiles: {
        userLikes: string[];
        viewerLikes: string[];
    };
    userlikes: number;
    viewerlikes: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ModerationFlags {
  contentWarnings: number;
  lastReviewed: Date;
  reviewerNotes: string;
  flaggedMedia?: FlaggedMedia[];
}

export interface FlaggedMedia {
  mediaId: string;
  mediaType: 'image' | 'video';
  reason?: string;
  flaggedAt?: Date;
}