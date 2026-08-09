// User-supplied Philips gallery images are being attached to product IDs 8 and 9.
// Product 8 uses the shared three-image gallery.
// Product 9 uses the same three images plus the built-in doorbell / wireless chime image.
export const philipsPalmGalleryPlan = { sharedProductIds: [8, 9], chimeOnlyProductId: 9 } as const;
