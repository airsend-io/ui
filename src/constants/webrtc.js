export const VIDEO_CONSTRAINS = {
  low: {
    width: { ideal: 320 },
    aspectRatio: 1.334
  },
  medium: {
    width: { ideal: 640 },
    aspectRatio: 1.334
  },
  high: {
    width: { ideal: 1280 },
    aspectRatio: 1.334
  },
  veryhigh: {
    width: { ideal: 1920 },
    aspectRatio: 1.334
  },
  ultra: {
    width: { ideal: 3840 },
    aspectRatio: 1.334
  }
};

export const PC_PROPRIETARY_CONSTRAINTS = {
  optional: [{ googDscp: true }]
};

export const VIDEO_SIMULCAST_ENCODINGS = [
  { scaleResolutionDownBy: 4 },
  { scaleResolutionDownBy: 2 },
  { scaleResolutionDownBy: 1 }
];

// Used for VP9 webcam video.
export const VIDEO_KSVC_ENCODINGS = [{ scalabilityMode: 'S3T3_KEY' }];

// Used for VP9 desktop sharing.
export const VIDEO_SVC_ENCODINGS = [{ scalabilityMode: 'S3T3', dtx: true }];
