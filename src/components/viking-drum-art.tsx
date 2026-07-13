import Svg, {
  Circle,
  Defs,
  G,
  Line,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

type Props = {
  size: number;
  /** kolor runy w centrum — zmienia się ze stanem (frost / aurora / gold) */
  runeColor: string;
};

/**
 * Cartoonowy bęben wikiński (oryginalny asset SVG): drewniana obręcz z nitami,
 * sznurowanie naciągu w zygzak, naciąg ze skóry i runa Tiwaz w centrum.
 * Ciepła paleta, grube kontury = vibe rysunkowy. Skaluje się bez utraty ostrości.
 */
export function VikingDrumArt({ size, runeColor }: Props) {
  const c = 50; // centrum w układzie viewBox 100x100
  const outline = '#2E1C10';
  const woodDark = '#7A4A24';
  const woodLight = '#A9702F';
  const rope = '#E7C98F';

  // 12 punktów sznurowania na obwodzie obręczy
  const lacing = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    return { x: c + Math.cos(a) * 44, y: c + Math.sin(a) * 44 };
  });

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="head" cx="42%" cy="38%" r="65%">
          <Stop offset="0%" stopColor="#F3E4C4" />
          <Stop offset="70%" stopColor="#E7D0A2" />
          <Stop offset="100%" stopColor="#D3B579" />
        </RadialGradient>
        <RadialGradient id="wood" cx="50%" cy="50%" r="52%">
          <Stop offset="80%" stopColor={woodLight} />
          <Stop offset="100%" stopColor={woodDark} />
        </RadialGradient>
      </Defs>

      {/* zewnętrzna drewniana obręcz */}
      <Circle cx={c} cy={c} r={47} fill="url(#wood)" stroke={outline} strokeWidth={3} />

      {/* sznurowanie naciągu — zygzak między obręczą a naciągiem */}
      <G stroke={rope} strokeWidth={2.2} strokeLinecap="round">
        {lacing.map((p, i) => {
          const inner = { x: c + (p.x - c) * 0.82, y: c + (p.y - c) * 0.82 };
          return <Line key={i} x1={p.x} y1={p.y} x2={inner.x} y2={inner.y} />;
        })}
        {lacing.map((p, i) => {
          const next = lacing[(i + 1) % lacing.length];
          const innerNext = { x: c + (next.x - c) * 0.82, y: c + (next.y - c) * 0.82 };
          return <Line key={`z${i}`} x1={p.x} y1={p.y} x2={innerNext.x} y2={innerNext.y} />;
        })}
      </G>

      {/* nity na obręczy */}
      {lacing.map((p, i) => (
        <Circle key={`r${i}`} cx={p.x} cy={p.y} r={2.4} fill="#F0D9A8" stroke={outline} strokeWidth={0.8} />
      ))}

      {/* naciąg (skóra) */}
      <Circle cx={c} cy={c} r={37} fill="url(#head)" stroke={outline} strokeWidth={2.5} />

      {/* runa Tiwaz (↑) — symbol wojownika, w kolorze stanu */}
      <G stroke={runeColor} strokeWidth={4} strokeLinecap="round" fill="none">
        <Line x1={c} y1={c - 16} x2={c} y2={c + 16} />
        <Line x1={c} y1={c - 16} x2={c - 9} y2={c - 6} />
        <Line x1={c} y1={c - 16} x2={c + 9} y2={c - 6} />
      </G>

      {/* highlight — cartoonowy połysk u góry naciągu */}
      <Path
        d={`M ${c - 20} ${c - 20} Q ${c} ${c - 30} ${c + 18} ${c - 22}`}
        stroke="#FFFFFF"
        strokeOpacity={0.4}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}
