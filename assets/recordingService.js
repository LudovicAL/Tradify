let audioContext = null;
var micProcessor = null;
var micStream = null;
var micSource = null;
var sampleRate = null;
var audioSampleArray = null;

async function startImporting() {
   console.log("Started: Start Importing");
   audioSampleArray = [];
   let rawSampleArray = [];
   const response = await fetch("https://cdn.jumpshare.com/download/05PzMwKsyucve8jSFgqK6DpTXc0icSz9a00bMaWtNRHJLKhMchko-yD_DKZLoXW8wW4nLJnMZXWyf93dZdxz5ab5RW6_a-qVqU5Z46JHJVg");
   const arrayBuffer = await response.arrayBuffer();
   const waveParser = new WaveParser(arrayBuffer);
   let dataLength = waveParser.samples[0].length + waveParser.samples[1].length;
   let numWindows = Math.floor(dataLength / WINDOW_SIZE);
   let lastIndice = numWindows * WINDOW_SIZE;
   for (let i = 0; i < numWindows; i++) {
      let windowArray = [];
      for (let j = (i * (WINDOW_SIZE / 2)), max = Math.min((dataLength / 2), (((i + 1) * WINDOW_SIZE) / 2)); j < max; j++) {
         windowArray.push(waveParser.samples[0][j]);
         windowArray.push(waveParser.samples[1][j]);
      }
      audioSampleArray.push(windowArray);
   }
   processAudioSampleArray(audioSampleArray, waveParser.sampleRate);
   console.log("Finished: Start Importing");
}

async function startRecording() {
   console.log("Started: Start Recording");
   if (!navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      stopRecording();
      alert('Missing support for navigator.mediaDevices.getUserMedia');
      throw 'Missing support for navigator.mediaDevices.getUserMedia';
   }
   
   try {
      micStream = await navigator.mediaDevices.getUserMedia(USER_MEDIA_CONSTRAINTS);
   } catch (e) {
      stopRecording();
      alert('Error while initializing micStream.');
      throw 'Error while initializing micStream.';
   }
   
   audioSampleArray = [];
   
   audioContext = new (window.AudioContext || window.webkitAudioContext)();
   
   micProcessor = audioContext.createScriptProcessor(WINDOW_SIZE, 1, 1);
   micProcessor.onaudioprocess = function(audioProcessingEvent) {
      audioSampleArray.push(audioProcessingEvent.inputBuffer.getChannelData(0).slice());
   };
   
   micSource = audioContext.createMediaStreamSource(micStream);
   micSource.connect(micProcessor);
   micProcessor.connect(audioContext.destination);
   
   console.log("Finished: Start recording");
   try {
      sampleRate = audioContext.sampleRate;
      console.log(`Using microphone sample rate ${sampleRate}`);
   } catch (e) {
      stopRecording();
      alert('Could not retrieve sample rate.');
      throw 'Could not retrieve sample rate.';
   }
}

async function stopRecording() {
   console.log("Started: Stop recording");
   let sampleRate = audioContext.sampleRate;
   if (micProcessor) {
      micProcessor.disconnect();
      micProcessor = null;
   }
   if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
      micStream = null;
   }
   if (this.audioContext) {
      await audioContext.close();
      audioContext = null;
   }
   console.log("Finished: Stop recording");
   if (audioSampleArray.length > 10) {
      processAudioSampleArray(audioSampleArray, sampleRate);
   } else {
      alert('Not enough audio was recorded. Record longer.');
      throw 'Not enough audio was recorded. Record longer.';
   }
}
