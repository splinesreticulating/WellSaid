import { describe, it, expect, vi } from 'vitest';
import type { ToneType } from '$lib/types';

// Create a mock model that simulates the ToneSelector component
class ToneSelectorModel {
  selectedTone: ToneType;
  tones: ToneType[];
  onToneChange: (newTone: ToneType) => void;
  
  constructor(initialSelectedTone: ToneType = 'gentle', initialTones: ToneType[] = ['gentle', 'honest', 'funny', 'reassuring', 'concise']) {
    this.selectedTone = initialSelectedTone;
    this.tones = initialTones;
    
    this.onToneChange = (newTone: ToneType): void => {
      this.selectedTone = newTone;
    };
  }
  
  setSelectedTone(tone: ToneType): void {
    if (this.tones.includes(tone)) {
      this.selectedTone = tone;
    } else {
      throw new Error(`Invalid tone: ${tone}`);
    }
  }
  
  isActive(tone: ToneType): boolean {
    return this.selectedTone === tone;
  }
}

describe('ToneSelector Component', () => {
  it('should initialize with default values', () => {
    const component = new ToneSelectorModel();
    expect(component.selectedTone).toBe('gentle');
    expect(component.tones).toEqual(['gentle', 'honest', 'funny', 'reassuring', 'concise']);
  });
  
  it('should initialize with provided values', () => {
    const component = new ToneSelectorModel('funny', ['funny', 'concise']);
    expect(component.selectedTone).toBe('funny');
    expect(component.tones).toEqual(['funny', 'concise']);
  });
  
  it('should change selected tone', () => {
    const component = new ToneSelectorModel();
    component.onToneChange('funny');
    expect(component.selectedTone).toBe('funny');
  });
  
  it('should correctly identify active tone', () => {
    const component = new ToneSelectorModel('honest');
    expect(component.isActive('honest')).toBe(true);
    expect(component.isActive('gentle')).toBe(false);
    expect(component.isActive('funny')).toBe(false);
  });
  
  it('should validate tone when setting it directly', () => {
    const component = new ToneSelectorModel();
    
    // Valid tone should work
    component.setSelectedTone('concise');
    expect(component.selectedTone).toBe('concise');
    
    // Invalid tone should throw an error
    try {
      // TypeScript would normally catch this, but we're testing runtime behavior
      component.setSelectedTone('invalid' as ToneType);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toBe('Invalid tone: invalid');
      } else {
        expect.fail('Expected an Error instance');
      }
    }
  });
});
