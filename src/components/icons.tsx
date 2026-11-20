import Svg, { Path, Rect } from 'react-native-svg';

/** Icons from the design token sheet: 24 grid, 2 pt rounded stroke. Directional ones mirror via DirectionalIcon. */
export type IconName = 'home' | 'textSize' | 'moon' | 'chapters' | 'play' | 'pause' | 'close' | 'text' | 'wave' | 'check' | 'wrong' | 'bulb' | 'book';

interface IconProps {
  name: IconName;
  size?: number;
  color: string;
}

export function Icon({ name, size = 24, color }: IconProps) {
  const stroke = { stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' && <Path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" {...stroke} />}
      {name === 'textSize' && (
        <>
          <Path d="M3 18L8 6l5 12M5 14h6" {...stroke} />
          <Path d="M14 18l3.5-8 3.5 8M15.2 15.5h4.6" {...stroke} />
        </>
      )}
      {name === 'moon' && <Path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" {...stroke} />}
      {name === 'chapters' && (
        <>
          <Rect x={4} y={4} width={6.5} height={6.5} rx={1.5} {...stroke} />
          <Rect x={13.5} y={4} width={6.5} height={6.5} rx={1.5} {...stroke} />
          <Rect x={4} y={13.5} width={6.5} height={6.5} rx={1.5} {...stroke} />
          <Rect x={13.5} y={13.5} width={6.5} height={6.5} rx={1.5} {...stroke} />
        </>
      )}
      {name === 'play' && <Path d="M8 5.5v13l10.5-6.5z" fill={color} stroke={color} strokeWidth={1.5} strokeLinejoin="round" />}
      {name === 'pause' && (
        <>
          <Rect x={6.5} y={5} width={3.6} height={14} rx={1.2} fill={color} />
          <Rect x={13.9} y={5} width={3.6} height={14} rx={1.2} fill={color} />
        </>
      )}
      {name === 'close' && <Path d="M6 6l12 12M18 6L6 18" {...stroke} />}
      {name === 'text' && <Path d="M5 7h14M5 12h14M5 17h9" {...stroke} />}
      {name === 'wave' && <Path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4" {...stroke} />}
      {name === 'check' && <Path d="M5 12.5l4.5 4.5L19 7.5" {...stroke} />}
      {name === 'wrong' && <Path d="M7 7l10 10M17 7L7 17" {...stroke} />}
      {name === 'bulb' && (
        <>
          <Path d="M9 17h6M10 20h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" {...stroke} />
        </>
      )}
      {name === 'book' && <Path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10" {...stroke} />}
    </Svg>
  );
}
