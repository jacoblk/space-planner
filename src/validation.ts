/**
 * JSON validation utilities for space and objects
 */

import { AppState, ProjectsState } from './types';

export type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; error: string };

/**
 * Validate if a value is a finite number
 */
function isFiniteNumber(value: any): boolean {
  return typeof value === 'number' && isFinite(value);
}

/**
 * Validate a point object
 */
function isValidPoint(point: any): boolean {
  return (
    point !== null &&
    typeof point === 'object' &&
    isFiniteNumber(point.x) &&
    isFiniteNumber(point.y)
  );
}

/**
 * Validate a polygon object
 */
function isValidPolygon(polygon: any): boolean {
  if (!polygon || typeof polygon !== 'object') {
    return false;
  }

  if (!Array.isArray(polygon.points) || polygon.points.length < 3) {
    return false;
  }

  return polygon.points.every(isValidPoint);
}

/**
 * Validate a space object
 */
function isValidSpace(space: any): boolean {
  if (!space || typeof space !== 'object') {
    return false;
  }

  return isValidPolygon(space.outline);
}

/**
 * Validate a space object
 */
function isValidSpaceObject(obj: any): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    isValidPolygon(obj.shape) &&
    isValidPoint(obj.position) &&
    isFiniteNumber(obj.rotation) &&
    isFiniteNumber(obj.zIndex)
  );
}

/**
 * Parse and validate app state from JSON string
 */
export function parseAppState(jsonString: string): ValidationResult<AppState> {
  let parsed: any;

  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    return {
      valid: false,
      error: `Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`
    };
  }

  // Validate structure
  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, error: 'JSON must be an object' };
  }

  if (!parsed.space) {
    return { valid: false, error: 'Missing "space" property' };
  }

  if (!isValidSpace(parsed.space)) {
    return { valid: false, error: 'Invalid space definition. Must have outline with at least 3 points.' };
  }

  if (!parsed.objects) {
    return { valid: false, error: 'Missing "objects" property' };
  }

  if (!Array.isArray(parsed.objects)) {
    return { valid: false, error: '"objects" must be an array' };
  }

  // Validate each object
  for (let i = 0; i < parsed.objects.length; i++) {
    if (!isValidSpaceObject(parsed.objects[i])) {
      return {
        valid: false,
        error: `Invalid object at index ${i}. Must have id, name, shape, position, rotation, and zIndex.`
      };
    }
  }

  return {
    valid: true,
    data: {
      space: parsed.space,
      objects: parsed.objects,
      selectedObjectId: null
    }
  };
}

/**
 * Serialize app state to JSON string (pretty-printed)
 */
export function serializeAppState(state: AppState): string {
  const simplified = {
    space: state.space,
    objects: state.objects
  };

  return JSON.stringify(simplified, null, 2);
}

/**
 * Validate a variation object
 */
function isValidVariation(variation: any): boolean {
  if (!variation || typeof variation !== 'object') {
    return false;
  }

  return (
    typeof variation.id === 'string' &&
    typeof variation.name === 'string' &&
    typeof variation.createdAt === 'string' &&
    isValidSpace(variation.space) &&
    Array.isArray(variation.objects) &&
    variation.objects.every(isValidSpaceObject)
  );
}

/**
 * Validate a project object
 */
function isValidProject(project: any): boolean {
  if (!project || typeof project !== 'object') {
    return false;
  }

  return (
    typeof project.id === 'string' &&
    typeof project.name === 'string' &&
    typeof project.createdAt === 'string' &&
    typeof project.updatedAt === 'string' &&
    Array.isArray(project.variations) &&
    project.variations.length > 0 &&
    project.variations.every(isValidVariation)
  );
}

/**
 * Parse and validate projects state from JSON string
 */
export function parseProjectsState(jsonString: string): ValidationResult<ProjectsState> {
  let parsed: any;

  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    return {
      valid: false,
      error: `Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`
    };
  }

  // Validate structure
  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, error: 'JSON must be an object' };
  }

  if (!parsed.projects) {
    return { valid: false, error: 'Missing "projects" property' };
  }

  if (!Array.isArray(parsed.projects)) {
    return { valid: false, error: '"projects" must be an array' };
  }

  // Validate each project
  for (let i = 0; i < parsed.projects.length; i++) {
    if (!isValidProject(parsed.projects[i])) {
      return {
        valid: false,
        error: `Invalid project at index ${i}. Must have id, name, createdAt, updatedAt, and at least one variation.`
      };
    }
  }

  return {
    valid: true,
    data: {
      projects: parsed.projects,
      currentProjectId: parsed.currentProjectId || null,
      currentVariationId: parsed.currentVariationId || null,
      selectedObjectId: null
    }
  };
}

/**
 * Serialize projects state to JSON string (pretty-printed)
 */
export function serializeProjectsState(state: ProjectsState): string {
  const simplified = {
    projects: state.projects,
    currentProjectId: state.currentProjectId,
    currentVariationId: state.currentVariationId
  };

  return JSON.stringify(simplified, null, 2);
}
