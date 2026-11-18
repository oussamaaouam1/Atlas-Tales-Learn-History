import { I18nManager } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { tokens } from '../theme/tokens';

interface DirectionalIconProps {
  /** 'forward' points to the reading direction's end (→ in English, ← in Arabic). */
  direction: 'forward' | 'back';
  size?: number;
  color?: string;
}

/** Chevron that mirrors in right-to-left layouts (§8: flip directional icons). */
export function DirectionalIcon({ direction, size = 20, color = tokens.color.text }: DirectionalIconProps) {
  const pointsRight = (direction === 'forward') !== I18nManager.isRTL;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={pointsRight ? undefined : { transform: [{ scaleX: -1 }] }}
      testID={pointsRight ? 'chevron-right' : 'chevron-left'}
    >
      <Path d="M9 5l7 7-7 7" stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
