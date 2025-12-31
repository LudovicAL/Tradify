var interpolationIndices = null;

/*
This function is the gateway to audio processing.
It works by:
1- Applying the Fast Fourier Transform algorithm to the data
2- Eliminating noise by keeping only frequencies of peek intensity
3- Eliminating short burst of sound, keeping only longer burst
*/
function startProcessing(onFinishedProcessing, recordingResult) {
   console.log("Started: Audio processing");
   //Applying a the Fast Fourier Transform algorithm to the data
   let windowFrameArray = computeWindowFrame(recordingResult.audioSampleArray, recordingResult.sampleRate);
   //Eliminating noise by keeping only frequencies of peek intensity
   let latticeArray = computeLattice(windowFrameArray);
   //Eliminating short burst of sound, keeping only longer burst
   let contourString = computeContour(windowFrameArray, latticeArray, recordingResult.sampleRate);
   console.log("   ContourString:\n", contourString);
   if (DEBUG_MODE) {
      let contour = contourStringToContour(contourString);
      let abc = contourToAbc(contour);
      console.log("   Abc:\n" + abc);
   }
   console.log("Finished: Audio processing");
   onFinishedProcessing({ contourString: contourString, recordingNumber: recordingResult.recordingNumber });
}

function computeWindowFrame(audioSampleArray, sampleRate) {
   console.log("   Started: Window frame computing");
   let windowFrameArray = new Array(audioSampleArray.length);
   for (let i = 0, max = audioSampleArray.length; i < max; i++) {
      windowFrameArray[i] = processAudioSample(audioSampleArray[i], sampleRate);
   }
   if (DEBUG_MODE) {
      drawArrayOfArraysOnCanvas("signalCanvas", windowFrameArray, windowFrameArray.length, MIDI_NUM);
   }
   console.log("   Finished: Window frame computing");
   return windowFrameArray;
}

function processAudioSample(audioSample, sampleRate) {
   //Apply Blackman Window Function
   let blackmanWindow = getBlackmanWindow();
   for (let i = 0; i < WINDOW_SIZE; i++) {
      audioSample[i] *= blackmanWindow[i];
   }
   
   //Apply Fast Fourier Transform (FFT)
   let fftSignal = {'real': new Array(WINDOW_SIZE)};
   for (let i = 0; i < WINDOW_SIZE; i++) {
      fftSignal.real[i] = audioSample[i]; //Using this library: https://www.jsdelivr.com/package/npm/fftjs
   }
   let fftResult1 = fft(fftSignal);
   
   //Compute K value
   for (let i = 0; i < WINDOW_SIZE; i++) {
      fftResult1.real[i] = Math.pow((Math.pow(fftResult1.real[i], 2) + Math.pow(fftResult1.imag[i], 2)), 1.0/6.0);
      fftResult1.imag[i] = 0.0;
   }

   //Apply Fast Fourier Transform (FFT)
   let fftResult2 = fft(fftResult1); //Using this library: https://www.jsdelivr.com/package/npm/fftjs
   
   //Apply peak pruning
   for (let i = 0; i < WINDOW_SIZE; i++) {
      fftResult2.real[i] = Math.max(0, fftResult2.real[i]);
   }
   
   //Use linear interpolation to find the energy at the frequencies of each of the MIDI notes in the range of MIDI values this app uses.
   if (!interpolationIndices) {
      computeInterpolationIndices(sampleRate);
   }
   let windowFrame = Array(MIDI_NUM).fill(0);
   for (let i = 0; i < BINS_NUM; i++) {
      let highWaveletTransform = interpolationIndices[i].hi_weight;
      let lowWaveletTransform = interpolationIndices[i].lo_weight;
      let highAlternatingCurrent = fftResult2.real[interpolationIndices[i].hi_index];
      let lowAlternatingCurrent = fftResult2.real[interpolationIndices[i].hi_index - 1];
      let feature = highWaveletTransform * highAlternatingCurrent + lowWaveletTransform * lowAlternatingCurrent;
      windowFrame[Math.trunc(i / BINS_PER_MIDI)] += feature;
   }
   
   //Fix octaves
   for (let i = 0; i < 12; i++) {
      let ind = i;
      let inds = [];
      let shouldShift = [];
      while (ind < (windowFrame.length - 12)) {
         shouldShift.push(windowFrame[ind + 12] > windowFrame[ind]);
         inds.push(ind);
         ind += 12;
      }
      for (let j = 0, max = shouldShift.length; j < max; j++) {
         if (shouldShift[j]) {
            windowFrame[inds[j] + 12] += windowFrame[inds[j]];
            windowFrame[inds[j]] = 0;
         }
      }
   }
   
   //Apply noise filtering
   let sortedWindowFrame = windowFrame.slice().sort((a, b) => b - a);
   let threshold = sortedWindowFrame[4];
   for (let i = 0, max = windowFrame.length; i < max; i++) {
      if (windowFrame[i] < threshold) {
         windowFrame[i] = 0;
      }
   }
   return windowFrame;
}

function computeInterpolationIndices(sampleRate) {
   let acBinMidis = new Array(HALF_WINDOW_SIZE);
   for (let i = 0; i < HALF_WINDOW_SIZE; i++) {
      let acFrequency = sampleRate / (i + 1);
      let acMidi = 69 + (12 * Math.log2(acFrequency / 440)); //Formula for hertz to Midi
      acBinMidis[i] = acMidi;
   }
   if (acBinMidis[0] < MIDI_HIGH || acBinMidis[HALF_WINDOW_SIZE - 1] > MIDI_LOW) {
      alert("Spectrogram range is insufficient. Has an invalid sample rate been used?");
      throw "Spectrogram range is insufficient. Has an invalid sample rate been used?";
   }
   interpolationIndices = new Array(BINS_NUM);
   //Compute lowest MIDI value
   let edge = Math.floor(BINS_PER_MIDI / 2) / BINS_PER_MIDI;
   let lowMidi = MIDI_LOW - edge;
   let binWidth = 1 / BINS_PER_MIDI;
   for (let i = 0; i < BINS_NUM; i++) {
      let binMidi = lowMidi + i * binWidth;
      let hi = 1;
      for (let j = 0; j < HALF_WINDOW_SIZE; j++) {
         if (binMidi > acBinMidis[j + 1]) {
            hi = 1 + j;
            break;
         }
      }
      let delta = acBinMidis[hi - 1] - acBinMidis[hi];
      let w1 = (acBinMidis[hi - 1] - binMidi) / delta;
      let w2 = -(acBinMidis[hi] - binMidi) / delta;
      if (w1 > 1 || w1 < 0 || w2 > 1 || w2 < 0) {
         alert("Invalid x1: " + w1 + ", x2: " + w2);
         throw "Invalid x1: " + w1 + ", x2: " + w2;
      }
      interpolationIndices[i] = { hi_weight: w1, lo_weight: w2, hi_index: (hi + 1) };      
   }
}

function computeLattice(windowFrameArray) {
   console.log("   Started: Lattice computing");
   //Compute energy by frame
   let energyByFrameArray = new Array(windowFrameArray.length);
   let totalEnergy = 0;
   for (let i = 0, max = windowFrameArray.length; i < max; i++) {
      let frameTotalEnergy = 0;
      for (let j = 0; j < MIDI_NUM; j++) {
         frameTotalEnergy += windowFrameArray[i][j];
      }
      energyByFrameArray[i] = frameTotalEnergy;
      totalEnergy += frameTotalEnergy;
   }
   if (totalEnergy === 0) {
      alert("Cannot decode complete silence!");
      throw "Cannot decode complete silence!";
   }
   //Normalise data
   let normal = windowFrameArray.length / totalEnergy;
   for (let i = 0, max = windowFrameArray.length; i < max; i++) {
      for (let j = 0; j < MIDI_NUM; j++) {
         windowFrameArray[i][j] *= normal; 
      }
   }
   //Retain only the optimal path from the start to each pitch
   let latticeScoreArray = new Array(windowFrameArray.length);
   latticeScoreArray[0] = windowFrameArray[0];
   for (let i = 1, max = windowFrameArray.length; i < max; i++) {
      let nextScoreArray = new Array(MIDI_NUM).fill(-Infinity);
      for (let j = 0; j < MIDI_NUM; j++) {
         for (let k = 0; k < MIDI_NUM; k++) {
            let interval = j - k;
            let intervalScore = getIntervalScore(interval);
            let energyScore = windowFrameArray[i][j];
            let carryScore = latticeScoreArray[i - 1][k];
            let proposedScore = carryScore + intervalScore + energyScore;
            if (proposedScore > nextScoreArray[j]) {
               nextScoreArray[j] = proposedScore;
            }
         }
      }
      latticeScoreArray[i] = nextScoreArray;
   }
   //Retrace through lattice
   let latticePathBacktraceArray = new Array(windowFrameArray.length);
   for (let i = 0, max = windowFrameArray.length; i < max; i++) {
      let maxScore = Math.max(...latticeScoreArray[i]);
      latticePathBacktraceArray[i] = latticeScoreArray[i].indexOf(maxScore);
   }
   if (DEBUG_MODE) {
      drawArrayOnCanvas("latticeCanvas", latticePathBacktraceArray, 2);
   }
   console.log("   Finished: Lattice computing");
   return latticePathBacktraceArray;
}

function getIntervalScore(interval) {
   if (interval === 0) {
      return BASE_ENERGY_SCORE;
   }
   let index = interval + 12;
   if (PITCH_MODEL_SCORE_ARRAY.length > index) {
      return PITCH_MODEL_SCORE_ARRAY[index];
   } else {
      return ALL_OTHER_PITCH_SCORES;
   }
}

function computeContour(windowFrameArray, latticeArray, sampleRate) {
   console.log("   Started: Contour computing");
   //Compute notes from lattice
   if (latticeArray.length === 0) {
      alert("Computing an empty lattice is impossible.");
      throw "Computing an empty lattice is impossible.";
   }
   let noteArray = [];
   let prev_pitch = latticeIndiceToPich(latticeArray[0]);
   let prev_dur = 1;
   let prev_energy = 0.0;
   for (let i = 0, max = latticeArray.length; i < max; i++) {
      let pitch = latticeIndiceToPich(latticeArray[i]);
      if (pitch === prev_pitch) {
         prev_dur += 1;
         prev_energy += windowFrameArray[i][latticeArray[i]];
      } else {
         noteArray.push({ pitch: prev_pitch, duration: prev_dur, power: (prev_energy / prev_dur) });
         prev_pitch = pitch;
         prev_dur = 1;
         prev_energy = windowFrameArray[i][latticeArray[i]];
      }
   }
   //Compute contour from notes
   for (let i = (noteArray.length - 1); i >= 0; i--) {
      if (noteArray[i].power <= MIN_NOTE_POWER || noteArray[i].duraction < MIN_NOTE_DURATION) {
         noteArray.splice(i, 1);
      }
   }
   if (noteArray.length <= 3) {
      return "";
   }
   let bestTempoLowBmp = LOW_BPM;
   let bestTempoScore = -Infinity;
   let bestTempoQuantisedNoteArray = null;
   for (let i = LOW_BPM; i < HIGH_BPM; i += 5) {
      let framesPerQuaver = bpmToNumFrame(i, sampleRate);
      let quantisedNotesArray = quantiseNotes(noteArray, framesPerQuaver);
      let score = scoreQuantisedNotes(quantisedNotesArray, noteArray, framesPerQuaver);
      if (score > bestTempoScore) {
         bestTempoLowBmp = i;
         bestTempoScore = score;
         bestTempoQuantisedNoteArray = quantisedNotesArray;
      }
   }
   let bestQuantisedNotesArray = bestTempoQuantisedNoteArray;
   let contourArray = [];
   for (let i = 0, max = bestQuantisedNotesArray.length; i < max; i++) {
      for(let j = 0, max = bestQuantisedNotesArray[i].quavers_quant; j < max; j++) {
         contourArray.push(bestQuantisedNotesArray[i].pitch);         
      }
   }
   //Correct contour octave
   let contourArrayClone = [...contourArray];
   contourArrayClone.sort();
   let decisionIndex = Math.round(contourArrayClone.length * (1.0 - SHRILL_THRESHOLD_ENERGY));
   if (contourArrayClone[decisionIndex] >= SHRILL_THRESHOLD_PITCH) {
      for (let i = 0, max = contourArray.length; i < max; i++) {
         if (contourArray[i] > (MIDI_LOW + 12)) {
            contourArray[i] -= 12;
         }
      }
   }
   //Convert contour to contour string
   let contourStringArray = new Array(contourArray.length);
   for (let i = 0, max = contourArray.length; i < max; i++) {
      contourStringArray[i] = CONTOUR_TO_QUERY_CHAR[(contourArray[i] - MIDI_LOW)];
   }
   if (DEBUG_MODE) {
      drawArrayOnCanvas("contourCanvas", contourArray, 10);
   }
   let contourString = contourStringArray.join("");
   console.log("   Finished: Contour computing");
   return contourString;
}

function latticeIndiceToPich(latticeIndice) {
   return MIDI_LOW + latticeIndice;
}

function bpmToNumFrame(bpm, sampleRate) {
   let bps = bpm / 60.0;
   let quaversPerSecond = bps * 2.0;
   let framesPerSecond = sampleRate / WINDOW_SIZE;
   return framesPerSecond / quaversPerSecond;
}

function quantiseNotes(noteArray, framesPerQuaver) {
   let quantisedNotesArray = new Array(noteArray.length);
   for (let i = 0, max = noteArray.length; i < max; i++) {
      let exactQuavers = noteArray[i].duration / framesPerQuaver;
      let quantQuavers = 0;
      if (exactQuavers > MIN_NOTE_DURATION_REL) {
         quantQuavers = Math.max(1.0, Math.round(exactQuavers));
      }
      quantisedNotesArray[i] = { pitch: noteArray[i].pitch, quavers_exact: exactQuavers, quavers_quant: quantQuavers, power: noteArray[i].power };
   }
   if (quantisedNotesArray.length === 0) {
      alert("Error while quantising notes.");
      throw "Error while quantising notes.";
   }
   return quantisedNotesArray;
}

function scoreQuantisedNotes(quantisedNotesArray, noteArray, framesPerQuaver) {
   //Compute number of frames
   let numInputFrames = 0.0;
   for (let i = 0, max = noteArray.length; i < max; i++) {
      numInputFrames += noteArray[i].duration;
   }
   //Compute quantisation error and probability model score
   let quantError = 0.0;
   let probabilityModelScore = 0.0;
   for (let i = 0, max = quantisedNotesArray.length; i < max; i++) {
      quantError += Math.abs(quantisedNotesArray[i].quavers_exact - quantisedNotesArray[i].quavers_quant) * quantisedNotesArray[i].power;
      probabilityModelScore += 3.0 - 0.5 * quantisedNotesArray[i].quavers_quant;
   }
   //Normalise by number of quantised quavers
   probabilityModelScore /= quantisedNotesArray.length;
   //Normalise score
   let quantScore = 1.0 - quantError * framesPerQuaver / numInputFrames;
   //Return result
   return probabilityModelScore * quantScore;
}