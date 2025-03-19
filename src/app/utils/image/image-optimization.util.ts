export const DEFAULT_AVATAR_DIMENSIONS = {
  header: {
    width: 40,
    height: 40
  },
  profile: {
    width: 200,
    height: 200
  },
  thumbnail: {
    width: 80,
    height: 80
  },
  home: {
    width: 200,
    height: 200
  }
};

export const getOptimizedImageSize = (actualWidth: number, actualHeight: number, targetWidth: number): {width: number, height: number} => {
  const aspectRatio = actualWidth / actualHeight;
  return {
    width: targetWidth,
    height: Math.round(targetWidth / aspectRatio)
  };
};
