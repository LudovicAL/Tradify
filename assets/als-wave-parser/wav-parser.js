const WaveParser = (function(){
   function parseDataChunk(view, offset, size, bitsPerSample) {
   const int16ToFloat32 = (sample) => sample < 0 ? sample / 32768 : sample / 32767; // normalize 16 bit as in Web Audio API
   const numSamples = size / (bitsPerSample / 8);
   let samples;

   if (bitsPerSample === 8) {
      samples = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
         samples[i] = (view.getUint8(offset + i) - 128) / 128;
      }
   } else if (bitsPerSample === 16) {
      samples = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
         const intSample = view.getInt16(offset + i * 2, true);
         samples[i] = int16ToFloat32(intSample);
      }
   } else if (bitsPerSample === 32) {
      samples = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
         samples[i] = view.getFloat32(offset + i * 4, true);
      }
   } else {
      throw new Error(`Depth not supported: ${bitsPerSample} бит`);
   }

   return samples;
}
function parseWav(arrayBuffer) {
   const readString = (view, offset, length) => String.fromCharCode(...new Uint8Array(view.buffer, offset, length));
   const readUint16 = (view, offset) => view.getUint16(offset, true);
   const readUint32 = (view, offset) => view.getUint32(offset, true);
   const dataView = new DataView(arrayBuffer);
   const riff = readString(dataView, 0, 4), wave = readString(dataView, 8, 4); // Checking WAV's signature
   if (riff !== 'RIFF' || wave !== 'WAVE') throw new Error('the file is not WAV');
   let offset = 12;  // Start after 'RIFF' and 'WAVE'
   let format, numChannels, sampleRate, byteRate, blockAlign, bitsPerSample, audioData = null;

   while (offset < dataView.byteLength) {
      const chunkId = readString(dataView, offset, 4);
      const chunkSize = readUint32(dataView, offset + 4);
      offset += 8; // continue to chunk's data

      if (chunkId === 'fmt ') {
         format = readUint16(dataView, offset);
         numChannels = readUint16(dataView, offset + 2);
         sampleRate = readUint32(dataView, offset + 4);
         byteRate = readUint32(dataView, offset + 8);
         blockAlign = readUint16(dataView, offset + 12);
         bitsPerSample = readUint16(dataView, offset + 14);
      } else if (chunkId === 'data') {
         audioData = parseDataChunk(dataView, offset, chunkSize, bitsPerSample);
      }

      offset += chunkSize; // continue to next chunk
   }
   return { format, audioData, numChannels, sampleRate, byteRate, blockAlign, bitsPerSample };
}
function splitChannels(samples, numChannels) {
   const channelData = Array.from({ length: numChannels }, () => []);
   for (let i = 0; i < samples.length; i++) {
      channelData[i % numChannels].push(samples[i]);
   }
   return channelData;
}
function toWavBuffer({ numChannels, sampleRate, bitsPerSample, format, byteRate, blockAlign,samples }) {
   const mergedSamples = mergeChannels(samples);
   const numSamples = mergedSamples.length;

   const dataChunkSize = numSamples * (bitsPerSample / 8);
   const fileSize = 44 + dataChunkSize;
   const buffer = new ArrayBuffer(fileSize);
   const view = new DataView(buffer);

   let offset = 0;
   const writeString = (str) => {
       for (let i = 0; i < str.length; i++) {
           view.setUint8(offset + i, str.charCodeAt(i));
       }
       offset += str.length;
   };

   const writeUint32 = (value) => { view.setUint32(offset, value, true); offset += 4; };
   const writeUint16 = (value) => { view.setUint16(offset, value, true); offset += 2; };

   // RIFF chunk
   writeString("RIFF"); // ChunkID
   writeUint32(fileSize - 8); // ChunkSize
   writeString("WAVE"); // Format

   // fmt chunk
   writeString("fmt "); // Subchunk1ID
   writeUint32(16); // Subchunk1Size (16 bytes for PCM)
   writeUint16(format === 'PCM' ? 1 : 3); // AudioFormat (1 = PCM, 3 = Float)
   writeUint16(numChannels); // NumChannels
   writeUint32(sampleRate); // SampleRate
   writeUint32(byteRate); // ByteRate
   writeUint16(blockAlign); // BlockAlign
   writeUint16(bitsPerSample); // BitsPerSample

   // data chunk
   writeString("data"); // Subchunk2ID
   writeUint32(dataChunkSize); // Subchunk2Size

   const normalizeFloat32 = (sample) => Math.max(-1, Math.min(1, sample));

   for (let i = 0; i < numSamples; i++) {
       let sample = normalizeFloat32(mergedSamples[i]);
       if (bitsPerSample === 8) view.setUint8(offset, (sample * 127) + 128);
       else if (bitsPerSample === 16) view.setInt16(offset, sample * 32767, true);
       else if (bitsPerSample === 32) view.setFloat32(offset, sample, true);
       offset += bitsPerSample / 8;
   }

   return buffer;
}
function mergeChannels(channels) {
   const numSamples = channels[0].length;
   const numChannels = channels.length
   const mergedSamples = new Float32Array(numSamples * numChannels);

   for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
         mergedSamples[i * numChannels + ch] = channels[ch][i];
      }
   }
   return mergedSamples;
}
class WaveParser {
	static mergeChannels = mergeChannels
	static parseWav = parseWav
	static splitChannels = splitChannels
	static toWavBuffer = toWavBuffer
	constructor(arrayBuffer) {
		const { format, audioData, numChannels, sampleRate, byteRate, blockAlign, bitsPerSample } = parseWav(arrayBuffer);
		this.byteRate = byteRate;
		this.blockAlign = blockAlign;
		this.bitsPerSample = bitsPerSample;
		this.format = format === 1 ? 'PCM' : `Compressed (${format})`;
		this.samples = splitChannels(audioData, numChannels);
		this.numChannels = numChannels;
		this.sampleRate = sampleRate;
		this.duration = this.samples[0].length / sampleRate;
		this.timeInterval = this.duration / this.samples[0].length;
	}

	mergeChannels() { return WaveParser.mergeChannels(this.samples) }
	toWavBuffer() { return toWavBuffer(this) }
}
   return WaveParser
})()