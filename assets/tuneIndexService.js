/**
 * The tune index is a database in the form of a json object.
 * It contains the informations on availables tunes (their id, contour, abc, ...).
 * As to not overwhelm the server with repetitive pulls, it is cached on the client side
 * and updated only every 28 days (provided the client has internet access).
 */
var tuneIndex;

/**
 * Fetches the tune index from the server.
 * This function is automatically called on page load. 
 */
async function loadTuneIndex() {
   console.log("Started: Tune index retrieval");
   tuneIndex = await fetchJsonFile(TUNE_INDEX_URL, "tuneIndex", 28);
   console.log("Finished: Tune index retrieval");
}

/**
 * Displays on the screen the result of a search.
 *
 * @param {Function} onFinishedDisplaying The callback function to call when this method is finished executing.
 * @param {TuneSearch} tuneSearch An object containing the details of the current search.
 */
function startSearching(onFinishedSearching, tuneSearch) {
   console.log("Started: Tune index searching");
   let secondSearchResult = [];
   if (tuneSearch.contourString.length > 0) {
      let firstSearchResult = performFirstSearch(tuneSearch.contourString);
      secondSearchResult = performSecondSearch(tuneSearch.contourString, firstSearchResult);
   }
   tuneSearch.setRankedTunes(secondSearchResult);
   console.log("Finished: Tune index searching");
   onFinishedSearching(tuneSearch);
}

/**
 * Searches the database for a list of good matches to the audio that was submitted.
 * This first search is fast, but inaccurate.
 * It is good for eliminating many poor candidates.
 * The algorithm it uses is called Aho-Corasick.
 * To use it, one must first slice the contour string into small blocks we'll call nGrams.
 * These nGrams are used to construct a new AhoCorasick object.
 * The AhoCorasick object having been constructed, it can be used to score every tune of the database.
 * The scored tunes are sorted, and then truncated so that only a subset of the best matches it kept.
 *
 * @param {String} contourString A string representing the 'Contour' of the submitted audio.
 * @param {List(Object)} A list of the tunes that best match the Contour sorted by their scores. This list could be empty.
 */
function performFirstSearch(contourString) {
   console.log("   Started: First search");
   //Slice the input into nGrams
   let nGramArray = [];
   for (let i = 0, max = (contourString.length - QUERY_NGRAM_SIZE_CONTOUR + 1); i < max; i++) {
      nGramArray.push(contourString.substring(i, i + QUERY_NGRAM_SIZE_CONTOUR));
   }
   //Execute the Aho-Corasick algorithm
   let rankedTuneArray = [];
   let ac = new AhoCorasick(nGramArray);
   Object.values(tuneIndex).forEach(tune => {
      let score = ac.search(tune.contour);
      if (score > 0) {
         rankedTuneArray.push({ tune_id: tune.tune_id, score: score });
      }
   });
   //Sort and truncate the results
   rankedTuneArray.sort((a, b) => b.score - a.score);
   let slicedTuneArray = rankedTuneArray.slice(0, FIRST_SEARCH_MAX_RESULTS);
   console.log("   Finished: First search");
   return slicedTuneArray;
}

/**
 * Searches the database for the best matches to the audio that was submitted, among an already filtered list of matches.
 * This second search is slow, but accurate.
 * The algorithm it uses is called Needleman-Wunsch.
 *
 * @param {String} contourString A string representing the 'Contour' of the submitted audio.
 * @param {List<Object>} firstSearchResult An already filtered list of matches to the contourString.
 */
function performSecondSearch(contourString, firstSearchResult) {
   console.log("   Started: Second search");
   let rankedTuneArray = [];
   let contourStringLength = contourString.length;
   for (const searchResult of firstSearchResult) {
      //Apply the Needleman-Wunsch algorithm
      let a = null;
      let b = null;
      //Swap a and b such that b is always longer than a
      let tuneIndexTune = tuneIndex[searchResult.tune_id]
      if (contourStringLength > tuneIndexTune.contour.length) {
         b = contourString;
         a = tuneIndexTune.contour;
      } else {
         a = contourString;
         b = tuneIndexTune.contour;
      }
      //Build a matrix organized as follow:
      //       a1 a2 a3 .. aN
      //    b1
      //    b2
      //    b3
      //    ..
      //    bN
      let lastRow = new Array(a.length + 1).fill(0);
      let lastColumnIndex = a.length;
      for (let row of b) {
         let previousDiagonal = 0;
         for (let col = 1, maxCol = lastRow.length; col < maxCol; col++) {
            let currentDiagonal = previousDiagonal;
            previousDiagonal = lastRow[col];
            lastRow[col] = Math.max(
                  currentDiagonal + ((a[col-1] === row) ? MATCH_SCORE : MISMATCH_SCORE),
                  Math.max(
                     lastRow[col - 1] + GAP_SCORE, 
                     lastRow[col] + GAP_SCORE
                  )
               );
            lastRow[lastColumnIndex] = Math.max(lastRow[lastColumnIndex], previousDiagonal);
         }
      }
      let highscore = Math.max(...lastRow);
      rankedTuneArray.push({ tune_id: searchResult.tune_id, score: result = 0.5 * highscore / lastColumnIndex });
   }
   //Sort and truncate the results
   rankedTuneArray.sort((a, b) => b.score - a.score);
   let slicedTuneArray = rankedTuneArray.slice(0, SECOND_SEARCH_MAX_RESULTS);
   console.log("   Finished: Second search");
   return slicedTuneArray;
}
