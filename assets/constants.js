//////////////////////////////////
//AUDIO PROCESSING CONSTANTS
//////////////////////////////////
const WINDOW_SIZE = 1024;
const HALF_WINDOW_SIZE = WINDOW_SIZE / 2;
const MIDI_HIGH = 95; // B6 (1975.5 Hz), just over two octaves above violin open A
const MIDI_LOW = 48; // C2 (130.81 Hz), an octave below middle C
const MIDI_NUM = MIDI_HIGH - MIDI_LOW + 1;
const BINS_PER_MIDI = 3;
const BINS_NUM = BINS_PER_MIDI * MIDI_NUM;
const PITCH_MODEL_SHIFT = -7.0;
const PITCH_MODEL_WEIGHT = 0.05;
const MIN_NOTE_POWER = 0.10;
const MIN_NOTE_DURATION = 3;
const MIN_NOTE_DURATION_REL = 0.2;
const LOW_BPM = 60;
const HIGH_BPM = 240;
const SHRILL_THRESHOLD_PITCH = 76;
const SHRILL_THRESHOLD_ENERGY = 0.85;
const BASE_ENERGY_SCORE = -0.18;
const USER_MEDIA_CONSTRAINTS = {
      audio: {
         echoCancellation: false,
         noiseSuppression: true,
         sampleRate: { ideal: 48000 },
         channelCount: { ideal: 1 }
      },
      video: false
   };
const CONTOUR_TO_QUERY_CHAR = [
      'a', 'b', 'c', 'd', 'e', 
      'f', 'g', 'h', 'i', 'j', 
      'k', 'l', 'm', 'n', 'o',
      'p', 'q', 'r', 's', 't', 
      'u', 'v', 'w', 'x', 'y', 
      'z', 'A', 'B', 'C', 'D',
      'E', 'F', 'G', 'H', 'I',
      'J', 'K', 'L', 'M', 'N',
      'O', 'P', 'Q', 'R', 'S',
      'T', 'U', 'V'
   ];
const PITCH_MODEL_SCORE_ARRAY = [
      (PITCH_MODEL_SHIFT + -2.6399) * PITCH_MODEL_WEIGHT, // -12,
      (PITCH_MODEL_SHIFT + -4.3941) * PITCH_MODEL_WEIGHT, // -11,
      (PITCH_MODEL_SHIFT + -2.9723) * PITCH_MODEL_WEIGHT, // -10,
      (PITCH_MODEL_SHIFT + -2.1666) * PITCH_MODEL_WEIGHT, // -9,
      (PITCH_MODEL_SHIFT + -2.3065) * PITCH_MODEL_WEIGHT, // -8,
      (PITCH_MODEL_SHIFT + -1.1626) * PITCH_MODEL_WEIGHT, // -7,
      (PITCH_MODEL_SHIFT + -3.7312) * PITCH_MODEL_WEIGHT, // -6,
      (PITCH_MODEL_SHIFT + -0.6308) * PITCH_MODEL_WEIGHT, // -5,
      (PITCH_MODEL_SHIFT + -0.6756) * PITCH_MODEL_WEIGHT, // -4,
      (PITCH_MODEL_SHIFT + -0.3947) * PITCH_MODEL_WEIGHT, // -3,
      (PITCH_MODEL_SHIFT + -0.2396) * PITCH_MODEL_WEIGHT, // -2,
      (PITCH_MODEL_SHIFT + -1.3759) * PITCH_MODEL_WEIGHT, // -1,
      -Infinity,  // zero is handled separately. By definition it's not a note transition.
      (PITCH_MODEL_SHIFT + -1.3005) * PITCH_MODEL_WEIGHT, // 1,
      (PITCH_MODEL_SHIFT + -0.0000) * PITCH_MODEL_WEIGHT, // 2,
      (PITCH_MODEL_SHIFT + -0.3356) * PITCH_MODEL_WEIGHT, // 3,
      (PITCH_MODEL_SHIFT + -0.5968) * PITCH_MODEL_WEIGHT, // 4,
      (PITCH_MODEL_SHIFT + -0.3042) * PITCH_MODEL_WEIGHT, // 5,
      (PITCH_MODEL_SHIFT + -3.0499) * PITCH_MODEL_WEIGHT, // 6,
      (PITCH_MODEL_SHIFT + -1.2219) * PITCH_MODEL_WEIGHT, // 7,
      (PITCH_MODEL_SHIFT + -2.4878) * PITCH_MODEL_WEIGHT, // 8,
      (PITCH_MODEL_SHIFT + -2.7728) * PITCH_MODEL_WEIGHT, // 9,
      (PITCH_MODEL_SHIFT + -3.5722) * PITCH_MODEL_WEIGHT, // 10,
      (PITCH_MODEL_SHIFT + -5.1491) * PITCH_MODEL_WEIGHT, // 11,
      (PITCH_MODEL_SHIFT + -3.4140) * PITCH_MODEL_WEIGHT // 12
   ];
const ALL_OTHER_PITCH_SCORES = (PITCH_MODEL_SHIFT - 30.0) * PITCH_MODEL_WEIGHT;
const MODE_SHAPE = [
      {
         //"IONIAN",
         Tonic: 0,
         Values: [
            -1.43876953,
            -7.01400508,
            -1.95246203,
            -6.74347889,
            -1.76333675,
            -2.52819067,
            -5.69575181,
            -1.70459081,
            -6.86273411,
            -2.2076207,
            -5.49483116,
            -2.70037091
         ],
      },
      {
         //"MIXOLYDIAN",
         Tonic: 7,
         Values: [
            -1.39065988,
            -7.45051887,
            -2.13677561,
            -5.49667807,
            -2.22607878,
            -2.02268918,
            -7.52982909,
            -1.65103234,
            -6.84464903,
            -2.58212467,
            -2.20034823,
            -4.79257625
         ],
      },
      {
         //"DORIAN",
         Tonic: 2,
         Values: [
            -1.38384839,
            -7.4899516,
            -1.95404793,
            -2.41642781,
            -5.7263134,
            -2.06295956,
            -6.95161313,
            -1.76840363,
            -6.13014747,
            -3.17684153,
            -1.77617148,
            -5.87356063
         ],
      },
      {
         //"AEOLIAN",
         Tonic: 9,
         Values: [
            -1.46300289,
            -6.75307902,
            -2.11787423,
            -1.88206081,
            -5.98794674,
            -2.03410381,
            -6.1125119,
            -1.69016701,
            -3.13143494,
            -5.16651397,
            -2.15220606,
            -4.69590375
         ]
      }
   ];
const KEYS_BY_RELATIVE_MIDI = [
      { Letter: 'C', Modifier: 0 },
      { Letter: 'C', Modifier: 1 },
      { Letter: 'D', Modifier: 0 },
      { Letter: 'E', Modifier: -1 },
      { Letter: 'E', Modifier: 0 },
      { Letter: 'F', Modifier: 0 },
      { Letter: 'F', Modifier: 1 },
      { Letter: 'G', Modifier: 0 },
      { Letter: 'A', Modifier: -1 },
      { Letter: 'A', Modifier: 0 },
      { Letter: 'B', Modifier: -1 },
      { Letter: 'B', Modifier: 0 }
   ];
const KEY_TO_OFFSET = new Map([
  ['A', 0],
  ['B', 2],
  ['C', 3],
  ['D', 5],
  ['E', 7],
  ['F', 8],
  ['G', 10],
]);
const SCALE_LETTERS = "ABCDEFG";
const SCALE_MODIFIERS = [
      { TonicOffset: 0, Modifier: 0 },  //A
      { TonicOffset: 0, Modifier: 1 },  //(A)#
      { TonicOffset: 1, Modifier: 0 },  //B
      { TonicOffset: 2, Modifier: -1 }, //(C#)b
      { TonicOffset: 2, Modifier: 0 },  //C#
      { TonicOffset: 3, Modifier: 0 },  //D
      { TonicOffset: 3, Modifier: 1 },  //(D)#
      { TonicOffset: 4, Modifier: 0 },  //E
      { TonicOffset: 4, Modifier: 1 },  //(E)#
      { TonicOffset: 5, Modifier: 0 },  //F#
      { TonicOffset: 6, Modifier: -1 }, //(G#)b
      { TonicOffset: 6, Modifier: 0 }  //G#
   ];
const CIRCLE_OF_FIFTHS = "FCGDAEB";
const ACCIDENTALS = [1, 3, 6, 8, 10];

//////////////////////////////////
//TUNE SEARCH CONSTANTS
//////////////////////////////////
const QUERY_NGRAM_SIZE_CONTOUR = 4;
const FIRST_SEARCH_MAX_RESULTS = 2000;
const SECOND_SEARCH_MAX_RESULTS = 20;
const MATCH_SCORE = 2;
const MISMATCH_SCORE = -2;
const GAP_SCORE = -1;

//////////////////////////////////
//OTHER CONSTANTS
//////////////////////////////////
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
const TUNE_INDEX_URL = "https://raw.githubusercontent.com/LudovicAL/Tradify/refs/heads/main/tradify-tune-index.json";

