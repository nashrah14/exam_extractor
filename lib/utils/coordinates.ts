import { BoundingBox } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


/**
 * Scale a normalized coordinate (0-1000) to actual rendered size.
 */
export function scaleCoordinate(normalized: number, renderSize: number): number {
  return (normalized / 1000) * renderSize;
}

/**
 * Convert a 0-1000 normalized bounding box to screen-space coordinates.
 */
export function scaleBox(
  bbox: BoundingBox,
  renderedWidth: number,
  renderedHeight: number
) {
  return {
    x: scaleCoordinate(bbox.x, renderedWidth),
    y: scaleCoordinate(bbox.y, renderedHeight),
    width: scaleCoordinate(bbox.width, renderedWidth),
    height: scaleCoordinate(bbox.height, renderedHeight),
  };
}

/**
 * Normalize a screen-space coordinate back to 0-1000.
 */
export function normalizeCoordinate(pixels: number, renderSize: number): number {
  return Math.round((pixels / renderSize) * 1000);
}
