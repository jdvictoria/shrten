declare module "react-simple-maps" {
  import { ComponentPropsWithoutRef, ReactNode } from "react";

  export interface ProjectionConfig {
    scale?: number;
    center?: [number, number];
    rotate?: [number, number, number];
  }

  export interface ComposableMapProps {
    projectionConfig?: ProjectionConfig;
    projection?: string;
    width?: number;
    height?: number;
    style?: React.CSSProperties;
    viewBox?: string;
    children?: ReactNode;
  }

  export function ComposableMap(props: ComposableMapProps): JSX.Element;

  export interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    translateExtent?: [[number, number], [number, number]];
    onMoveStart?: (args: { coordinates: [number, number]; zoom: number }) => void;
    onMove?: (args: { x: number; y: number; zoom: number; dragging: boolean }) => void;
    onMoveEnd?: (args: { coordinates: [number, number]; zoom: number }) => void;
    children?: ReactNode;
  }

  export function ZoomableGroup(props: ZoomableGroupProps): JSX.Element;

  export interface GeoContext {
    geographies: Geography[];
  }

  export interface GeographiesProps {
    geography: string | Record<string, unknown>;
    children: (ctx: GeoContext) => ReactNode;
    parseGeographies?: (geographies: unknown[]) => Geography[];
  }

  export function Geographies(props: GeographiesProps): JSX.Element;

  export interface Geography {
    rsmKey: string;
    id: string;
    properties: Record<string, unknown>;
    geometry: Record<string, unknown>;
    type: string;
  }

  export interface GeographyStyle {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    outline?: string;
    cursor?: string;
  }

  export interface GeographyProps {
    geography: Geography;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    title?: string;
    style?: {
      default?: GeographyStyle;
      hover?: GeographyStyle;
      pressed?: GeographyStyle;
    };
    onClick?: (event: React.MouseEvent, geography: Geography) => void;
    onMouseEnter?: (event: React.MouseEvent, geography: Geography) => void;
    onMouseLeave?: (event: React.MouseEvent, geography: Geography) => void;
  }

  export function Geography(props: GeographyProps): JSX.Element;

  export interface MarkerProps {
    coordinates: [number, number];
    children?: ReactNode;
    onClick?: (event: React.MouseEvent) => void;
  }

  export function Marker(props: MarkerProps): JSX.Element;

  export interface LineProps {
    from?: [number, number];
    to?: [number, number];
    coordinates?: [number, number][];
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    children?: ReactNode;
  }

  export function Line(props: LineProps): JSX.Element;
}
