import { describe, it, expect } from 'vitest';

// Model class simulating AiModelSelector logic
class AiModelSelectorModel {
  value: string;
  readonly options: string[];

  constructor(initialValue: string = 'openai', options: string[] = ['openai', 'khoj']) {
    this.options = options;
    if (!this.options.includes(initialValue)) {
      throw new Error(`Initial value '${initialValue}' is not a valid option.`);
    }
    this.value = initialValue;
  }

  selectModel(model: string): void {
    if (!this.options.includes(model)) {
      throw new Error(`Model '${model}' is not a valid option.`);
    }
    this.value = model;
  }
}

describe('AiModelSelectorModel', () => {
  it('should initialize with default value', () => {
    const model = new AiModelSelectorModel();
    expect(model.value).toBe('openai');
    expect(model.options).toEqual(['openai', 'khoj']);
  });

  it('should initialize with a custom valid value', () => {
    const model = new AiModelSelectorModel('khoj');
    expect(model.value).toBe('khoj');
  });

  it('should throw if initialized with an invalid value', () => {
    expect(() => new AiModelSelectorModel('invalid')).toThrow("Initial value 'invalid' is not a valid option.");
  });

  it('should change value when selectModel is called with a valid option', () => {
    const model = new AiModelSelectorModel();
    model.selectModel('khoj');
    expect(model.value).toBe('khoj');
  });

  it('should throw if selectModel is called with an invalid option', () => {
    const model = new AiModelSelectorModel();
    expect(() => model.selectModel('other')).toThrow("Model 'other' is not a valid option.");
  });
});
