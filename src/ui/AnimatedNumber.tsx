import React, { useEffect, useRef, useState } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { useSettings } from '../i18n';

interface Props {
  value: number;
  format: (value: number) => string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
}

/** Podíl zbývajícího rozdílu, o který se zobrazená hodnota přiblíží cíli každý snímek. */
const EASE = 0.22;

/**
 * Číslo, které se k nové hodnotě „dopočítá“ místo skoku. Malé změny (běžný
 * tick produkce) se zobrazují rovnou, větší skoky (nákup, odměna) se
 * plynule dojedou během několika desítek milisekund.
 */
export function AnimatedNumber({ value, format, style, numberOfLines, adjustsFontSizeToFit }: Props) {
  const { settings } = useSettings();
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);
  const targetRef = useRef(value);
  const frameRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    targetRef.current = value;
    const diff = value - displayRef.current;
    // Bez animací, nebo když je rozdíl nepatrný, skoč rovnou.
    if (!settings.animations || Math.abs(diff) < Math.max(1, Math.abs(value) * 0.002)) {
      displayRef.current = value;
      setDisplay(value);
      return;
    }
    if (frameRef.current) return; // animace už běží a cíl si přečte z ref
    const step = () => {
      const target = targetRef.current;
      const remaining = target - displayRef.current;
      if (Math.abs(remaining) < Math.max(1, Math.abs(target) * 0.001)) {
        displayRef.current = target;
        setDisplay(target);
        frameRef.current = null;
        return;
      }
      displayRef.current += remaining * EASE;
      setDisplay(displayRef.current);
      frameRef.current = setTimeout(step, 16);
    };
    frameRef.current = setTimeout(step, 16);
  }, [value, settings.animations]);

  useEffect(
    () => () => {
      if (frameRef.current) clearTimeout(frameRef.current);
    },
    [],
  );

  return (
    <Text style={style} numberOfLines={numberOfLines} adjustsFontSizeToFit={adjustsFontSizeToFit}>
      {format(display)}
    </Text>
  );
}
