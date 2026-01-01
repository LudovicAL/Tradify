let audioContext = null;
var micProcessor = null;
var micStream = null;
var micSource = null;
var sampleRate = null;
var audioSampleArray = null;

async function startRecording(onFinishedRecording, tuneSearch) {
   console.log("Started: Start Recording");
   audioSampleArray = [];
   if (!navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      let errorMessage = getTranslation("userMediaNotSupported", "Votre navigateur n'a pas les fonctionnalités requises. Veuillez changer de navigateur.");
      alert(errorMessage);
      console.log(errorMessage);
      return;
   }
   try {
      micStream = await navigator.mediaDevices.getUserMedia(USER_MEDIA_CONSTRAINTS);
   } catch (e) {
      let errorMessage = getTranslation("userMediaNotSupported", "Votre navigateur n'a pas les fonctionnalités requises. Veuillez changer de navigateur.");
      alert(errorMessage);
      console.log(errorMessage);
      return;
   }
   audioContext = new (window.AudioContext || window.webkitAudioContext)();
   micProcessor = audioContext.createScriptProcessor(WINDOW_SIZE, 1, 1);
   micProcessor.onaudioprocess = function(audioProcessingEvent) {
      audioSampleArray.push(audioProcessingEvent.inputBuffer.getChannelData(0).slice());
   };
   micSource = audioContext.createMediaStreamSource(micStream);
   micSource.connect(micProcessor);
   micProcessor.connect(audioContext.destination);
   setTimeout(() => {
      onFinishedRecording(tuneSearch);
   }, RECORDING_TIME_LIMIT_MS);
   clearTable();
   jitterButton();
   console.log("Finished: Start recording");
}

async function stopRecording(tuneSearch) {
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
   tuneSearch.setAudioSampleArray(audioSampleArray);
   tuneSearch.setSampleRate(sampleRate);
   console.log("Finished: Stop recording");
   return tuneSearch;
}
