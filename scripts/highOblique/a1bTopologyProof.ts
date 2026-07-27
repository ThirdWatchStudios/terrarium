import {
  A1B_TOPOLOGY_ATLAS_COLUMNS,
  A1B_TOPOLOGY_ATLAS_PADDING,
  A1B_TOPOLOGY_CANVAS,
  A1B_TOPOLOGY_CELL_STRIDE,
  A1B_TOPOLOGY_COMPONENT_COUNT,
  a1bTopologyShapeMarkup,
  type A1bTopologyBank,
  type A1bTopologyBounds,
  type A1bTopologyComponentFrame,
  type A1bTopologyRoleId,
  type A1bTopologySourceId,
  type A1bTopologyStateId,
} from './a1bTopology';

/**
 * Transparent component-atlas evidence for the complete A1b topology proof.
 *
 * The composed 99-frame atlas lives beside the compiler because it carries the
 * profile/state truth table. This companion atlas exposes all 101 intermediate
 * components so reviewers can verify source reuse and paint order. Neither
 * atlas is registered with the production exporter.
 */

export const A1B_TOPOLOGY_COMPONENT_ATLAS_COLUMNS = A1B_TOPOLOGY_ATLAS_COLUMNS;
export const A1B_TOPOLOGY_COMPONENT_ATLAS_ROWS = 10;

export interface A1bTopologyComponentAtlasRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface A1bTopologyComponentAtlasDescriptor {
  readonly version: 0;
  readonly status: 'proof-only';
  readonly contract: false;
  readonly name: 'QuotaCo high-oblique A1b topology component proof';
  readonly scale: number;
  readonly canvas: 128;
  readonly frameSize: number;
  readonly padding: number;
  readonly columns: 11;
  readonly rows: 10;
  readonly width: number;
  readonly height: number;
  readonly pivot: { readonly x: 0.5; readonly y: 0.5 };
  readonly frames: Record<string, A1bTopologyComponentAtlasRect & {
    readonly kind: 'topology' | 'state';
    readonly bank: A1bTopologyBank | 'state';
    readonly blobIndex?: number;
    readonly canonicalMask?: number;
    readonly roleIds: readonly A1bTopologyRoleId[];
    readonly stateId?: A1bTopologyStateId;
    readonly sourceIds: readonly A1bTopologySourceId[];
    readonly sourceFiles: readonly string[];
    readonly bounds: A1bTopologyBounds;
  }>;
  readonly meta: {
    readonly generator: 'terrarium-a1b-topology-proof';
    readonly componentCount: 101;
    readonly baseCount: 47;
    readonly upperCount: 47;
    readonly stateCount: 7;
    readonly completeBlobFamily: true;
    readonly transparentPadding: true;
    readonly temporaryFrameIds: true;
    readonly productionRegistration: false;
    readonly schemaChange: false;
    readonly directionalCastShadow: false;
    readonly note: string;
  };
}

function validateComponents(
  components: readonly A1bTopologyComponentFrame[],
): void {
  if (components.length !== A1B_TOPOLOGY_COMPONENT_COUNT) {
    throw new Error(
      `A1b component atlas requires ${A1B_TOPOLOGY_COMPONENT_COUNT} frames; received ${components.length}`,
    );
  }
  const ids = components.map((component) => component.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error('A1b component atlas frame IDs must be unique');
  }
}

export function a1bTopologyComponentFrameMarkup(
  component: Pick<A1bTopologyComponentFrame, 'shapes'>,
): string {
  return component.shapes.map(a1bTopologyShapeMarkup).join('');
}

export function a1bTopologyComponentFrameSvg(
  component: Pick<A1bTopologyComponentFrame, 'shapes'>,
  pixelSize = A1B_TOPOLOGY_CANVAS,
): string {
  if (!Number.isFinite(pixelSize) || pixelSize <= 0) {
    throw new Error(`Invalid A1b component frame size ${pixelSize}`);
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelSize}" height="${pixelSize}" ` +
    `viewBox="0 0 ${A1B_TOPOLOGY_CANVAS} ${A1B_TOPOLOGY_CANVAS}">` +
    a1bTopologyComponentFrameMarkup(component) +
    '</svg>'
  );
}

export function a1bTopologyComponentAtlasDescriptor(
  components: readonly A1bTopologyComponentFrame[],
  scale: number,
): A1bTopologyComponentAtlasDescriptor {
  validateComponents(components);
  if (!Number.isInteger(scale) || scale < 1) {
    throw new Error(`Invalid A1b component atlas scale ${scale}`);
  }
  const stride = A1B_TOPOLOGY_CELL_STRIDE * scale;
  const frameSize = A1B_TOPOLOGY_CANVAS * scale;
  const padding = A1B_TOPOLOGY_ATLAS_PADDING * scale;
  const entries = components.map((component, index) => [component.id, {
    x: (index % A1B_TOPOLOGY_COMPONENT_ATLAS_COLUMNS) * stride + padding,
    y: Math.floor(index / A1B_TOPOLOGY_COMPONENT_ATLAS_COLUMNS) * stride + padding,
    w: frameSize,
    h: frameSize,
    kind: component.kind,
    bank: component.bank,
    ...(component.blobIndex === undefined ? {} : { blobIndex: component.blobIndex }),
    ...(component.canonicalMask === undefined ? {} : { canonicalMask: component.canonicalMask }),
    roleIds: component.roleIds,
    ...(component.stateId === undefined ? {} : { stateId: component.stateId }),
    sourceIds: component.sourceIds,
    sourceFiles: component.sourceFiles,
    bounds: component.bounds,
  }] as const);

  return {
    version: 0,
    status: 'proof-only',
    contract: false,
    name: 'QuotaCo high-oblique A1b topology component proof',
    scale,
    canvas: 128,
    frameSize,
    padding,
    columns: 11,
    rows: 10,
    width: A1B_TOPOLOGY_COMPONENT_ATLAS_COLUMNS * stride,
    height: A1B_TOPOLOGY_COMPONENT_ATLAS_ROWS * stride,
    pivot: { x: 0.5, y: 0.5 },
    frames: Object.fromEntries(entries),
    meta: {
      generator: 'terrarium-a1b-topology-proof',
      componentCount: 101,
      baseCount: 47,
      upperCount: 47,
      stateCount: 7,
      completeBlobFamily: true,
      transparentPadding: true,
      temporaryFrameIds: true,
      productionRegistration: false,
      schemaChange: false,
      directionalCastShadow: false,
      note: 'Intermediate authored-piece evidence only. Components are not production frames or an export contract.',
    },
  };
}

export function a1bTopologyComponentAtlasSvg(
  components: readonly A1bTopologyComponentFrame[],
  scale: number,
): string {
  const atlas = a1bTopologyComponentAtlasDescriptor(components, scale);
  const cells = components.map((component) => {
    const rect = atlas.frames[component.id];
    if (!rect) throw new Error(`Missing A1b component atlas rect ${component.id}`);
    return (
      `<svg x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" ` +
      `viewBox="0 0 ${A1B_TOPOLOGY_CANVAS} ${A1B_TOPOLOGY_CANVAS}">` +
      a1bTopologyComponentFrameMarkup(component) +
      '</svg>'
    );
  }).join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${atlas.width}" height="${atlas.height}" ` +
    `viewBox="0 0 ${atlas.width} ${atlas.height}">${cells}</svg>`
  );
}
