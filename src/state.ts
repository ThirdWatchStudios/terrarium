import type { Mood, ProjectState } from './core/types';
import { DEFAULT_FLOORS, DEFAULT_WALLS, defaultProject } from './data/defaults';

const STORAGE_KEY = 'sprite-character-creator-v1';

/** What changed — 'structure' rebuilds controls, 'data' only refreshes previews. */
export type ChangeKind = 'structure' | 'data';
type Listener = (kind: ChangeKind) => void;

class Store {
  state: ProjectState;
  /** UI selection, not persisted as part of the project. */
  ui = {
    tab: 'characters' as 'characters' | 'props' | 'tiles' | 'style',
    selectedCharacterId: '',
    selectedPropId: '',
    selectedTileId: '',
    exportScale: 2,
    /** Preview-only mood; never stored in recipes. */
    previewMood: 'normal' as Mood,
  };
  private listeners: Listener[] = [];

  constructor() {
    this.state = this.load();
    this.ui.selectedCharacterId = this.state.characters[0]?.id ?? '';
    this.ui.selectedPropId = this.state.props[0]?.id ?? '';
    this.ui.selectedTileId = this.state.walls[0]?.id ?? this.state.floors[0]?.id ?? '';
  }

  private load(): ProjectState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ProjectState;
        if (parsed.version === 1) {
          // Projects saved before walls/floors existed get the default sets.
          parsed.walls ??= structuredClone(DEFAULT_WALLS);
          parsed.floors ??= structuredClone(DEFAULT_FLOORS);
          return parsed;
        }
      }
    } catch {
      // fall through to defaults
    }
    return defaultProject();
  }

  save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  subscribe(fn: Listener): void {
    this.listeners.push(fn);
  }

  mutate(fn: (state: ProjectState) => void, kind: ChangeKind = 'data'): void {
    fn(this.state);
    this.save();
    this.emit(kind);
  }

  /** UI-only change (tab/selection) — no persistence of project data needed. */
  mutateUi(fn: (ui: Store['ui']) => void): void {
    fn(this.ui);
    this.emit('structure');
  }

  replaceProject(next: ProjectState): void {
    next.walls ??= structuredClone(DEFAULT_WALLS);
    next.floors ??= structuredClone(DEFAULT_FLOORS);
    this.state = next;
    this.ui.selectedCharacterId = next.characters[0]?.id ?? '';
    this.ui.selectedPropId = next.props[0]?.id ?? '';
    this.ui.selectedTileId = next.walls[0]?.id ?? next.floors[0]?.id ?? '';
    this.save();
    this.emit('structure');
  }

  private emit(kind: ChangeKind): void {
    for (const fn of this.listeners) fn(kind);
  }

  get selectedCharacter() {
    return this.state.characters.find((c) => c.id === this.ui.selectedCharacterId);
  }

  get selectedProp() {
    return this.state.props.find((p) => p.id === this.ui.selectedPropId);
  }

  /** Selected wall or floor, plus which list it came from. */
  get selectedTile(): { tile: import('./core/types').TileInstance; kind: 'wall' | 'floor' } | undefined {
    const wall = this.state.walls.find((w) => w.id === this.ui.selectedTileId);
    if (wall) return { tile: wall, kind: 'wall' };
    const floor = this.state.floors.find((f) => f.id === this.ui.selectedTileId);
    if (floor) return { tile: floor, kind: 'floor' };
    return undefined;
  }
}

export const store = new Store();
