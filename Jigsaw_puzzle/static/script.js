document.addEventListener("DOMContentLoaded", function () {
  const piecesContainer = document.querySelector(".pieces-container");
  const gridContainer = document.querySelector(".grid-container");
  const timerDisplay = document.getElementById("timer");
  const resetBtn = document.getElementById("reset-btn");

  let timeLeft = 180;
  const gridSize = 4; // 4x4 puzzle grid
  let imageSrc = ""; // Replace with your image path
  let pieces = [];

    // Start the game timer
    function startTimer() {
      const timerElement = document.getElementById('timer');
      const interval = setInterval(() => {
          let minutes = Math.floor(timeLeft / 60);
          let seconds = timeLeft % 60;
          seconds = seconds < 10 ? '0' + seconds : seconds;
          timerElement.textContent = `${minutes}:${seconds}`;
          if (timeLeft <= 0) {
              clearInterval(interval);
              alert("Time's up!");
          }
          timeLeft--;
      }, 1000);
  }
   // Create drop zones (grid cells) in the grid container
  function createDropZones(pieceSize) {
    gridContainer.innerHTML = "";
    for (let i = 0; i < gridSize * gridSize; i++) {
      let x = i % gridSize; // grid column
      let y = Math.floor(i / gridSize); // grid row
      let dropZone = document.createElement("div");
      dropZone.classList.add("drop-zone");
      dropZone.dataset.index = i;
      dropZone.style.width = pieceSize + "px";
      dropZone.style.height = pieceSize + "px";
      dropZone.style.left = `${x * pieceSize}px`;
      dropZone.style.top = `${y * pieceSize}px`;
      gridContainer.appendChild(dropZone);
    }
  }

  // Create puzzle pieces in the pieces container
  function createPuzzlePieces(pieceSize, containerSize) {
    piecesContainer.innerHTML = "";
    pieces = [];
    for (let i = 0; i < gridSize * gridSize; i++) {
      let x = i % gridSize;
      let y = Math.floor(i / gridSize);
      let piece = document.createElement("div");
      piece.classList.add("puzzle-piece");
      piece.style.width = pieceSize + "px";
      piece.style.height = pieceSize + "px";
      piece.style.backgroundImage = `url(${imageSrc})`;
      piece.style.backgroundSize = `${containerSize}px ${containerSize}px`;
      piece.style.backgroundPosition = `${-x * pieceSize}px ${-y * pieceSize}px`;
      piece.style.boxShadow = "2px 4px 4px black";
      piece.dataset.index = i;
      piece.setAttribute("draggable", true);

      // Randomly position the piece within the container bounds
      let randomLeft = Math.floor(Math.random() * (containerSize - pieceSize));
      let randomTop = Math.floor(Math.random() * (containerSize - pieceSize));
      piece.style.left = `${randomLeft}px`;
      piece.style.top = `${randomTop}px`;

      piecesContainer.appendChild(piece);
      pieces.push(piece);
    }
  }

  // Set up drag and drop functionality for pieces and drop zones
  function addDragAndDrop() {
    let draggedPiece = null;
    let offsetX = 0, offsetY = 0;

    document.querySelectorAll(".puzzle-piece").forEach((piece) => {
      // --- Desktop Drag Events ---
      piece.addEventListener("dragstart", function (e) {
        draggedPiece = this;
        setTimeout(() => this.classList.add("dragging"), 0);
      });

      piece.addEventListener("dragend", function () {
        this.classList.remove("dragging");
        draggedPiece = null;
        checkWin();
      });

      // --- Touch Drag Events ---
      piece.addEventListener("touchstart", function (e) {
        draggedPiece = this;
        let touch = e.touches[0];
        // let rect = draggedPiece.getBoundingClientRect();

        const pieceRect = draggedPiece.getBoundingClientRect();
        const containerRect = piecesContainer.getBoundingClientRect();

        // Calculate offset so the piece stays under your finger
        // offsetX = touch.clientX - rect.left;
        // offsetY = touch.clientY - rect.top;
         // How far the touch is from the piece’s top-left corner
        offsetX = touch.clientX - pieceRect.left;
        offsetY = touch.clientY - pieceRect.top;

        // Ensure absolute positioning so movement is smooth
        draggedPiece.style.position = "absolute";
        draggedPiece.style.zIndex = "1000";
        e.preventDefault();
      });

      piece.addEventListener("touchmove", function (e) {
        if (!draggedPiece) return;
        let touch = e.touches[0];
        const containerRect = piecesContainer.getBoundingClientRect();

        // let x = touch.clientX - offsetX;
        // let y = touch.clientY - offsetY;
        const x = touch.clientX - containerRect.left - offsetX;
        const y = touch.clientY - containerRect.top - offsetY;
        
        draggedPiece.style.left = `${x}px`;
        draggedPiece.style.top = `${y}px`;

        e.preventDefault();
      });

      piece.addEventListener("touchend", function () {
        if (!draggedPiece) return;
        // Use the updated drop detection based on center point
        checkDropZone(draggedPiece);
        draggedPiece.style.zIndex = "1";
        draggedPiece.classList.remove("dragging");
        draggedPiece = null;
        checkWin();
      });
    });


   








    

    // --- Drop Zone Handlers ---
    document.querySelectorAll(".drop-zone").forEach((zone) => {
      zone.addEventListener("dragover", function (e) {
        e.preventDefault();
      });

      zone.addEventListener("drop", function (e) {
        e.preventDefault();
        if (
          draggedPiece &&
          this.childElementCount === 0 &&
          this.dataset.index === draggedPiece.dataset.index
        ) {
          snapToGrid(draggedPiece, this);
        }
      });

      // For touch devices, call drop detection on touchend
      zone.addEventListener("touchend", function (e) {
        if (!draggedPiece) return;
        checkDropZone(draggedPiece);
      });
    });

    // Updated drop detection: Check if the center of the piece is inside a valid drop zone
    function checkDropZone(piece) {
      let pieceRect = piece.getBoundingClientRect();
      let centerX = pieceRect.left + pieceRect.width / 2;
      let centerY = pieceRect.top + pieceRect.height / 2;

      document.querySelectorAll(".drop-zone").forEach((zone) => {
        let zoneRect = zone.getBoundingClientRect();

        // Check if the center point is within the drop zone
        if (
          centerX >= zoneRect.left &&
          centerX <= zoneRect.right &&
          centerY >= zoneRect.top &&
          centerY <= zoneRect.bottom &&
          zone.childElementCount === 0 &&
          zone.dataset.index === piece.dataset.index
        ) {
          snapToGrid(piece, zone);
        }
      });
    }

    // Snap the piece into the grid cell
    function snapToGrid(piece, zone) {
      zone.appendChild(piece);
      piece.style.position = "relative"; // Reset to normal positioning
      piece.style.left = "0";
      piece.style.top = "0";
      piece.draggable = false;
    }
  }

  // Check if all drop zones contain the correct piece
  function checkWin() {
    const allZones = document.querySelectorAll(".drop-zone");
    let correctCount = 0;
    allZones.forEach((zone) => {
      if (
        zone.firstElementChild &&
        zone.firstElementChild.dataset.index === zone.dataset.index
      ) {
        correctCount++;
      }
    });
    if (correctCount === gridSize * gridSize) {
      clearInterval(timerInterval);
      // Assuming you have a popup element for win notification
      popup.style.display = "flex";
    }
  }

  

  // Initialize the puzzle
  function initPuzzle() {
    const containerSize = piecesContainer.clientWidth;
    const pieceSize = containerSize / gridSize;

    createDropZones(pieceSize);
    createPuzzlePieces(pieceSize, containerSize);
    addDragAndDrop();
    startTimer();
  }

  resetBtn.addEventListener("click", initPuzzle);

  // Reinitialize on window resize (optional)
  window.addEventListener("resize", () => {
    setTimeout(initPuzzle, 300);
  });

  


  
  function loadPuzzleImage() {
    fetch('/get_puzzle_image')
        .then(response => response.json())
        .then(data => {
            console.log("Fetched puzzle image:", data.puzzle_image); // Debugging log

            if (data.puzzle_image) {
                imageSrc = data.puzzle_image;
                document.querySelectorAll('.piece').forEach(piece => {
                    piece.style.backgroundImage = `url('${data.puzzle_image}')`;
                });

                // Update the global image source variable if needed
            } else {
                console.error("No puzzle image found in the response.");
            }
        })
        .catch(error => console.error('Error loading puzzle image:', error));
}

// Run function when the page loads
// window.onload = loadPuzzleImage;






    function loadBackgroundImage() {
      fetch('/get_bg_image')
          .then(response => response.json())
          .then(data => {
              if (data.bg_image) {
                  document.body.style.backgroundImage = `url('${data.bg_image}')`;
                  
              }
          })
          .catch(error => console.error('Error loading background image:', error));
    }

    window.onload = function(){
      
      loadPuzzleImage();
      loadBackgroundImage();
      initPuzzle();
    }    


  
});

function backtoindex(){
  window.location.href='/'
} 