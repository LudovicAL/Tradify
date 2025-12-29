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
      const hRow = document.createElement('tr');
      const hCellRank = document.createElement('td');
      hCellRank.textContent = "Rank";
      hRow.appendChild(hCellRank);
      const hCellTuneName = document.createElement('td');
      hCellTuneName.textContent = "Tune name";
      hRow.appendChild(hCellTuneName);
      tHead.appendChild(hRow);
      resultTable.appendChild(tHead);
      const tBody = document.createElement('tbody');
      for (let i = 0, max = searchResult.rankedTunes.length; i < max; i++) {
         const bRow = document.createElement('tr');
         const bCellRank = document.createElement('td');
         bCellRank.textContent = i;
         bRow.appendChild(bCellRank);
         const bCellTuneName = document.createElement('td');
         bCellTuneName.textContent = tuneIndex[searchResult.rankedTunes[i].tune_id].file_name;
         bRow.appendChild(bCellTuneName);
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