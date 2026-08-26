// Prachurjo Interactive Sound Effects Engine
// Supports 60+ SFX (Core Studio Sounds + SFX 50+ Collection)
// Powered by HTML5 Audio with instant Web Audio API algorithmic fallback

export type SfxCategory = 
  | 'core' 
  | 'sfx50_impact' 
  | 'sfx50_bass' 
  | 'sfx50_scifi' 
  | 'sfx50_clicks' 
  | 'sfx50_bursts' 
  | 'sfx50_ambient';

export interface SoundItemMeta {
  id: string;
  name: string;
  category: SfxCategory;
  categoryLabel: string;
  path: string;
  description: string;
  tag: string;
  pack: 'core' | 'SFX50+';
  durationHint?: string;
}

// 8 Core System Sounds
export const CORE_SOUNDS: SoundItemMeta[] = [
  {
    id: 'resonantHit',
    name: 'Resonant Tonal Hit',
    category: 'core',
    categoryLabel: 'Core Studio',
    path: '/sounds/01_Resonant_Tonal_Hit.wav',
    description: 'AI generation complete, task success & unlocks',
    tag: 'Success',
    pack: 'core'
  },
  {
    id: 'chime',
    name: 'Metallic Chime Sting',
    category: 'core',
    categoryLabel: 'Core Studio',
    path: '/sounds/02_Metallic_Chime_Sting.wav',
    description: 'Copy prompt, clipboard, & bookmark confirmation',
    tag: 'Action',
    pack: 'core'
  },
  {
    id: 'glitch',
    name: 'Digital Glitch Burst',
    category: 'core',
    categoryLabel: 'Core Studio',
    path: '/sounds/03_Digital_Glitch_Burst.wav',
    description: 'AI processing start, analyzer scan, & randomize',
    tag: 'Sci-Fi',
    pack: 'core'
  },
  {
    id: 'ticks',
    name: 'Rapid Electronic Ticks',
    category: 'core',
    categoryLabel: 'Core Studio',
    path: '/sounds/04_Rapid_Electronic_Ticks.wav',
    description: 'Rapid electronic tick sequences for sound design & creators',
    tag: 'Ticks',
    pack: 'core'
  },
  {
    id: 'whoosh',
    name: 'Cinematic Whoosh Impact',
    category: 'core',
    categoryLabel: 'Core Studio',
    path: '/sounds/05_Cinematic_Whoosh_Impact.wav',
    description: 'Download 4K thumbnail, export files, & hero CTA',
    tag: 'Download',
    pack: 'core'
  },
  {
    id: 'staticHit',
    name: 'Sharp Static Hit',
    category: 'core',
    categoryLabel: 'Core Studio',
    path: '/sounds/06_Sharp_Static_Hit.wav',
    description: 'Form reset, clear history, delete & validation alerts',
    tag: 'Alert',
    pack: 'core'
  },
  {
    id: 'bassDrop',
    name: 'Deep Bass Drop',
    category: 'core',
    categoryLabel: 'Core Studio',
    path: '/sounds/07_Deep_Bass_Drop.wav',
    description: 'Dark/Light theme toggle & atmospheric highlights',
    tag: 'Theme',
    pack: 'core'
  },
  {
    id: 'wobble',
    name: 'Cartoon Wobble Bounce',
    category: 'core',
    categoryLabel: 'Core Studio',
    path: '/sounds/08_Cartoon_Wobble_Bounce.wav',
    description: 'Like prompt, heart reaction & playful micro-actions',
    tag: 'Reaction',
    pack: 'core'
  }
];

// SFX 50+ Collection (53 High Quality SFX Files in /sounds/SFX50+/)
export const SFX50_COLLECTION: SoundItemMeta[] = [
  // ─── Risers & Cinematic Impacts ───
  {
    id: 'sfx_01_power_up',
    name: 'Digital Power Up Burst',
    category: 'sfx50_impact',
    categoryLabel: 'Riser & Impact',
    path: '/sounds/SFX50+/01_Digital_Power_Up_Burst.wav',
    description: 'Energetic digital riser leading to a sharp punch',
    tag: 'Power Up',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_01_sweep',
    name: 'High Frequency Digital Sweep',
    category: 'sfx50_impact',
    categoryLabel: 'Riser & Impact',
    path: '/sounds/SFX50+/01_High_Frequency_Digital_Sweep.wav',
    description: 'Crisp high-pitched digital transition sweep',
    tag: 'Sweep',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_01_cinematic_riser',
    name: 'Long Cinematic Riser Impact',
    category: 'sfx50_impact',
    categoryLabel: 'Riser & Impact',
    path: '/sounds/SFX50+/01_Long_Cinematic_Riser_Impact.wav',
    description: 'Slow building tension riser followed by huge impact',
    tag: 'Cinematic',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_01_rising_rumble',
    name: 'Rising Rumble Impact',
    category: 'sfx50_impact',
    categoryLabel: 'Riser & Impact',
    path: '/sounds/SFX50+/01_Rising_Rumble_Impact.wav',
    description: 'Sub-bass rumble accelerating into a heavy hit',
    tag: 'Rumble',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_05_whoosh_rumble',
    name: 'Cinematic Whoosh Rumble',
    category: 'sfx50_impact',
    categoryLabel: 'Riser & Impact',
    path: '/sounds/SFX50+/05_Cinematic_Whoosh_Rumble.wav',
    description: 'Atmospheric whoosh with a deep resonant tail',
    tag: 'Whoosh',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_05_wobble_riser',
    name: 'Tonal Wobble Riser',
    category: 'sfx50_impact',
    categoryLabel: 'Riser & Impact',
    path: '/sounds/SFX50+/05_Tonal_Wobble_Riser.wav',
    description: 'Modulated pitch riser with analog synth texture',
    tag: 'Synth Riser',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_06_digital_riser_hit',
    name: 'Digital Riser & Hit',
    category: 'sfx50_impact',
    categoryLabel: 'Riser & Impact',
    path: '/sounds/SFX50+/06_Digital_Riser_and_Hit.wav',
    description: 'Fast cybernetic riser triggering a clean punch',
    tag: 'Cyber Hit',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_09_scifi_riser',
    name: 'Sci-Fi Energy Riser',
    category: 'sfx50_impact',
    categoryLabel: 'Riser & Impact',
    path: '/sounds/SFX50+/09_SciFi_Energy_Riser.wav',
    description: 'Futuristic shield charge-up riser sound',
    tag: 'Energy',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_12_electronic_riser',
    name: 'Electronic Riser Hit',
    category: 'sfx50_impact',
    categoryLabel: 'Riser & Impact',
    path: '/sounds/SFX50+/12_Electronic_Riser_Hit.wav',
    description: 'Electronic upward swell with sharp release',
    tag: 'Electronic',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_18_final_impact',
    name: 'Final Cinematic Impact',
    category: 'sfx50_impact',
    categoryLabel: 'Riser & Impact',
    path: '/sounds/SFX50+/18_Final_Cinematic_Impact.wav',
    description: 'Grand trailer-grade finale impact with rich tail',
    tag: 'Trailer Hit',
    pack: 'SFX50+'
  },

  // ─── Deep Bass & Sub Impacts ───
  {
    id: 'sfx_02_deep_bass',
    name: 'Deep Bass Impact',
    category: 'sfx50_bass',
    categoryLabel: 'Bass & Rumble',
    path: '/sounds/SFX50+/02_Deep_Bass_Impact.wav',
    description: 'Subwoofer-shaking bass drop impact',
    tag: 'Deep Bass',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_05_resonant_bass',
    name: 'Resonant Bass Impact',
    category: 'sfx50_bass',
    categoryLabel: 'Bass & Rumble',
    path: '/sounds/SFX50+/05_Resonant_Bass_Impact.wav',
    description: 'Harmonic low-frequency bass with reverberation',
    tag: 'Harmonic',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_05_tonal_bass',
    name: 'Tonal Bass Stabs',
    category: 'sfx50_bass',
    categoryLabel: 'Bass & Rumble',
    path: '/sounds/SFX50+/05_Tonal_Bass_Stabs.wav',
    description: 'Distinct musical low note bass pulses',
    tag: 'Bass Stabs',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_06_secondary_bass',
    name: 'Secondary Bass Impact',
    category: 'sfx50_bass',
    categoryLabel: 'Bass & Rumble',
    path: '/sounds/SFX50+/06_Secondary_Bass_Impact.wav',
    description: 'Medium sub punch designed for secondary highlights',
    tag: 'Sub Bass',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_07_transition_bass',
    name: 'Transition Bass Swell',
    category: 'sfx50_bass',
    categoryLabel: 'Bass & Rumble',
    path: '/sounds/SFX50+/07_Transition_Bass_Swell.wav',
    description: 'Smooth low swell for section transitions',
    tag: 'Swell',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_08_final_bass',
    name: 'Final Bass Hit',
    category: 'sfx50_bass',
    categoryLabel: 'Bass & Rumble',
    path: '/sounds/SFX50+/08_Final_Bass_Hit.wav',
    description: 'Heavy bass thud for modal close or section finish',
    tag: 'Heavy Thud',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_10_low_impact_group',
    name: 'Final Low Impact Group',
    category: 'sfx50_bass',
    categoryLabel: 'Bass & Rumble',
    path: '/sounds/SFX50+/10_Final_Low_Impact_Group.wav',
    description: 'Multi-layered low impact composite sound',
    tag: 'Composite',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_11_cinematic_bass',
    name: 'Cinematic Bass Hit',
    category: 'sfx50_bass',
    categoryLabel: 'Bass & Rumble',
    path: '/sounds/SFX50+/11_Cinematic_Bass_Hit.wav',
    description: 'Cinematic sub bass strike with high clarity',
    tag: 'Sub Strike',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_11_long_rumble',
    name: 'Long Cinematic Rumble',
    category: 'sfx50_bass',
    categoryLabel: 'Bass & Rumble',
    path: '/sounds/SFX50+/11_Long_Cinematic_Rumble.wav',
    description: 'Sustained sub-harmonic earthquake-like rumble',
    tag: 'Sustained',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_17_low_rumble',
    name: 'Low Rumble Impact',
    category: 'sfx50_bass',
    categoryLabel: 'Bass & Rumble',
    path: '/sounds/SFX50+/17_Low_Rumble_Impact.wav',
    description: 'Low-end atmospheric impact decay',
    tag: 'Decay',
    pack: 'SFX50+'
  },

  // ─── Sci-Fi, Lasers & Zaps ───
  {
    id: 'sfx_02_laser_pulse',
    name: 'Short Laser Pulse',
    category: 'sfx50_scifi',
    categoryLabel: 'Sci-Fi & Zaps',
    path: '/sounds/SFX50+/02_Short_Laser_Pulse.wav',
    description: 'Fast sci-fi laser shot sound',
    tag: 'Laser',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_03_scifi_impact',
    name: 'Metallic Sci-Fi Impact',
    category: 'sfx50_scifi',
    categoryLabel: 'Sci-Fi & Zaps',
    path: '/sounds/SFX50+/03_Metallic_SciFi_Impact.wav',
    description: 'Futuristic metallic body collision sound',
    tag: 'Metal Sci-Fi',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_03_synth_stab',
    name: 'Resonant Synth Stab',
    category: 'sfx50_scifi',
    categoryLabel: 'Sci-Fi & Zaps',
    path: '/sounds/SFX50+/03_Resonant_Synth_Stab.wav',
    description: 'Cyberpunk synth chord stab',
    tag: 'Synth Stab',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_04_glitch_riser',
    name: 'Glitch Static Riser',
    category: 'sfx50_scifi',
    categoryLabel: 'Sci-Fi & Zaps',
    path: '/sounds/SFX50+/04_Glitch_Static_Riser.wav',
    description: 'Corrupted data static riser burst',
    tag: 'Static Riser',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_07_digital_zap',
    name: 'Digital Zap Sequence',
    category: 'sfx50_scifi',
    categoryLabel: 'Sci-Fi & Zaps',
    path: '/sounds/SFX50+/07_Digital_Zap_Sequence.wav',
    description: 'Multi-stage electric spark and zap sound',
    tag: 'Zap Sequence',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_07_electric_pulse',
    name: 'Electric Pulse Sequence',
    category: 'sfx50_scifi',
    categoryLabel: 'Sci-Fi & Zaps',
    path: '/sounds/SFX50+/07_Electric_Pulse_Sequence.wav',
    description: 'Rhythmic electrical hum and pulse pattern',
    tag: 'Electric Hum',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_07_glitch_zap',
    name: 'Glitch Zap',
    category: 'sfx50_scifi',
    categoryLabel: 'Sci-Fi & Zaps',
    path: '/sounds/SFX50+/07_Glitch_Zap.wav',
    description: 'Single high-energy glitch zap',
    tag: 'Glitch Zap',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_11_data_static',
    name: 'Data Static Burst',
    category: 'sfx50_scifi',
    categoryLabel: 'Sci-Fi & Zaps',
    path: '/sounds/SFX50+/11_Data_Static_Burst.wav',
    description: 'Modem / digital network packet burst',
    tag: 'Data Packet',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_13_layered_scifi',
    name: 'Layered Sci-Fi Sequence',
    category: 'sfx50_scifi',
    categoryLabel: 'Sci-Fi & Zaps',
    path: '/sounds/SFX50+/13_Layered_SciFi_Sequence.wav',
    description: 'Multi-layer futuristic machinery cycle',
    tag: 'Machinery',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_16_sharp_transition',
    name: 'Sharp Transition Hit',
    category: 'sfx50_scifi',
    categoryLabel: 'Sci-Fi & Zaps',
    path: '/sounds/SFX50+/16_Sharp_Transition_Hit.wav',
    description: 'High frequency cybernetic whip transition',
    tag: 'Cyber Whip',
    pack: 'SFX50+'
  },

  // ─── Clicks, Ticks & Micro UI ───
  {
    id: 'sfx_02_sharp_digital_hit',
    name: 'Sharp Digital Hit',
    category: 'sfx50_clicks',
    categoryLabel: 'Clicks & UI',
    path: '/sounds/SFX50+/02_Sharp_Digital_Hit.wav',
    description: 'Snappy UI click with digital accent',
    tag: 'UI Hit',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_03_metallic_click',
    name: 'Metallic Click',
    category: 'sfx50_clicks',
    categoryLabel: 'Clicks & UI',
    path: '/sounds/SFX50+/03_Metallic_Click.wav',
    description: 'Clean physical metal latch click',
    tag: 'Metal Click',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_04_tiny_glitch_tick',
    name: 'Tiny Glitch Tick',
    category: 'sfx50_clicks',
    categoryLabel: 'Clicks & UI',
    path: '/sounds/SFX50+/04_Tiny_Glitch_Tick.wav',
    description: 'Subtle high-tech micro tick for toggles',
    tag: 'Micro Tick',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_04_triple_click',
    name: 'Triple Digital Click',
    category: 'sfx50_clicks',
    categoryLabel: 'Clicks & UI',
    path: '/sounds/SFX50+/04_Triple_Digital_Click.wav',
    description: 'Three rapid ascending digital clicks',
    tag: 'Triple Click',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_08_sharp_digital_hit',
    name: 'Sharp Digital Hit II',
    category: 'sfx50_clicks',
    categoryLabel: 'Clicks & UI',
    path: '/sounds/SFX50+/08_Sharp_Digital_Hit.wav',
    description: 'High-contrast click for primary button triggers',
    tag: 'Button Hit',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_10_tiny_ping',
    name: 'Tiny Digital Ping',
    category: 'sfx50_clicks',
    categoryLabel: 'Clicks & UI',
    path: '/sounds/SFX50+/10_Tiny_Digital_Ping.wav',
    description: 'Gentle notification ping chime',
    tag: 'Ping Chime',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_13_sharp_tick',
    name: 'Sharp Electronic Tick',
    category: 'sfx50_clicks',
    categoryLabel: 'Clicks & UI',
    path: '/sounds/SFX50+/13_Sharp_Electronic_Tick.wav',
    description: 'Instant electronic tick feedback',
    tag: 'Fast Tick',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_14_isolated_click',
    name: 'Isolated Click Hit',
    category: 'sfx50_clicks',
    categoryLabel: 'Clicks & UI',
    path: '/sounds/SFX50+/14_Isolated_Click_Hit.wav',
    description: 'Crisp isolated click with dry acoustic profile',
    tag: 'Dry Click',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_14_metallic_click_hit',
    name: 'Metallic Click Hit',
    category: 'sfx50_clicks',
    categoryLabel: 'Clicks & UI',
    path: '/sounds/SFX50+/14_Metallic_Click_Hit.wav',
    description: 'Mechanical keyboard / relay click sound',
    tag: 'Mechanical',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_15_final_accent',
    name: 'Final Digital Accent',
    category: 'sfx50_clicks',
    categoryLabel: 'Clicks & UI',
    path: '/sounds/SFX50+/15_Final_Digital_Accent.wav',
    description: 'Delicate confirmation tone accent',
    tag: 'Accent',
    pack: 'SFX50+'
  },

  // ─── Bursts, Pulses & Sequences ───
  {
    id: 'sfx_02_rapid_pulse',
    name: 'Rapid Metallic Pulse Burst',
    category: 'sfx50_bursts',
    categoryLabel: 'Bursts & Pulses',
    path: '/sounds/SFX50+/02_Rapid_Metallic_Pulse_Burst.wav',
    description: 'High-speed sequence of metallic audio pulses',
    tag: 'Metallic Pulse',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_04_rhythmic_scifi',
    name: 'Rhythmic Sci-Fi Pulse Sequence',
    category: 'sfx50_bursts',
    categoryLabel: 'Bursts & Pulses',
    path: '/sounds/SFX50+/04_Rhythmic_SciFi_Pulse_Sequence.wav',
    description: 'Scanning audio loop with steady cadence',
    tag: 'Scanner Pulse',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_06_layered_tech',
    name: 'Layered Tech Burst',
    category: 'sfx50_bursts',
    categoryLabel: 'Bursts & Pulses',
    path: '/sounds/SFX50+/06_Layered_Tech_Burst.wav',
    description: 'Multi-frequency technology explosion burst',
    tag: 'Tech Burst',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_06_rhythmic_low_pulse',
    name: 'Rhythmic Low Pulse Sequence',
    category: 'sfx50_bursts',
    categoryLabel: 'Bursts & Pulses',
    path: '/sounds/SFX50+/06_Rhythmic_Low_Pulse_Sequence.wav',
    description: 'Deep heartbeat-like rhythmic pulse train',
    tag: 'Heartbeat',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_08_pulsing_synth',
    name: 'Pulsing Synth Rumble',
    category: 'sfx50_bursts',
    categoryLabel: 'Bursts & Pulses',
    path: '/sounds/SFX50+/08_Pulsing_Synth_Rumble.wav',
    description: 'Oscillating analog synth rumble texture',
    tag: 'Synth Rumble',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_08_rapid_click_seq',
    name: 'Rapid Electronic Click Sequence',
    category: 'sfx50_bursts',
    categoryLabel: 'Bursts & Pulses',
    path: '/sounds/SFX50+/08_Rapid_Electronic_Click_Sequence.wav',
    description: 'Cascade of ultra-fast micro clicks',
    tag: 'Click Stream',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_09_high_tech_burst',
    name: 'High Tech Burst',
    category: 'sfx50_bursts',
    categoryLabel: 'Bursts & Pulses',
    path: '/sounds/SFX50+/09_High_Tech_Burst.wav',
    description: 'Complex futuristic device activation burst',
    tag: 'Activation',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_09_low_tech_pulses',
    name: 'Low Tech Pulses',
    category: 'sfx50_bursts',
    categoryLabel: 'Bursts & Pulses',
    path: '/sounds/SFX50+/09_Low_Tech_Pulses.wav',
    description: 'Warm, round low-end rhythmic pulses',
    tag: 'Warm Pulses',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_10_static_burst',
    name: 'Static Energy Burst',
    category: 'sfx50_bursts',
    categoryLabel: 'Bursts & Pulses',
    path: '/sounds/SFX50+/10_Static_Energy_Burst.wav',
    description: 'Sharp discharge of static electricity',
    tag: 'Discharge',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_12_low_tech_pulse',
    name: 'Low Tech Pulse',
    category: 'sfx50_bursts',
    categoryLabel: 'Bursts & Pulses',
    path: '/sounds/SFX50+/12_Low_Tech_Pulse.wav',
    description: 'Single round sub-bass tech pulse',
    tag: 'Single Pulse',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_15_rhythmic_burst',
    name: 'Rhythmic Digital Burst Sequence',
    category: 'sfx50_bursts',
    categoryLabel: 'Bursts & Pulses',
    path: '/sounds/SFX50+/15_Rhythmic_Digital_Burst_Sequence.wav',
    description: 'Energetic sequence of rhythmic digital bursts',
    tag: 'Burst Sequence',
    pack: 'SFX50+'
  },

  // ─── Ambient & Drone Tails ───
  {
    id: 'sfx_03_low_drone_whoosh',
    name: 'Low Drone Whoosh',
    category: 'sfx50_ambient',
    categoryLabel: 'Ambient & Drones',
    path: '/sounds/SFX50+/03_Low_Drone_Whoosh.wav',
    description: 'Cinematic deep space fly-by drone whoosh',
    tag: 'Space Drone',
    pack: 'SFX50+'
  },
  {
    id: 'sfx_16_low_ambient_tail',
    name: 'Low Ambient Drone Tail',
    category: 'sfx50_ambient',
    categoryLabel: 'Ambient & Drones',
    path: '/sounds/SFX50+/16_Low_Ambient_Drone_Tail.wav',
    description: 'Long ethereal drone decay for background atmosphere',
    tag: 'Ambient Tail',
    pack: 'SFX50+'
  }
];

// Combined full library of 61 Sound Items
export const ALL_SOUNDS: SoundItemMeta[] = [...CORE_SOUNDS, ...SFX50_COLLECTION];

export type SfxType = 
  | 'resonantHit' 
  | 'chime' 
  | 'glitch' 
  | 'ticks' 
  | 'whoosh' 
  | 'staticHit' 
  | 'bassDrop' 
  | 'wobble'
  | string;

class SoundManager {
  private enabled: boolean = true;
  private volume: number = 0.45;
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private audioCtx: AudioContext | null = null;
  private initialized: boolean = false;
  private listeners: Set<(enabled: boolean, volume: number) => void> = new Set();
  private soundMap: Map<string, SoundItemMeta> = new Map();

  constructor() {
    // Populate lookup map
    ALL_SOUNDS.forEach((s) => {
      this.soundMap.set(s.id, s);
    });

    if (typeof window !== 'undefined') {
      const savedEnabled = localStorage.getItem('prachurjo_sfx_enabled');
      if (savedEnabled !== null) {
        this.enabled = savedEnabled === 'true';
      }
      const savedVolume = localStorage.getItem('prachurjo_sfx_volume');
      if (savedVolume !== null) {
        const parsed = parseFloat(savedVolume);
        if (!isNaN(parsed)) this.volume = Math.max(0, Math.min(1, parsed));
      }

      // Unlock Web Audio context on user interaction
      const unlockAudio = () => {
        if (!this.initialized) {
          this.initAudio();
        }
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };
      window.addEventListener('click', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
    }
  }

  private initAudio() {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass && !this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      this.initialized = true;
    } catch {
      // Audio context initialize ignored
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('prachurjo_sfx_enabled', String(enabled));
    }
    this.notifyListeners();
  }

  public toggleSound(): boolean {
    this.setEnabled(!this.enabled);
    if (this.enabled) {
      this.play('chime');
    }
    return this.enabled;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (typeof window !== 'undefined') {
      localStorage.setItem('prachurjo_sfx_volume', String(this.volume));
    }
    this.notifyListeners();
  }

  public subscribe(listener: (enabled: boolean, volume: number) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn(this.enabled, this.volume));
  }

  public getMeta(id: string): SoundItemMeta | undefined {
    return this.soundMap.get(id);
  }

  public getAllSounds(): SoundItemMeta[] {
    return ALL_SOUNDS;
  }

  public getCoreSounds(): SoundItemMeta[] {
    return CORE_SOUNDS;
  }

  public getSfx50Sounds(): SoundItemMeta[] {
    return SFX50_COLLECTION;
  }

  public getSoundsByCategory(cat: SfxCategory): SoundItemMeta[] {
    return ALL_SOUNDS.filter((s) => s.category === cat);
  }

  /**
   * Play any sound by ID or path
   */
  public play(idOrPath: string, customVolumeMultiplier = 1) {
    if (!this.enabled || this.volume <= 0) return;

    try {
      const meta = this.soundMap.get(idOrPath);
      const filePath = meta ? meta.path : (idOrPath.startsWith('/') ? idOrPath : `/sounds/${idOrPath}.wav`);

      let audio = this.audioCache.get(filePath);

      if (!audio) {
        audio = new Audio(filePath);
        audio.preload = 'auto';
        this.audioCache.set(filePath, audio);
      }

      const effectiveVolume = Math.max(0, Math.min(1, this.volume * customVolumeMultiplier));
      audio.volume = effectiveVolume;

      // Handle rapid consecutive triggers safely
      if (audio.paused || audio.currentTime === 0) {
        const promise = audio.play();
        if (promise !== undefined) {
          promise.catch(() => {
            this.playSynthesizedFallback(idOrPath);
          });
        }
      } else {
        const clone = audio.cloneNode() as HTMLAudioElement;
        clone.volume = effectiveVolume;
        const promise = clone.play();
        if (promise !== undefined) {
          promise.catch(() => {
            this.playSynthesizedFallback(idOrPath);
          });
        }
      }
    } catch {
      this.playSynthesizedFallback(idOrPath);
    }
  }

  /**
   * High quality algorithmic fallback synthesis in Web Audio API
   */
  private playSynthesizedFallback(type: string) {
    try {
      if (!this.audioCtx) {
        this.initAudio();
      }
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.volume * 0.4, now);
      masterGain.connect(ctx.destination);

      if (type === 'chime' || type.includes('ping') || type.includes('accent')) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(2400, now + 0.04);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'glitch' || type.includes('zap') || type.includes('burst')) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(1600, now + 0.05);
        osc.frequency.linearRampToValueAtTime(400, now + 0.12);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'ticks' || type.includes('click') || type.includes('tick')) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1800, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.03);
      } else if (type === 'whoosh' || type.includes('sweep') || type.includes('riser')) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(750, now + 0.14);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.35);
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.5, now + 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type.includes('bass') || type.includes('rumble') || type === 'bassDrop') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(42, now + 0.45);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.5);
      } else {
        // Generic clean resonant chime
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(587.33, now);
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        osc2.frequency.setValueAtTime(1174.66, now);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(masterGain);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.5);
        osc2.stop(now + 0.5);
      }
    } catch {
      // Audio synthesis silent catch
    }
  }
}

export const soundManager = new SoundManager();

/**
 * Convenient Shortcut Methods
 */
export const sound = {
  // Common UI actions (Crisp metallic clicks & subtle micro ticks instead of rapid ticks)
  click: () => soundManager.play('sfx_03_metallic_click', 0.65),
  tab: () => soundManager.play('sfx_04_tiny_glitch_tick', 0.6),
  metallicClick: () => soundManager.play('sfx_03_metallic_click', 0.7),
  sharpHit: () => soundManager.play('sfx_02_sharp_digital_hit', 0.7),
  ticks: () => soundManager.play('ticks', 0.8),
  
  // Feedback and completions
  success: () => soundManager.play('resonantHit', 1.0),
  copy: () => soundManager.play('chime', 1.0),
  bookmark: () => soundManager.play('chime', 0.9),
  
  // Operations
  generate: () => soundManager.play('glitch', 0.9),
  scan: () => soundManager.play('glitch', 0.85),
  download: () => soundManager.play('whoosh', 1.0),
  launch: () => soundManager.play('whoosh', 0.9),
  
  // SFX50+ Shortcuts
  powerUp: () => soundManager.play('sfx_01_power_up', 0.9),
  cinematicHit: () => soundManager.play('sfx_01_cinematic_riser', 1.0),
  deepBass: () => soundManager.play('sfx_02_deep_bass', 1.0),
  laserPulse: () => soundManager.play('sfx_02_laser_pulse', 0.85),
  glitchZap: () => soundManager.play('sfx_07_glitch_zap', 0.9),
  techBurst: () => soundManager.play('sfx_06_layered_tech', 0.95),
  finalImpact: () => soundManager.play('sfx_18_final_impact', 1.0),
  
  // Modifiers & system
  error: () => soundManager.play('staticHit', 1.0),
  clear: () => soundManager.play('staticHit', 0.85),
  delete: () => soundManager.play('staticHit', 0.9),
  theme: () => soundManager.play('bassDrop', 0.85),
  like: () => soundManager.play('wobble', 0.95),
  bounce: () => soundManager.play('wobble', 0.9),
  
  // Direct access
  play: (idOrPath: string, vol?: number) => soundManager.play(idOrPath, vol),
  toggle: () => soundManager.toggleSound(),
  isEnabled: () => soundManager.isEnabled(),
  setVolume: (v: number) => soundManager.setVolume(v)
};

export const soundEffects = sound;

