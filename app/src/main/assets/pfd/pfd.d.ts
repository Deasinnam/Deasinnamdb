export {};
declare global {
 type PfdSource = 'none' | 'demo' | 'gps' | 'external';
 interface PfdTelemetry {
  source: PfdSource;
  speedKmh: number | null;
  altitudeM: number | null;
  headingDeg: number | null;
  accuracyM: number | null;
  pitchDeg: number | null;
  rollDeg: number | null;
  satellitesUsed: number | null;
  satellitesVisible: number | null;
  maxSpeedKmh: number | null;
  avgSpeedKmh: number | null;
  distanceKm: number | null;
  durationSeconds: number | null;
  timestampMs: number;
  fixValid: boolean;
 }
 interface PfdSettings { skin: 'cockpit' | 'airforce'; theme: 'auto' | 'day' | 'night'; limitKmh: number; mirrorHud: boolean; sceneMotion:boolean; sceneQuality: 'high' | 'balanced'; }
 interface PfdNativeBridge { startGps(): void; stopGps(): void; }
 interface PfdState { telemetry: PfdTelemetry; settings: PfdSettings; hud: boolean; playing: boolean; valid: boolean; stale: boolean; }
 interface PfdPanelApi {
  updateTelemetry(patch: Partial<PfdTelemetry>, options?: {touchTimestamp?:boolean}): PfdState;
  setSettings(settings: Partial<PfdSettings>): void;
  getState(): PfdState;
  getVisualState(): {distanceMeters:number;speedKmh:number;moving:boolean;theme:'day'|'night';quality:'high'|'balanced';frameCount:number;pendingFrame:boolean};
  useDemo(): void;
  toggleDemo(): boolean;
  stopDemo(): void;
  startGps(): void;
  stopGps(clear?: boolean): void;
  reportGpsError(message: string): void;
  setHud(enabled: boolean): void;
  calibrate(): boolean;
  notify(message: string): void;
  resize(): void;
  destroy(): void;
 }
 interface Window {
  DaesinnamPFD: {
   version: string;
   mount(container: HTMLElement, options?: {demo?:boolean;nativeBridge?:PfdNativeBridge;onCommand?:(event:{type:string;[key:string]:unknown})=>void}): PfdPanelApi;
  };
  pfd?: PfdPanelApi;
  PfdNative?: PfdNativeBridge;
 }
}
