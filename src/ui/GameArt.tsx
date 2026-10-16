import { useId } from 'react';
import type { IslandId } from '../core/progress';

function CompanionArt({ value, className }: { value: string; className: string }) {
  const characters: Record<string, { color: string; light: string; kind: string }> = {
    '🦜': { color: '#269f8c', light: '#9de2b2', kind: 'parrot' },
    '🐙': { color: '#db7c89', light: '#ffd4ce', kind: 'octopus' },
    '🐢': { color: '#82ad62', light: '#d5e5a3', kind: 'turtle' },
    '🦈': { color: '#749eb8', light: '#e1edf1', kind: 'shark' },
    '🐬': { color: '#64b8ca', light: '#d4f4e9', kind: 'dolphin' },
    '🦀': { color: '#e78061', light: '#ffd5a8', kind: 'crab' },
    '🐳': { color: '#7296c8', light: '#d9e4f6', kind: 'whale' },
  };
  const { color, light, kind } = characters[value] ?? characters['🦜'];
  return <svg className={`character-art ${className}`} viewBox="0 0 160 176" role="img" aria-label={value}>
    <circle cx="80" cy="84" r="70" fill={light} />
    <circle cx="118" cy="39" r="6" fill="white" opacity=".65" />
    <path d="M30 53L33 46L36 53L43 56L36 59L33 66L30 59L23 56Z" fill="white" opacity=".75" />
    <ellipse cx="80" cy="148" rx="48" ry="8" fill={color} opacity=".22" />
    {kind === 'octopus' && <g fill={color}><path d="M48 108Q18 111 23 133Q26 146 38 136L46 126Q36 152 53 153Q66 152 66 132Q67 162 81 156Q91 152 88 132Q96 161 110 151Q120 144 110 128Q125 147 136 132Q143 114 115 106Z" /><path d="M42 101V78Q45 35 81 36Q121 38 120 82L118 112Q80 133 42 101Z" /><path d="M56 48Q68 39 80 42" fill="none" stroke={light} strokeWidth="6" strokeLinecap="round" /><g fill={light}><circle cx="43" cy="136" r="4" /><circle cx="56" cy="144" r="4" /><circle cx="81" cy="146" r="4" /><circle cx="107" cy="141" r="4" /></g></g>}
    {kind === 'parrot' && <g><path d="M46 111L40 151L72 137L89 153L105 110Z" fill="#297e78" /><path d="M42 99Q29 130 48 139L66 111Z" fill="#e9bb51" /><path d="M111 97Q137 129 112 140L98 113Z" fill="#e9bb51" /><path d="M40 82Q33 41 69 37L58 22Q86 15 96 37Q130 40 121 88L109 122Q80 144 52 120Z" fill={color} /><path d="M49 80Q46 52 66 53Q80 53 80 70Q85 48 105 55Q119 66 111 87L81 102Z" fill="#fff5d7" /><path d="M80 78Q100 81 91 106L80 98L69 101Q60 82 80 78Z" fill="#edaa41" /><path d="M80 79L81 98" stroke="#bd792d" strokeWidth="2" /></g>}
    {kind === 'turtle' && <g><ellipse cx="80" cy="116" rx="45" ry="34" fill="#4b8164" /><path d="M46 125L64 108L91 109L111 128M64 108L61 88M91 109L100 88M65 109L67 145M91 110L95 144" fill="none" stroke="#9ec284" strokeWidth="3" /><ellipse cx="39" cy="124" rx="12" ry="19" transform="rotate(27 39 124)" fill={color} /><ellipse cx="121" cy="124" rx="12" ry="19" transform="rotate(-27 121 124)" fill={color} /><ellipse cx="80" cy="74" rx="36" ry="37" fill={color} /><path d="M53 88Q80 111 107 88Q100 115 80 115Q60 113 53 88Z" fill={light} /><path d="M50 59Q79 26 111 58" fill="none" stroke="#e3b85b" strokeWidth="8" /></g>}
    {kind === 'shark' && <g>
      <path d="M62 55L84 15L91 62L128 96L145 122L114 115L109 148H53L44 115L17 127L34 96Z" fill="#64879d" />
      <path d="M35 94L80 41L124 94Q130 119 108 140Q80 155 51 137Q32 118 35 94Z" fill="#8baabc" />
      <path d="M43 102Q80 114 117 101L106 136Q80 149 54 134Z" fill="#edf4ef" />
      <path d="M49 78L65 83M96 83L112 77" stroke="#355767" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="59" cy="88" rx="4" ry="5" fill="#253e48" /><ellipse cx="103" cy="88" rx="4" ry="5" fill="#253e48" />
      <path d="M57 106Q80 127 104 105Q82 141 57 106Z" fill="#3d5965" />
      <path d="M61 109L67 119L73 115L80 124L86 116L93 120L101 108" fill="#fffdf1" />
      <path d="M34 100L43 104M31 107L40 110M119 102L127 99M122 109L131 106" stroke="#4e7080" strokeWidth="2.5" />
    </g>}
    {kind === 'dolphin' && <g>
      <path d="M59 93Q19 68 32 51L69 69Z" fill="#338aab" />
      <path d="M45 127Q33 102 48 65Q59 33 88 36Q115 36 122 58Q127 75 110 87L137 89Q153 99 134 109L109 113Q104 135 88 140L88 155L107 143L114 158Q93 170 80 156Q65 164 49 154L56 142L72 148L66 135Z" fill="#57b7cc" />
      <path d="M59 86Q54 119 75 136Q101 140 109 113L134 107Q115 111 97 102Q78 93 80 69Z" fill="#d6f5e9" />
      <path d="M59 101Q29 112 32 133Q48 135 72 114Z" fill="#369ab9" />
      <path d="M70 48Q83 39 94 47" fill="none" stroke="#a9e5e5" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="98" cy="68" rx="4.5" ry="6" fill="#253e48" /><circle cx="99" cy="66" r="1.5" fill="white" />
      <path d="M101 98Q119 110 136 98" fill="none" stroke="#326a80" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="103" cy="84" rx="7" ry="4" fill="#e7b9a1" />
    </g>}
    {kind === 'whale' && <g>
      <path d="M104 111Q127 129 132 104L124 88Q139 87 145 102Q157 89 158 104Q159 123 145 129Q130 159 104 138Z" fill="#5b7fb2" />
      <path d="M20 106Q15 56 57 48Q105 35 119 78L120 120Q109 151 69 151Q28 151 20 123Z" fill="#7296c8" />
      <path d="M23 112Q63 133 117 111L112 132Q70 167 28 135Z" fill="#e4eaf6" />
      <path d="M42 132L43 144M57 136L57 148M73 137V149M89 134L89 145" stroke="#b1c5e0" strokeWidth="2" />
      <ellipse cx="45" cy="94" rx="4" ry="5" fill="#253e48" /><ellipse cx="96" cy="94" rx="4" ry="5" fill="#253e48" />
      <circle cx="46" cy="92" r="1.4" fill="white" /><circle cx="97" cy="92" r="1.4" fill="white" />
      <path d="M58 110Q70 121 83 110" fill="none" stroke="#3d5c8a" strokeWidth="3" strokeLinecap="round" />
      <path d="M53 119Q41 152 67 155L81 137" fill="#5b7fb2" />
      <path d="M67 48V20M63 45Q45 17 40 30M72 43Q83 16 94 25" fill="none" stroke="#5cbfc6" strokeWidth="5" strokeLinecap="round" />
      <circle cx="66" cy="13" r="4" fill="#5cbfc6" /><circle cx="98" cy="32" r="3" fill="#5cbfc6" />
      <path d="M32 72Q38 59 51 58" fill="none" stroke="#acbee0" strokeWidth="5" strokeLinecap="round" />
    </g>}
    {kind === 'crab' && <g fill={color}><path d="M47 116L24 111L17 123M47 126L24 129L21 141M111 116L137 110L145 123M111 128L136 131L140 143" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" /><path d="M43 102L25 81L16 86L28 113M117 103L136 81L146 88L132 115" /><path d="M23 88Q1 76 16 54L23 71L32 52Q49 72 31 91M134 89Q112 75 128 53L135 71L146 54Q160 76 142 91" /><ellipse cx="80" cy="113" rx="44" ry="31" /><path d="M60 91L57 65M101 91L105 65" stroke={color} strokeWidth="8" /><circle cx="57" cy="65" r="12" fill="#fff5d7" /><circle cx="105" cy="65" r="12" fill="#fff5d7" /></g>}
    {!['shark', 'dolphin', 'whale'].includes(kind) && <g>
      <g fill="#253e48"><ellipse cx={kind === 'crab' ? 57 : 64} cy={kind === 'crab' ? 66 : 77} rx="3.5" ry="5" /><ellipse cx={kind === 'crab' ? 105 : 98} cy={kind === 'crab' ? 66 : 77} rx="3.5" ry="5" /></g>
      <g fill="white"><circle cx={kind === 'crab' ? 58 : 65} cy={kind === 'crab' ? 64 : 75} r="1.3" /><circle cx={kind === 'crab' ? 106 : 99} cy={kind === 'crab' ? 64 : 75} r="1.3" /></g>
      {kind !== 'parrot' && <path d={kind === 'crab' ? 'M69 114Q80 125 93 113' : 'M70 97Q80 106 93 96'} fill="none" stroke="#39575b" strokeWidth="2.5" strokeLinecap="round" />}
      <path d="M54 123L80 130L108 122L105 135L80 142L55 134Z" fill="#e37459" /><path d="M81 135L95 151L106 137" fill="#bf504c" /><circle cx="80" cy="134" r="5" fill="#f8cd66" />
    </g>}
  </svg>;
}

export function CharacterArt({ value, className = '' }: { value: string; className?: string }) {
  const id = useId().replace(/:/g, '');
  if (value !== '🏴‍☠️') return <CompanionArt value={value} className={className} />;
  const seed = Array.from(value).reduce((sum, character) => sum + character.codePointAt(0)!, 0);
  const variant = seed % 4;
  const palettes = [
    ['#f07b62', '#ad3845', '#ffdbac'],
    ['#49bda9', '#187b79', '#b67b57'],
    ['#e7ba49', '#b77b29', '#f3bd91'],
    ['#8497db', '#465d9e', '#d6946d'],
  ];
  const [color, dark, skin] = palettes[variant];
  return (
    <svg className={`character-art ${className}`} viewBox="0 0 160 176" role="img" aria-label={value}>
      <defs>
        <linearGradient id={`${id}-back`} x2="0.8" y2="1">
          <stop stopColor={color} stopOpacity=".25" />
          <stop offset="1" stopColor={color} stopOpacity=".65" />
        </linearGradient>
      </defs>
      <circle cx="80" cy="84" r="70" fill={`url(#${id}-back)`} />
      <path d="M22 134Q25 115 43 112L61 107H99L119 114Q135 123 139 150Q80 177 22 150Z" fill={dark} />
      <path d="M58 108L80 140L103 108L96 101H64Z" fill="#fff7df" />
      <path d="M69 91H92V115Q80 129 68 113Z" fill={skin} />
      <path d="M42 57Q42 21 80 23Q119 22 119 62L114 88H46Z" fill="#313e46" />
      <ellipse cx="44" cy="77" rx="9" ry="12" fill={skin} />
      <ellipse cx="117" cy="77" rx="9" ry="12" fill={skin} />
      <path d="M49 54Q80 37 111 56V82Q110 109 81 115Q50 110 49 82Z" fill={skin} />
      <path d="M49 58Q58 56 67 44Q83 64 111 56V44L82 31L52 41Z" fill="#313e46" />
      <path d="M59 71L70 69M92 69L103 71" fill="none" stroke="#3a3f44" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="65" cy="79" rx="3.2" ry="4.6" fill="#263640" />
      <ellipse cx="97" cy="79" rx="3.2" ry="4.6" fill="#263640" />
      <circle cx="66" cy="77" r="1" fill="white" />
      <circle cx="98" cy="77" r="1" fill="white" />
      <path d="M79 80L76 90H83" fill="none" stroke="#9e654f" strokeWidth="2" strokeLinecap="round" />
      <path d="M69 97Q81 107 94 96" fill="#fffaf0" stroke="#9b5b4b" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="58" cy="91" rx="6" ry="3" fill="#ed927d" opacity=".6" />
      <ellipse cx="104" cy="91" rx="6" ry="3" fill="#ed927d" opacity=".6" />
      {variant === 0 && <g><path d="M28 52Q27 31 52 37Q80 -1 108 37Q135 31 133 52L111 63Q81 48 49 63Z" fill="#344658" stroke="#1c3145" strokeWidth="3" /><path d="M35 49L53 47Q80 13 108 47L126 49" fill="none" stroke="#efc565" strokeWidth="4" /><path d="M76 31H85V43H76Z" fill="#fff2cd" /><circle cx="80" cy="30" r="7" fill="#fff2cd" /><path d="M68 120L94 152" stroke={color} strokeWidth="9" /></g>}
      {variant === 1 && <g><path d="M35 57Q35 26 65 24H100Q122 31 124 57Z" fill={color} /><path d="M24 58Q80 45 135 58Q125 70 98 63H45Z" fill={dark} /><path d="M67 27H94L98 51H63Z" fill="#fff2cd" opacity=".4" /><path d="M45 119L56 158M112 118L104 157" stroke="#efc565" strokeWidth="7" /><rect x="50" y="134" width="10" height="11" rx="2" fill="#fff2cd" /></g>}
      {variant === 2 && <g><path d="M42 61V43Q48 14 82 17Q115 19 119 45V62H105V44L55 45V63Z" fill={dark} /><path d="M45 46Q80 31 116 46" stroke={color} strokeWidth="14" fill="none" /><rect x="50" y="35" width="26" height="21" rx="9" fill="#d9f4f4" stroke="#795a3f" strokeWidth="5" /><rect x="85" y="35" width="26" height="21" rx="9" fill="#d9f4f4" stroke="#795a3f" strokeWidth="5" /><path d="M76 44H85M58 39L66 50M93 39L101 50" stroke="white" strokeWidth="3" /><path d="M59 118L80 137L99 118L94 149L81 141L67 152Z" fill={color} /></g>}
      {variant === 3 && <g><path d="M38 55Q32 24 58 23Q80 7 108 24Q127 26 124 56L106 48Q81 38 54 54Z" fill={color} /><path d="M46 51Q74 35 114 49L137 62Q108 69 89 56Z" fill={dark} /><path d="M47 115L67 129L81 120L97 132L116 118" fill="none" stroke={color} strokeWidth="9" /><circle cx="98" cy="140" r="7" fill="#efc565" /><path d="M98 135V145M93 140H103" stroke="#ad7b2d" strokeWidth="2" /></g>}
      <path d="M28 146Q80 164 132 146" fill="none" stroke="white" strokeOpacity=".18" strokeWidth="3" />
    </svg>
  );
}

function Palm({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><path d="M0 0Q12 -28 5 -64" fill="none" stroke="#a66e3e" strokeWidth="9" /><path d="M0 -17L8 -20M3 -32L11 -35M4 -48L11 -49" stroke="#dfb071" strokeWidth="3" /><path d="M5 -62Q-30 -85 -44 -55Q-17 -65 5 -62Q-27 -60 -26 -30Q-11 -48 5 -62Q4 -94 28 -93Q13 -80 5 -62Q39 -83 52 -55Q27 -66 5 -62Q42 -52 34 -29Q20 -47 5 -62Z" fill="#258b64" /><path d="M5 -62Q-5 -85 -19 -83Q-6 -75 5 -62Q22 -79 35 -72Q19 -71 5 -62Z" fill="#65bf78" /><circle cx="4" cy="-59" r="5" fill="#a66e3e" /></g>;
}

export function IslandArt({ kind }: { kind: IslandId }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className="island-art" viewBox="0 0 280 210" aria-hidden="true">
      <defs><linearGradient id={`${id}-rock`} x2="0" y2="1"><stop stopColor="#d7a66a" /><stop offset="1" stopColor="#966744" /></linearGradient></defs>
      <ellipse cx="142" cy="179" rx="126" ry="25" fill="#167d91" opacity=".19" />
      <ellipse cx="140" cy="173" rx="124" ry="25" fill="none" stroke="#dcffef" strokeOpacity=".5" strokeWidth="3" />
      <path d="M30 142Q53 118 100 122L205 121L245 145L224 173L167 191L89 183L45 164Z" fill={`url(#${id}-rock)`} />
      <path d="M28 142Q39 116 81 119Q116 97 158 112Q208 106 244 136Q264 154 221 164Q184 179 138 171Q98 183 60 166Q24 163 28 142Z" fill="#f9d68c" />
      <path d="M44 134Q67 112 102 120Q125 101 158 115Q203 109 229 136Q230 149 199 151Q168 143 139 157Q99 166 75 150Q39 154 44 134Z" fill={kind === 'voice' ? '#779d98' : '#79ba75'} />
      <path d="M51 132Q78 117 103 126Q133 111 157 121Q196 115 222 135" fill="none" stroke={kind === 'voice' ? '#aac9ae' : '#a4d588'} strokeWidth="7" strokeLinecap="round" />
      {kind === 'explore' && <g><Palm x={69} y={134} scale={.95} /><Palm x={211} y={134} scale={.68} /><path d="M101 139V91L146 75L186 95V142Z" fill="#fff4ce" /><path d="M92 94L143 64L195 95L183 103L143 80L103 102Z" fill="#dc7159" /><path d="M146 82V141M106 104L136 94V124L106 133M153 94L179 105V134L153 125" fill="#56a7a0" stroke="#fff4ce" strokeWidth="4" /><path d="M130 141L141 134L157 141L145 149Z" fill="#fff4ce" /><path d="M83 158Q103 140 129 144" fill="none" stroke="#f8dea0" strokeWidth="10" /><circle cx="202" cy="145" r="5" fill="#ed8a68" /></g>}
      {kind === 'pacer' && <g><Palm x={211} y={133} scale={.68} /><path d="M94 142L109 61H153L168 143Z" fill="#fff4d8" /><path d="M105 82H157L160 99H102ZM98 119H164L167 137H95Z" fill="#ed8068" /><path d="M105 61V44H157V61Z" fill="#375d68" /><path d="M101 43L131 24L161 43Z" fill="#e66e5e" /><path d="M115 48H147V61H115Z" fill="#f3ca67" /><path d="M117 48V61M130 48V61M143 48V61" stroke="#375d68" strokeWidth="3" /><path d="M123 143V125Q131 113 140 125V143Z" fill="#375d68" /><path d="M65 138L87 132L97 140L91 146H64Z" fill="#8eaaa1" /><path d="M172 149Q194 131 211 147" fill="none" stroke="#f8dea0" strokeWidth="9" /><path d="M171 66L213 54M174 77L233 69M171 89L211 89" stroke="#f0ffec" strokeWidth="3" strokeLinecap="round" /></g>}
      {kind === 'rsvp' && <g><path d="M69 143L102 71L120 91L142 43L189 140Z" fill="#59917d" /><path d="M119 90L142 43L164 89L149 80L140 89L133 76Z" fill="#e9f4d5" /><path d="M73 144L103 82L125 123L113 139Z" fill="#91b78c" /><path d="M157 137V107H199V139Z" fill="#fff0c8" /><path d="M151 108L177 84L205 108Z" fill="#e67556" /><path d="M172 136V117H185V138" fill="#3e7b7d" /><Palm x={211} y={145} scale={.6} /><path d="M116 139L138 121L147 127L132 151L111 159" fill="none" stroke="#f8dea0" strokeWidth="8" /><path d="M94 55L108 31L104 48H117L98 70L103 55Z" fill="#f7cb57" /></g>}
      {kind === 'voice' && <g><path d="M65 146Q64 77 110 75L122 46L153 57Q205 70 207 147Z" fill="#567478" /><path d="M73 139Q80 90 114 89L131 62L151 74Q189 84 199 139" fill="none" stroke="#739690" strokeWidth="9" /><path d="M108 150V117Q110 94 137 94Q167 96 169 120V150Z" fill="#273f4c" /><path d="M118 146V119Q121 106 135 105" fill="none" stroke="#9ab0a0" strokeWidth="4" /><path d="M128 141L137 116L150 126L145 142Z" fill="#67d4be" /><path d="M156 91L164 68L175 78L170 94Z" fill="#a2e5ce" /><path d="M77 142L86 121L96 134L92 147Z" fill="#afdcc0" /><path d="M178 45Q190 35 200 46Q197 57 187 57Q183 68 174 63Q165 69 160 61Q151 63 148 54L157 45L168 51L176 43Z" fill="#344a60" /><path d="M185 37L197 20M199 44L218 38M172 31L175 17" stroke="#e0f6cc" strokeWidth="3" strokeLinecap="round" /></g>}
      <path d="M62 170L74 175M182 175L200 171M100 180L107 181" stroke="#fbe5b5" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function OceanDecor() {
  return (
    <svg className="ocean-decor" viewBox="0 0 1000 650" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><pattern id="ocean-lines" width="110" height="65" patternUnits="userSpaceOnUse"><path d="M10 32Q22 25 34 32T58 32" fill="none" stroke="#e1fff8" strokeOpacity=".17" strokeWidth="2" /></pattern></defs>
      <rect width="1000" height="650" fill="url(#ocean-lines)" />
      <g fill="#fffdf1" opacity=".8"><path d="M58 65Q80 27 105 61Q133 45 150 72Q126 85 62 81Q42 78 58 65Z" /><path d="M770 560Q794 524 822 554Q850 542 869 567Q841 580 778 575Q757 573 770 560Z" /></g>
      <g fill="none" stroke="#f4ffec" strokeWidth="3" strokeLinecap="round" opacity=".8"><path d="M330 89Q338 80 346 89Q355 80 363 89M373 69Q379 62 385 69Q392 62 398 69M855 276Q863 267 871 276Q880 267 888 276" /></g>
      <g transform="translate(105 330) rotate(-12)"><ellipse cy="31" rx="38" ry="8" fill="#177d93" opacity=".22" /><path d="M-30 16H34L22 32H-17Z" fill="#f6e4bb" /><path d="M-28 19H31L24 26H-20Z" fill="#ce7759" /><path d="M1 17V-43" stroke="#6b6351" strokeWidth="4" /><path d="M-3 -40L-28 9H-3Z" fill="#fffbdf" /><path d="M5 -35L28 7H5Z" fill="#ed9b74" /><path d="M1 -43L18 -38L1 -32Z" fill="#f6ce69" /></g>
      <g transform="translate(90 555)" opacity=".65" fill="none" stroke="#efffe8"><circle r="31" strokeWidth="1" /><circle r="26" strokeWidth="1" /><path d="M0 -43L8 -8L0 0L-8 -8ZM0 43L8 8L0 0L-8 8Z" fill="#f5ffe9" stroke="none" /><path d="M-43 0L-8 -8L0 0L-8 8ZM43 0L8 -8L0 0L8 8Z" fill="#f5ffe9" opacity=".5" stroke="none" /></g>
    </svg>
  );
}

export function ChestArt() {
  return <svg className="chest-art" viewBox="0 0 240 190" aria-hidden="true">
    <ellipse cx="120" cy="167" rx="90" ry="12" fill="#337f78" opacity=".15" />
    <path d="M41 99V76Q41 39 80 39H164Q198 42 198 77V99Z" fill="#b16e47" stroke="#754d39" strokeWidth="4" />
    <path d="M48 76H193M48 90H192M64 55H180" stroke="#d6975e" strokeWidth="4" />
    <path d="M41 99H198V155L178 170H63L41 154Z" fill="#a55b40" stroke="#754d39" strokeWidth="4" />
    <path d="M49 119H191M49 139H191M65 158H178" stroke="#cb8354" strokeWidth="3" />
    <path d="M65 43V164H83V41M158 41V164H177V44" fill="#ecc666" stroke="#b88a39" strokeWidth="3" />
    <path d="M38 96H201V112H38Z" fill="#f4d37a" stroke="#b88a39" strokeWidth="3" />
    <path d="M107 100H135V133L121 142L107 133Z" fill="#f4d37a" stroke="#b88a39" strokeWidth="3" />
    <circle cx="121" cy="116" r="5" fill="#73563c" /><path d="M121 119V129" stroke="#73563c" strokeWidth="4" />
    <g fill="#fff1b4"><circle cx="74" cy="61" r="3" /><circle cx="74" cy="145" r="3" /><circle cx="168" cy="61" r="3" /><circle cx="168" cy="145" r="3" /></g>
    <path d="M27 61L31 48L35 61L48 65L35 69L31 82L27 69L14 65ZM201 31L205 18L209 31L222 35L209 39L205 52L201 39L188 35Z" fill="#f0c45f" />
  </svg>;
}