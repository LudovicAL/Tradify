function contourStringToContour(contourString) {
   console.log("Started: Converting contour-string to contour");
   let contourArray = [];
   for (let i = 0, max = contourString.length; i < max; i++) {
      contourArray.push(CONTOUR_TO_QUERY_CHAR.indexOf(contourString[i]) + MIDI_LOW);
   }
   console.log("Finished: Converting contour-string to contour");
   return contourArray;
}

function contourToAbc(contourArray) {
   console.log("Started: Converting contour to abc");
   //Compute midi durations
   let contourWithDurationArray = [];
   let duration = 0;
   let lastPitch = contourArray[0];
   for (let i = 0, max = contourArray.length; i < max; i++) {
      if (contourArray[i] !== lastPitch || duration >= 4) {
         contourWithDurationArray.push({ Pitch: lastPitch, Duration: duration });
         duration = 1;
      } else {
         duration += 1;
      }
      lastPitch = contourArray[i];
   }
   contourWithDurationArray.push({ Pitch: lastPitch, Duration: duration });
   //Auto-detect the key / mode based on the pitches in the contour
   let keyAndMode = contourToKeyAndMode(contourArray);
   let relativeMajor = getRelativeMajor(keyAndMode);
   let abcVocabulary = getAbcVocabulary(relativeMajor);
   //Convert to ABC notation
   let activeModifiers = new Map();
   let bar = []
   let bars = []
   for (let i = 0, max = contourWithDurationArray.length; i < max; i++) {
      if (bar.length === 4) {
         bar.push(" ");
      }
      if (bar.length >= 9) {
         bars.push(bar.join(""));
         activeModifiers = new Map();
         bar = [];
      }
      let abcNote = abcVocabulary.get(contourWithDurationArray[i].Pitch);
      let durationStr = "";
      if (contourWithDurationArray[i].Duration >= 2) {
         durationStr = contourWithDurationArray[i].Duration.toString();
      }
      let unmodifiedNote = getLetterAbc(abcNote);
      let noteIsModified = activeModifiers.has(unmodifiedNote);
      let modifierLookup = null;
      let modifierIsCorrect = false;
      if (noteIsModified) {
         modifierLookup = activeModifiers.get(unmodifiedNote);
         modifierIsCorrect = modifierLookup === abcNote.Modifier;
      }
      let condition1 = !noteIsModified && isAccidental(relativeMajor, contourWithDurationArray[i].Pitch);
      let condition2 = noteIsModified && !modifierIsCorrect;
      let useModifier = condition1 || condition2;
      if (useModifier) {
         activeModifiers.set(unmodifiedNote, abcNote.Modifier);
      }
      let noteStr = getAsAbc(abcNote, useModifier);
      bar.push(noteStr + durationStr);
   }
   if (bar.length > 0) {
      bars.push(bar.join(""));
   }
   let outputAbc = "K:" + getKeyAsAbc(keyAndMode.Key) + getModeAsAbc(keyAndMode.Mode) + "\n";
   let barsOnLine = 0;
   for (let i = 0, max = bars.length; i < max; i++) {
      if (barsOnLine >= 4) {
         outputAbc += "\n";
         barsOnLine = 0;
      }
      outputAbc += bars[i];
      outputAbc += " |";
      barsOnLine += 1;
   }
   console.log("Finished: Converting contour to abc");
   return outputAbc;
}

function contourToKeyAndMode(contourArray) {
   let shapeQueryArray = new Array(12).fill(0.0);
   for (let i = 0, max = contourArray.length; i < max; i++) {
      shapeQueryArray[getEuclidianRemainder(contourArray[i], 12)] += 1.0
   }
   for (let i = 0, max = shapeQueryArray.length; i < max; i++) {
      shapeQueryArray.push(shapeQueryArray[i]);
   }
   let highScore = -Infinity;
   let highMode = null;
   let highKey = null;
   let slidingWindowSize = 12;
   for (let i = 0, maxI = (shapeQueryArray.length - slidingWindowSize); i < maxI; i++) {
      for (let j = 0, maxJ = MODE_SHAPE.length; j < maxJ; j++) {
         let score = 0;
         for (let k = 0, maxK = MODE_SHAPE[j].Values.length; k < maxK; k++) {
            score += MODE_SHAPE[j].Values[k] * shapeQueryArray[i + k];
         }
         if (score > highScore) {
            highScore = score;
            highMode = MODE_SHAPE[j].Tonic;
            highKey = KEYS_BY_RELATIVE_MIDI[i];
         }
      }
   }
   return { Key: highKey, Mode: highMode };
}

function getRelativeMajor(keyAndMode) {
   let relativeMidi = Math.floor(getRelativeMidi(keyAndMode.Key)) - keyAndMode.Mode;
   return KEYS_BY_RELATIVE_MIDI[getEuclidianRemainder(relativeMidi, (12))];
}

function getRelativeMidi(key) {
   let relativeMidi = 69 + key.Modifier + KEY_TO_OFFSET.get(key.Letter);
   return getEuclidianRemainder(relativeMidi, 12);
}

function getEuclidianRemainder(value, modulo) {
   return Math.floor(((value % modulo) + modulo) % modulo)
}

function getAbcVocabulary(key) {
   let keySignature = getMajorKeySignature(key);
   let chromaticScale = [];
   let letterOffset = SCALE_LETTERS.indexOf(key.Letter);
   for (let i = 0, max = SCALE_MODIFIERS.length; i < max; i++) {
      let offset = letterOffset + SCALE_MODIFIERS[i].TonicOffset;
      offset %= SCALE_LETTERS.length;
      let letter = SCALE_LETTERS[offset];
      chromaticScale.push({ Letter: letter, Modifier: (keySignature.get(letter) + SCALE_MODIFIERS[i].Modifier) });
   }
   //Build our vocabulary for this key, for one arbitrary octave.
   let abcVocabOneOctave = new Map();
   for (let i = 0, max = chromaticScale.length; i < max; i++) {
      abcVocabOneOctave.set(getRelativeMidi(chromaticScale[i]), chromaticScale[i]);
   }
   // Expand the one octave vocubulary all octaves.
   let abcVocabulary = new Map();
   for (let i = MIDI_LOW; i <= MIDI_HIGH; i++) {
      let octave = Math.floor((i / 12) - 1);
      let relativeMidi = getEuclidianRemainder(i, 12);
      let key = abcVocabOneOctave.get(relativeMidi);
      abcVocabulary.set(i, { Letter: key.Letter, Modifier: key.Modifier, Octave: octave });
   }
   return abcVocabulary;
}

function getMajorKeySignature(key) {
   let baseKeySignature = new Map();
   // Initialise key signature as F major
   baseKeySignature.set("B", -1);
   let numStepsFromF = CIRCLE_OF_FIFTHS.indexOf(key.Letter);
   let modifierPtr = 6;
   for (let i = 0; i < numStepsFromF; i++) {
      let letterToModify = CIRCLE_OF_FIFTHS[modifierPtr % 7];
      if (baseKeySignature.has(letterToModify)) {
         baseKeySignature.set(letterToModify, baseKeySignature.get(letterToModify) + 1);
      } else {
         baseKeySignature.set(letterToModify, 1);         
      }
      modifierPtr += 1;
   }
   for (let i = 0, max = CIRCLE_OF_FIFTHS.length; i < max; i++) {
      if (baseKeySignature.has(CIRCLE_OF_FIFTHS[i])) {
         baseKeySignature.set(CIRCLE_OF_FIFTHS[i], baseKeySignature.get(CIRCLE_OF_FIFTHS[i]) + key.Modifier);
      } else {
         baseKeySignature.set(CIRCLE_OF_FIFTHS[i], key.Modifier);
      }
   }
   return baseKeySignature;
}

function getLetterAbc(abcNote) {
   if (abcNote.Octave >= 5) {
      return abcNote.Letter.toLowerCase();
   } else {
      return abcNote.Letter.toUpperCase();
   }
}

function getOctaveAbc(abcNote) {
   if (abcNote.Octave >= 6) {
      return "'".repeat(Math.abs(abcNote.Octave - 5));
   } else if (abcNote.Octave <= 3) {
      return ",".repeat(Math.abs(4 - abcNote.Octave));
   } else {
      return "";
   }
}

//Checks if a pitch is an accidental note in the major mode of a key.
function isAccidental(relativeMajor, pitch) {
   let tonicOffset = getEuclidianRemainder(pitch - getRelativeMidi(relativeMajor), 12);
   return ACCIDENTALS.includes(tonicOffset);
}

function getAsAbc(abcNote, useModifier) {
   let modifier = "";
   if (useModifier) {
      modifier = getModifierAbc(abcNote);
   }
   let letter = getLetterAbc(abcNote);
   let octave = getOctaveAbc(abcNote);
   return (modifier + letter + octave);
}

function getModifierAbc(abcNote) {
   let modifierStr = "=";
   if (abcNote.Modifier > 0) {
      modifierStr = "^".repeat(abcNote.Modifier);
   } else if (abcNote.Modifier < 0) {
      modifierStr = "_".repeat(Math.abs(abcNote.Modifier));
   }
   return modifierStr;
}

function getKeyAsAbc(key) {
   switch (key.Mode) {
      case -1:
         return key.Letter + "b";
      case 1:
         return key.Letter + "#";
      default:
         return key.Letter;
   }
}

function getModeAsAbc(mode) {
   switch (mode) {
      case 0: //Ionian
         return "maj";
      case 2: //Dorian
         return "dor";
      case 7: //Mixolydian
         return "mix";
      case 9: //Aeolian
         return "min";
      default:
         return "";
   }
}
