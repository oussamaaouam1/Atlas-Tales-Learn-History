import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { useLanguage } from '../providers/LanguageProvider';
import { tokens } from '../theme/tokens';

export type TextVariant = 'caption' | 'body' | 'bodyLarge' | 'title' | 'display';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  bold?: boolean;
  color?: keyof typeof tokens.color;
  /** 'auto' follows the layout direction (start-aligned). Never left/right. */
  align?: 'auto' | 'center';
}

/** All text in the app goes through AppText so the right font is used for each script. */
export function AppText({
  variant = 'body',
  bold = false,
  color = 'text',
  align = 'auto',
  style,
  ...rest
}: AppTextProps) {
  const { language } = useLanguage();
  const script = language === 'ar' ? 'arabic' : 'latin';
  // Each style has its design weight; the bold prop lifts it to at least 700.
  const weight = bold ? Math.max(700, tokens.variantWeight[variant]) : tokens.variantWeight[variant];
  const family = tokens.fontFace[script][weight as keyof (typeof tokens.fontFace)['latin']];

  const textStyle: TextStyle = {
    fontSize: (language === 'ar' ? tokens.arabicFontSize : tokens.fontSize)[variant],
    lineHeight: (language === 'ar' ? tokens.arabicLineHeight : tokens.lineHeight)[variant],
    color: tokens.color[color],
    textAlign: align,
    writingDirection: language === 'ar' ? 'rtl' : 'ltr',
    // Each weight is its own font file, so fontWeight is not set (Android ignores it for custom fonts).
    fontFamily: family,
  };

  return <Text {...rest} style={StyleSheet.compose(textStyle, style)} />;
}
