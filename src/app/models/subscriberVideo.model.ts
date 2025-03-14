export interface SubscriberVideo {
    videoId: string;
    userId: string;
    username: string;
    profilePicture: string | null;
    url: string;
    title: string;
    description: string;
    uploadedAt: Date;
    isLiked: boolean;
    likes: number;
  }

export interface VideoSubscriptionStatus {
    videoSubscription?: {
      isSubscribed: boolean;
      subscribedAt: Date;
      expiresAt: Date;
    };
  }
  
export interface VideoUploadPayload {
    videoUrl: string;
    title?: string;
    description?: string;
  }
  
export  interface VideoResponse {
    success: boolean;
    videos: SubscriberVideo[];
  }