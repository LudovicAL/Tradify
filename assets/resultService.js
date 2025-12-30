var resultTable = document.getElementById("resultTable");

function clearTable() {
   resultTable.innerHTML = '';
}

function startDisplaying(onFinishedDisplaying, searchResult) {
   console.log("Started: Result displaying");
   clearTable();
   if (searchResult.rankedTunes.length > 0) {
      console.log("   Best result: " + tuneIndex[searchResult.rankedTunes[0].tune_id].file_name);
      const tHead = document.createElement('thead');
      tHead.classList.add('table-primary');
      tHead.classList.add('fw-bold');
      const hRow = document.createElement('tr');
      //Header rank column
      const hCellRank = document.createElement('td');
      hCellRank.textContent = "Rank";
      hRow.appendChild(hCellRank);
      //Header name column
      const hCellTuneName = document.createElement('td');
      hCellTuneName.textContent = "Tune name";
      hRow.appendChild(hCellTuneName);
      //Header score column
      const hCellScore = document.createElement('td');
      hCellScore.textContent = "Score";
      hRow.appendChild(hCellScore);
      tHead.appendChild(hRow);
      resultTable.appendChild(tHead);
      const tBody = document.createElement('tbody');
      for (let i = 0, max = searchResult.rankedTunes.length; i < max; i++) {
         let tune = tuneIndex[searchResult.rankedTunes[i].tune_id];
         //Tune rank column
         const bRow = document.createElement('tr');
         const bCellRank = document.createElement('td');
         bCellRank.textContent = i + 1;
         bRow.appendChild(bCellRank);
         //Tune name column
         const bCellTuneName = document.createElement('td');
         const bCellTuneNameLink = document.createElement('a');
         bCellTuneNameLink.setAttribute('style', 'white-space: pre;');
         bCellTuneNameLink.textContent = tune.file_name.replaceAll(';', '\r\n');
         bCellTuneNameLink.href = "https://ludovical.github.io/Partitions/" + tune.file_name.replaceAll(" ", "%20").replaceAll(";", "%3B").replaceAll("#", "%23") + ".pdf";
         bCellTuneNameLink.target = '_blank';
         bCellTuneNameLink.rel = 'noopener noreferrer';
         bCellTuneName.appendChild(bCellTuneNameLink);
         bRow.appendChild(bCellTuneName);
         //Tune score column
         const bCellScore = document.createElement('td');
         bCellScore.textContent = (searchResult.rankedTunes[i].score * 100).toFixed(1) + "%";
         bRow.appendChild(bCellScore);
         tBody.appendChild(bRow);
      };
      resultTable.appendChild(tBody);
  } else {
      console.log("   Best result: 0 result to display");
      const cell = document.createElement('td');
      cell.textContent = "0 result.\nTry again!";
      const row = document.createElement('tr');
      row.appendChild(cell);
      resultTable.appendChild(row);
   }
   onFinishedDisplaying(searchResult.recordingNumber);
   console.log("Finished: Result displaying");
}