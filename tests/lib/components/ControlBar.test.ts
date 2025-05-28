import { describe, it, expect, vi } from 'vitest';

type LookBackOption = { value: string; label: string };

const DEFAULT_LOOK_BACK_OPTIONS: ReadonlyArray<LookBackOption> = [
  { value: '1', label: 'hour' },
  { value: '2', label: '2 hours' },
  { value: '3', label: '3 hours' },
  { value: '4', label: '4 hours' },
  { value: '5', label: '5 hours' },
  { value: '6', label: '6 hours' },
  { value: '12', label: '12 hours' },
  { value: '24', label: '24 hours' },
];

interface ControlBarModelProps {
  lookBackHours?: string;
  messageCount?: number;
  onGoClick?: () => void;
  canGenerate?: boolean;
  isLoading?: boolean;
  lookBackOptions?: LookBackOption[];
}

class ControlBarModel {
  lookBackHours: string;
  messageCount: number;
  canGenerate: boolean;
  isLoading: boolean;
  readonly lookBackOptions: ReadonlyArray<LookBackOption>;
  private goClickCallback: () => void;

  constructor(props?: ControlBarModelProps) {
    const defaultLookBackHours = '1';
    const defaultMessageCount = 0;
    const defaultCanGenerate = true;
    const defaultIsLoading = false;
    const defaultOnGoClick = () => {};
    const defaultOptions = props?.lookBackOptions ? [...props.lookBackOptions] : [...DEFAULT_LOOK_BACK_OPTIONS];

    this.lookBackHours = props?.lookBackHours ?? defaultLookBackHours;
    this.messageCount = props?.messageCount ?? defaultMessageCount;
    this.canGenerate = props?.canGenerate ?? defaultCanGenerate;
    this.isLoading = props?.isLoading ?? defaultIsLoading;
    this.goClickCallback = props?.onGoClick ?? defaultOnGoClick;
    this.lookBackOptions = defaultOptions;

    if (!this.lookBackOptions.find(opt => opt.value === this.lookBackHours)) {
      throw new Error(`Initial lookBackHours "${this.lookBackHours}" is not a valid option.`);
    }
  }

  selectLookBack(hours: string): void {
    if (!this.lookBackOptions.find(opt => opt.value === hours)) {
      throw new Error(`Invalid lookBackHours value: "${hours}". Not in available options.`);
    }
    this.lookBackHours = hours;
  }

  clickGo(): void {
    if (this.canGenerate && !this.isLoading) {
      this.goClickCallback();
    }
  }

  setCanGenerate(value: boolean): void {
    this.canGenerate = value;
  }

  setIsLoading(value: boolean): void {
    this.isLoading = value;
  }

  setMessageCount(count: number): void {
    if (count < 0) {
      throw new Error('Message count cannot be negative.');
    }
    this.messageCount = count;
  }
}

describe('ControlBarModel', () => {
  it('should initialize with default values', () => {
    const model = new ControlBarModel();
    expect(model.lookBackHours).toBe('1');
    expect(model.messageCount).toBe(0);
    expect(model.canGenerate).toBe(true);
    expect(model.isLoading).toBe(false);
    expect(model.lookBackOptions).toEqual(DEFAULT_LOOK_BACK_OPTIONS);
  });

  it('should initialize with provided props', () => {
    const mockGo = vi.fn();
    const customOptions = [{ value: 'custom', label: 'Custom Option' }];
    const props: ControlBarModelProps = {
      lookBackHours: 'custom',
      messageCount: 10,
      canGenerate: false,
      isLoading: true,
      onGoClick: mockGo,
      lookBackOptions: customOptions,
    };
    const model = new ControlBarModel(props);
    expect(model.lookBackHours).toBe('custom');
    expect(model.messageCount).toBe(10);
    expect(model.canGenerate).toBe(false);
    expect(model.isLoading).toBe(true);
    expect(model.lookBackOptions).toEqual(customOptions);
    model['goClickCallback']();
    expect(mockGo).toHaveBeenCalledTimes(1);
  });

  it('should throw if initial lookBackHours is not in options', () => {
    expect(() => new ControlBarModel({ lookBackHours: 'invalid' })).toThrow(
      'Initial lookBackHours "invalid" is not a valid option.'
    );
  });

  it('should update lookBackHours with selectLookBack', () => {
    const model = new ControlBarModel();
    model.selectLookBack('12');
    expect(model.lookBackHours).toBe('12');
  });

  it('should throw if selectLookBack is called with invalid value', () => {
    const model = new ControlBarModel();
    expect(() => model.selectLookBack('invalid')).toThrow(
      'Invalid lookBackHours value: "invalid". Not in available options.'
    );
  });

  it('should call onGoClick if canGenerate and not isLoading', () => {
    const mockGo = vi.fn();
    const model = new ControlBarModel({ onGoClick: mockGo, canGenerate: true, isLoading: false });
    model.clickGo();
    expect(mockGo).toHaveBeenCalledTimes(1);
  });

  it('should not call onGoClick if canGenerate is false', () => {
    const mockGo = vi.fn();
    const model = new ControlBarModel({ onGoClick: mockGo, canGenerate: false, isLoading: false });
    model.clickGo();
    expect(mockGo).not.toHaveBeenCalled();
  });

  it('should not call onGoClick if isLoading is true', () => {
    const mockGo = vi.fn();
    const model = new ControlBarModel({ onGoClick: mockGo, canGenerate: true, isLoading: true });
    model.clickGo();
    expect(mockGo).not.toHaveBeenCalled();
  });

  it('should update canGenerate with setCanGenerate', () => {
    const model = new ControlBarModel();
    model.setCanGenerate(false);
    expect(model.canGenerate).toBe(false);
    model.setCanGenerate(true);
    expect(model.canGenerate).toBe(true);
  });

  it('should update isLoading with setIsLoading', () => {
    const model = new ControlBarModel();
    model.setIsLoading(true);
    expect(model.isLoading).toBe(true);
    model.setIsLoading(false);
    expect(model.isLoading).toBe(false);
  });

  it('should update messageCount with setMessageCount', () => {
    const model = new ControlBarModel();
    model.setMessageCount(5);
    expect(model.messageCount).toBe(5);
  });

  it('should throw if setMessageCount is called with negative value', () => {
    const model = new ControlBarModel();
    expect(() => model.setMessageCount(-1)).toThrow('Message count cannot be negative.');
  });

  it('lookBackOptions should be a copy and not modifiable externally', () => {
    const originalOptions = [{ value: 'a', label: 'A' }];
    const model = new ControlBarModel({ lookBackOptions: originalOptions, lookBackHours: 'a' });
    originalOptions.push({ value: 'b', label: 'B' });
    expect(model.lookBackOptions.length).toBe(1);
    expect(model.lookBackOptions[0].value).toBe('a');
    expect(model.lookBackOptions.find(opt => opt.value === 'b')).toBeUndefined();
  });
});
