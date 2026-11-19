import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { continentArt } from '../map/continentArt';
import { continents, placements, worldHeight, worldWidth } from '../map/geography';

/**
 * Soft, washed-out world map behind the splash (design: Onboarding · Splash).
 * Reuses the painted continents; the map never mirrors in Arabic.
 */
export function MapBackdrop() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const scale = Math.max(size.width / worldWidth, size.height / worldHeight);
  const width = worldWidth * scale;
  const height = worldHeight * scale;

  return (
    <View style={styles.root} pointerEvents="none" onLayout={(e) => setSize(e.nativeEvent.layout)}>
      {scale > 0 && (
        <View style={[styles.canvas, { width, height, start: (size.width - width) / 2, top: (size.height - height) / 2 }]}>
          {continents.map((key) => {
            const box = placements[key];
            return (
              <Image
                key={key}
                source={continentArt[key]}
                contentFit="fill"
                accessibilityIgnoresInvertColors
                style={[styles.tile, { start: box.x * scale, top: box.y * scale, width: box.width * scale, height: box.height * scale }]}
              />
            );
          })}
        </View>
      )}
      {/* Light wash so the logo reads clearly over the art. */}
      <View style={styles.wash} />
      <Svg style={styles.compass} width={52} height={52} viewBox="0 0 52 52">
        <Circle cx={26} cy={26} r={23} fill="#FFFFFF" stroke="#B9CBE6" strokeWidth={2} />
        <Path d="M26 8 L31 26 L26 44 L21 26 Z" fill="#FF7A3D" opacity={0.85} />
        <Path d="M8 26 L26 21 L44 26 L26 31 Z" fill="#9FB4D6" opacity={0.85} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, bottom: 0, start: 0, end: 0, backgroundColor: '#CFE7F8', overflow: 'hidden', direction: 'ltr' },
  canvas: { position: 'absolute' },
  tile: { position: 'absolute', opacity: 0.55 },
  wash: { position: 'absolute', top: 0, bottom: 0, start: 0, end: 0, backgroundColor: 'rgba(225, 240, 255, 0.45)' },
  compass: { position: 'absolute', start: 28, bottom: 24 },
});
