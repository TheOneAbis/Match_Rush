"use strict";

const game = new PIXI.Application({
    width: visualViewport.width,
    height: visualViewport.height * .9
});
document.body.appendChild(game.view);

// FSM
let GameState = {
    Title: Symbol(0),
    Tutorial: Symbol(1),
    Game: Symbol(2),
    GameOver: Symbol(3),
    GameSuccess: Symbol(4),
}
Object.freeze(GameState);

// Variables
let grid = [];
let gridDivisions = 8; // How many rows/columns in the grid
let gameScene, titleScene, tutorialScene;
let container = new Container(0, 0, game.view.width * .45, game.view.width * .45);
let mousePos;
let pausedPhysics = true; // pause the shape falling physics
let dt;
let selectedItem;
let combo = 0;
let score = 0;

// Sound variables
let matchSounds = [];
let noMatchSound;
let noMovesSound;
let fourMatchSound, fiveMatchSound;

// FSM Variable
let gameState = GameState.Title;

// Global labels
let gameScoreLabel, gameOverLabel;

// pre-load the images

/*
game.loader.
    add([
    ]);
*/
game.loader.onProgress.add(e => { console.log(`progress=${e.progress}`) });
game.loader.onComplete.add(initialize);
game.loader.load();


function initialize() {
    dt = 1/game.ticker.FPS;

    // Title Scene
    titleScene = new PIXI.Container();
    titleScene.visible = true;
    game.stage.addChild(titleScene);

    // Tutorial Scene
    tutorialScene = new PIXI.Container();
    tutorialScene.visible = false;
    game.stage.addChild(tutorialScene);

    // Game Scene
    gameScene = new PIXI.Container();
    gameScene.visible = false;
    game.stage.addChild(gameScene);

    createLabelsAndButtons();

    // Load sounds
    for (let i = 0; i < 7; i++) {
        matchSounds[i] = new Howl({
            src: [`assets/Match${i + 1}.wav`]
        })
    }
    noMatchSound = new Howl({
        src: ['assets/NoMatch.wav']
    });
    noMovesSound = new Howl({
        src: ['assets/NoMoves.wav']
    });
    fourMatchSound = new Howl({
        src: ['assets/4OfAKind.wav']
    })
    fiveMatchSound = new Howl({
        src: ['assets/5OfAKind.wav']
    })
    
    game.ticker.add(update);
}

function createLabelsAndButtons() {
    
    let titleLabel = new PIXI.Text("MATCH RUSH");
    titleLabel.style = new PIXI.TextStyle({
        fill: 0x55FF55,
        fontSize: game.screen.width * .06,
        fontFamily: "Tahoma, Geneva, sans-serif",
        stroke: 0xFFFFFF,
        strokeThickness: 3
    });
    console.log(titleLabel.style.fontFamily);
    titleLabel.x = game.screen.width / 2 - titleLabel.getBounds().width / 2;
    titleLabel.y = game.screen.height * .15;
    titleScene.addChild(titleLabel);

    let titleNotification = new PIXI.Text("(OPTIONAL) Play this game in FULL SCREEN for best experience!");
    titleNotification.style = new PIXI.TextStyle({
        fill: 0xDDDDDD,
        fontSize: game.screen.width * .02,
        fontFamily: "Tahoma, Geneva, sans-serif",
        stroke: 0xFFFFFF,
        strokeThickness: 0
    });
    titleNotification.x = game.screen.width / 2 - titleNotification.getBounds().width / 2;
    titleNotification.y = game.screen.height * .6;
    titleScene.addChild(titleNotification);

    let playButton = new PIXI.Text("PLAY");
    playButton.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: game.screen.width * .06,
        fontFamily: "Tahoma, Geneva, sans-serif",
        stroke: 0x444444,
        strokeThickness: 1
    });
    playButton.interactive = true;
    playButton.on('pointerup', showTutorial); // startGame is a function reference
    playButton.on('pointerover', e => e.target.alpha = 0.7); // Arrow function with no brackets
    playButton.on('pointerout', e => e.currentTarget.alpha = 1.0); // ditto
    playButton.x = game.screen.width / 2 - playButton.getBounds().width / 2;
    playButton.y = game.screen.height / 2 - 50;
    titleScene.addChild(playButton);

    let tutorialTitle = new PIXI.Text("How to Play");
    tutorialTitle.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: game.screen.width * .05,
        fontFamily: "Tahoma, Geneva, sans-serif",
        stroke: 0xFFFFFF,
        strokeThickness: 2
    });
    tutorialTitle.x = game.screen.width / 2 - tutorialTitle.getBounds().width / 2;
    tutorialTitle.y = game.screen.height * .05;
    tutorialScene.addChild(tutorialTitle);

    let tutorialDescription = new PIXI.Text("Drag shapes around to make rows or columns of \n3 or more of the same shape!");
    tutorialDescription.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: game.screen.width * .02,
        fontFamily: "Tahoma, Geneva, sans-serif",
        stroke: 0xFFFFFF,
        strokeThickness: 0
    });
    tutorialDescription.x = game.screen.width * .2;
    tutorialDescription.y = game.screen.height * .2;
    tutorialScene.addChild(tutorialDescription);

    let tutorialDescription2 = new PIXI.Text("Get as high a score as possible before running out of moves!");
    tutorialDescription2.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: game.screen.width * .02,
        fontFamily: "Tahoma, Geneva, sans-serif",
        stroke: 0xFFFFFF,
        strokeThickness: 0
    });
    tutorialDescription2.x = game.screen.width * .2;
    tutorialDescription2.y = game.screen.height * .4;
    tutorialScene.addChild(tutorialDescription2);

    let tutorialDescription3 = new PIXI.Text("You can only move shapes ONE grid space!");
    tutorialDescription3.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: game.screen.width * .02,
        fontFamily: "Tahoma, Geneva, sans-serif",
        stroke: 0xFFFFFF,
        strokeThickness: 0
    });
    tutorialDescription3.x = game.screen.width * .2;
    tutorialDescription3.y = game.screen.height * .6;
    tutorialScene.addChild(tutorialDescription3);

    let startGameButton = new PIXI.Text("BEGIN");
    startGameButton.style = new PIXI.TextStyle({
        fill: 0x00DD00,
        fontSize: game.screen.width * .04,
        fontFamily: "Tahoma, Geneva, sans-serif",
        stroke: 0xFFFFFF,
        strokeThickness: 2
    });
    startGameButton.interactive = true;

    startGameButton.on('pointerup', initGame);
    startGameButton.on('pointerover', e => e.target.alpha = 0.7); // Arrow function with no brackets
    startGameButton.on('pointerout', e => e.currentTarget.alpha = 1.0); // ditto
    startGameButton.x = game.screen.width / 2 - startGameButton.getBounds().width / 2;
    startGameButton.y = game.screen.height * .8;
    tutorialScene.addChild(startGameButton);

    gameScoreLabel = new PIXI.Text(`Score: ${score}`);
    gameScoreLabel.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: game.screen.width * .04,
        fontFamily: "Tahoma, Geneva, sans-serif",
        stroke: 0xFFFFFF,
        strokeThickness: 1
    });
    gameScoreLabel.x = game.screen.width * .6;
    gameScoreLabel.y = game.screen.height * .3;
    gameScene.addChild(gameScoreLabel);

    gameOverLabel = new PIXI.Text(``);
    gameOverLabel.style = new PIXI.TextStyle({
        fill: 0xFF0000,
        fontSize: game.screen.width * .04,
        fontFamily: "Tahoma, Geneva, sans-serif",
        stroke: 0xFF0000,
        strokeThickness: 1
    });
    gameOverLabel.x = game.screen.width * .6;
    gameOverLabel.y = game.screen.height * .45;
    gameScene.addChild(gameOverLabel);
}

// Bring the game to the Tutorial Screen
function showTutorial() {
    titleScene.visible = false;
    tutorialScene.visible = true;
    if (gameState === GameState.Title) gameState = GameState.Tutorial;
}

// Initializes the Game State, creating grid, shapes, etc
function initGame() {
    if (gameState === GameState.Tutorial)
        gameState = GameState.Game;
        
    //Add matches container
    tutorialScene.visible = false;
    gameScene.visible = true;
    gameScene.addChild(container);

    // Create 2D grid of match shapes and add to scene
    for (let i = 0 ; i < gridDivisions; i++) {
        let gridCol = []; // The new row to be added
        for (let j = 0 ; j < gridDivisions; j++) {
            
            // Create new random shape and add it to the grid and scene
            gridCol.push(CreateRandomNewShape(i * (container.width / gridDivisions) + container.x, j * (container.height / gridDivisions) + container.y, i, j));
            gameScene.addChild(gridCol[j]);
        }
        grid.push(gridCol);
    }
    // Create each shape's adjacency references for the first time
    updateGridAdjacency();

    let beginningMatchedShapes = [];
    // CONTINUOUSLY check for matches and alter the grid until there are none
    do {
        beginningMatchedShapes = [];
        for (let c = 0; c < grid.length; c++) {
            for (let r = 0; r < grid[c].length; r++) {
                //Now that everything's in their updated place, check for any matches on startup
                beginningMatchedShapes = beginningMatchedShapes.concat(checkMatches(grid[c][r]));
                if (!grid[c][r].Alive) {
                    gameScene.removeChild(grid[c][r]);
                    grid[c][r] = CreateRandomNewShape(c * (container.width / gridDivisions) + container.x, r * (container.height / gridDivisions) + container.y, c, r);
                    gameScene.addChild(grid[c][r]);
                }
            }
        }
        updateGridAdjacency();
    } while (beginningMatchedShapes.length > 0);
    
    score = 0; // Reset score to 0, the above checkMatches() altered it
    gameScoreLabel.text = `Score: ${score}`;

    // Pretty much everything happens in here.
    game.view.onclick = e => {
        if (selectedItem) {
            let allyTroops = [];
            let selectedItemCenter = {
                x: selectedItem.x + selectedItem.width / 2,
                y: selectedItem.y + selectedItem.height / 2,
            }
    
            // Deselect the selected shape and check to see if it can switch with the intended other shape
            let swappedItem;
    
            if (selectedItem.Up && selectedItem.Up.CollidesWithPoint(selectedItemCenter)) {
                swappedItem = selectedItem.Up;
            }
            else if (selectedItem.Right && selectedItem.Right.CollidesWithPoint(selectedItemCenter)) {
                swappedItem = selectedItem.Right;
            }
            else if (selectedItem.Down && selectedItem.Down.CollidesWithPoint(selectedItemCenter)) {
                swappedItem = selectedItem.Down;
            }
            else if (selectedItem.Left && selectedItem.Left.CollidesWithPoint(selectedItemCenter)) {
                swappedItem = selectedItem.Left;
            }
    
            if (swappedItem) {
                switchShapePositions(selectedItem, swappedItem);
                selectedItem.x = selectedItem.gridX;
                selectedItem.y = selectedItem.gridY;
    
                for (let c = 0; c < grid.length; c++) {
                    for (let r = 0; r < grid[c].length; r++) {
                        //Now that everything's in their updated place, check for any matches
                        allyTroops = allyTroops.concat(checkMatches(grid[c][r]));
                        grid[c][r].falling = true;
                    }
                }
            
                if (allyTroops.length == 0) {
                    switchShapePositions(swappedItem, selectedItem); // Move didn't work out, so revert
                    noMatchSound.play();
                }
                else {
                    if (allyTroops.includes("Archer")) fourMatchSound.play();
                    if (allyTroops.includes("Ballista")) fiveMatchSound.play();
                    pausedPhysics = false;
                    matchSounds[combo].play();
                }

                for (let c = 0; c < grid.length; c++) {
                    // Filter out the destroyed shapes from the grid array
                    grid[c] = grid[c].filter(item => {
                        if (!item.Alive) gameScene.removeChild(item);
                        return item.Alive;
                    });
                    
                    let numNewShapes = gridDivisions - grid[c].length;
                    // Create new random shapes and add them to the grid and scene
                    for (let i = 0; i < numNewShapes; i++) {
                        let newShape = CreateRandomNewShape(c * (container.width / gridDivisions) + container.x, -(i + 1) * (container.height / gridDivisions) + container.y, c, i);
                        grid[c].unshift(newShape);
                        gameScene.addChild(newShape);
                    }
                }
            updateGridAdjacency();
            }
    
            selectedItem = null; // Lastly, deselect the item
        }
    };
}

// UPDATE is called ONCE per frame
function update() {
    mousePos = game.renderer.plugins.interaction.mouse.global;

    dt = 1/game.ticker.FPS;
    if (dt > 1/12) dt=1/12;
    
    if (selectedItem) {
        let selectedCenter = {
            x: selectedItem.gridX + selectedItem.width / 2,
            y: selectedItem.gridY + selectedItem.height / 2
        }
        let rightItemCenterX = selectedItem.Right ? selectedItem.Right.gridX + selectedItem.Right.width / 2 : container.x + container.width;
        let leftItemCenterX = selectedItem.Left ? selectedItem.Left.gridX + selectedItem.Left.width / 2 : container.x;
        let downItemCenterY = selectedItem.Down ? selectedItem.Down.gridY + selectedItem.Down.height / 2 : container.y + container.height;
        let upItemCenterY = selectedItem.Up ? selectedItem.Up.gridY + selectedItem.Up.height / 2 : container.y;

        // Make shapes draggable when clicked on
        let midpt;
        // Move HORIZONTAL
        if (Math.abs(mousePos.x - selectedCenter.x) > Math.abs(mousePos.y - selectedCenter.y)) {
            // Clamp it to where it can possibly go
            selectedItem.x = Clamp(mousePos.x - selectedItem.width / 2, 
                (selectedItem.Left ? selectedItem.Left.gridX : selectedItem.gridX), 
                (selectedItem.Right ? selectedItem.Right.gridX : selectedItem.gridX));
            selectedItem.y = selectedItem.gridY;
            if (selectedItem.Up) selectedItem.Up.y = selectedItem.Up.gridY;
            if (selectedItem.Down) selectedItem.Down.y = selectedItem.Down.gridY;

            // Right shape responds to its movements
            if (Math.abs(mousePos.x - rightItemCenterX) < Math.abs(mousePos.x - leftItemCenterX)) {
                midpt = selectedCenter.x + (rightItemCenterX - selectedCenter.x) / 2;
                if (selectedItem.Right) selectedItem.Right.x = selectedCenter.x + (midpt - (selectedItem.x + selectedItem.width / 2));
                if (selectedItem.Left) selectedItem.Left.x = selectedItem.Left.gridX;
            }
            // Or left shape does
            else {
                midpt = leftItemCenterX + (selectedCenter.x - leftItemCenterX) / 2;
                if (selectedItem.Left) selectedItem.Left.x = leftItemCenterX + (midpt - (selectedItem.x + selectedItem.width / 2));
                if (selectedItem.Right) selectedItem.Right.x = selectedItem.Right.gridX;
            }
        }
        // Move VERTICAL
        else {
            // Clamp it to where it can possibly go
            selectedItem.y = Clamp(mousePos.y - selectedItem.height / 2, 
                (selectedItem.Up ? selectedItem.Up.gridY : selectedItem.gridY), 
                (selectedItem.Down ? selectedItem.Down.gridY : selectedItem.gridY));
            selectedItem.x = selectedItem.gridX;
            if (selectedItem.Left) selectedItem.Left.x = selectedItem.Left.gridX;
            if (selectedItem.Right) selectedItem.Right.x = selectedItem.Right.gridX;

            // Down shape responds to its movements
            if (Math.abs(mousePos.y - downItemCenterY) < Math.abs(mousePos.y - upItemCenterY)) {
                midpt = selectedCenter.y + (downItemCenterY - selectedCenter.y) / 2;
                if (selectedItem.Down) selectedItem.Down.y = selectedCenter.y + (midpt - (selectedItem.y + selectedItem.height / 2));
                if (selectedItem.Up) selectedItem.Up.y = selectedItem.Up.gridY;
            }
            // Or Up shape does
            else {
                midpt = upItemCenterY + (selectedCenter.y - upItemCenterY) / 2;
                if (selectedItem.Up) selectedItem.Up.y = upItemCenterY + (midpt - (selectedItem.y + selectedItem.height / 2));
                if (selectedItem.Down) selectedItem.Down.y = selectedItem.Down.gridY;
            }
        }  
    }

    for(let c = 0; c < grid.length; c++) {
        for (let r = 0; r < grid[c].length; r++) {
            // Objects will fall if physics is not paused, to the bottom of the container if no other objects beneath it
            if (!pausedPhysics) {
                if ((grid[c][r].y + grid[c][r].h > container.y + container.height || grid[c][r].CollidesWith(grid[c][r].Down))) {
                    grid[c][r].falling = false;
                }
                grid[c][r].Fall();
            }
            else {
                grid[c][r].gridX = c * (container.width / gridDivisions) + container.x;
                grid[c][r].gridY = r * (container.height / gridDivisions) + container.y;
                if (!selectedItem) {
                    grid[c][r].x = grid[c][r].gridX;
                    grid[c][r].y = grid[c][r].gridY;
                }
            }
        }
    }

    // When everything has stopped falling, check for COLLATERAL matches
    if (!pausedPhysics && grid.filter(col => col.filter(item => item.falling).length != 0).length == 0) {
        let allyTroops = [];

        // Check for more matches
        for (let c = 0; c < grid.length; c++) {
            for (let r = 0; r < grid[c].length; r++) {
                //Now that everything's in their updated place, check for any matches
                allyTroops = allyTroops.concat(checkMatches(grid[c][r]));
                grid[c][r].falling = true;
            }
        }

        // If there are more matches (thus more troops to spawn) remove those shapes and add new ones
        if (allyTroops.length > 0) {
            combo++;

            // play the corresponding combo sound
            if (combo < matchSounds.length - 1) matchSounds[combo].play(); 
            else matchSounds[matchSounds.length - 1].play();

            // play the corresponding 4oAK or 5oAK sound
            if (allyTroops.includes("Archer")) fourMatchSound.play();
            if (allyTroops.includes("Ballista")) fiveMatchSound.play();

            for (let c = 0; c < grid.length; c++) {
                grid[c] = grid[c].filter(item => {
                    if (!item.Alive) gameScene.removeChild(item);
                    return item.Alive;
                });
                
                let numNewShapes = gridDivisions - grid[c].length;
                // Create new random shapes and add them to the grid and scene
                for (let i = 0; i < numNewShapes; i++) {
                    let newShape = CreateRandomNewShape(c * (container.width / gridDivisions) + container.x, -(i + 1) * (container.height / gridDivisions) + container.y, c, i);
                    grid[c].unshift(newShape);
                    gameScene.addChild(newShape);
                }
            }
            updateGridAdjacency();
        }
        else {
            combo = 0;
            pausedPhysics = true;
            // No more collateral matches, so check potential matches
            if (!checkPotentialMatches()) {
                gameOverLabel.text = "Game Over! \nNo More Moves!!!";
                noMovesSound.play();
            }
        }
    }
}

function updateGridAdjacency() {
    for(let c = 0; c < grid.length; c++) {
        for (let r = 0; r < grid[c].length; r++) {

            grid[c][r].Up = r > 0 ? grid[c][r - 1] : null; // Up
            grid[c][r].Right = c < grid[c].length - 1 ? grid[c + 1][r] : null; // Right
            grid[c][r].Down = r < grid.length - 1 ? grid[c][r + 1] : null; // Down
            grid[c][r].Left = c > 0 ? grid[c - 1][r] : null; // Left
            grid[c][r].column = c;
            grid[c][r].row = r;
        }
    }
}

function switchShapePositions(selected, other) {
    // Store other's attributes in temp variables
    let tempX = other.gridX;
    let tempY = other.gridY;
    let tempC = other.column;
    let tempR = other.row;

    // Switch the two shapes
    grid[selected.column][selected.row] = other;
    other.gridX = selected.gridX;
    other.gridY = selected.gridY;
    other.column = selected.column;
    other.row = selected.row;
    other.x = other.gridX;
    other.y = other.gridY;

    grid[tempC][tempR] = selected;
    selected.gridX = tempX;
    selected.gridY = tempY;
    selected.column = tempC;
    selected.row = tempR;
    selected.x = selected.gridX;
    selected.y = selected.gridY;

    // Update their adjacent shapes
    updateGridAdjacency();
}

/// Checks the entire grid for any matches of 3+ after a move has ben made.
function checkMatches(shape) {
    let troopsToSpawn = [];
    if (!shape.Alive) return troopsToSpawn;


    let troopTypes = ["Footman", "Archer", "Ballista"];
    let trashBin = [shape]; // Used to collect shapes that have been matched
    let numInMatch = 1; // The selected shape is the first one in the match
    let subTrashBin = [];

    // Only need to check Down and Right due to how checkMatches is called in the nested for loops above; checking up and left will be redundant

    // Check RIGHT
    numInMatch = 1;
    subTrashBin = [];

    for (let currentShape = shape; currentShape.Right && currentShape.constructor.name === currentShape.Right.constructor.name; currentShape = currentShape.Right) {
        if (currentShape.Right.Alive) {
            subTrashBin.push(currentShape.Right);
            if (numInMatch < 5) numInMatch++; // In the super rare case that there is somehow a 6+-of-a-kind (is this even possible?)
        }
    }
    if (numInMatch >= 3) {
        trashBin.push(...subTrashBin);
        troopsToSpawn.push(troopTypes[numInMatch - 3]);
        increaseScore(numInMatch);
    }

    // Check DOWN
    numInMatch = 1;
    subTrashBin = [];

    for (let currentShape = shape; currentShape.Down && currentShape.constructor.name === currentShape.Down.constructor.name; currentShape = currentShape.Down) {
        if (currentShape.Down.Alive) {
            subTrashBin.push(currentShape.Down);
            if (numInMatch < 5) numInMatch++; // In the super rare case that there is somehow a 6+-of-a-kind
        }
    }
    if (numInMatch >= 3) {
        trashBin.push(...subTrashBin);
        troopsToSpawn.push(troopTypes[numInMatch - 3]);
        increaseScore(numInMatch)
    }
    
    // Dump out the trash
    if (trashBin.length > 1) {
        trashBin.forEach(trash => {
            if (trash.Alive) {
                trash.Alive = false;
            }
        });
    } 
    return troopsToSpawn;
}

// Checks the entire grid to see if there are any potential matches that can be made
function checkPotentialMatches() {
    for (let col of grid) {
        for (let shape of col) {
            if (shape.Down) {
                // DOWN LEFT
                if (shape.Down.Left && shape.constructor.name == shape.Down.Left.constructor.name) { // START DOWN LEFT
                    if (shape.Down.Down && shape.constructor.name == shape.Down.Down.constructor.name) return true; // START DOWN DOWN
                    if (shape.Down.Left.Down && shape.constructor.name == shape.Down.Left.Down.constructor.name) return true; // START DOWN LEFT DOWN
                }
                // DOWN
                if (shape.Down.Down && shape.constructor.name == shape.Down.Down.constructor.name) { // START DOWN DOWN
                    if (shape.Down.Down.Down && shape.constructor.name == shape.Down.Down.Down.constructor.name) return true; // START DOWN DOWN DOWN
                }
                if (shape.constructor.name == shape.Down.constructor.name) { // START DOWN
                    if (shape.Down.Down) {
                        if (shape.Down.Down.Right && shape.constructor.name == shape.Down.Down.Right.constructor.name) return true; // START DOWN DOWN RIGHT
                        if (shape.Down.Down.Left && shape.constructor.name == shape.Down.Down.Left.constructor.name) return true; // START DOWN DOWN LEFT
                        if (shape.Down.Down.Down && shape.constructor.name == shape.Down.Down.Down.constructor.name) return true; // START DOWN DOWN DOWN
                    }
                }
                // DOWN RIGHT
                if (shape.Down.Right && shape.constructor.name == shape.Down.Right.constructor.name){ // START DOWN RIGHT
                    if (shape.Down.Down && shape.constructor.name == shape.Down.Down.constructor.name) return true; // START DOWN DOWN
                    if (shape.Down.Right.Down && shape.constructor.name == shape.Down.Right.Down.constructor.name) return true; // START DOWN RIGHT DOWN
                    if (shape.Down.Right.Right && shape.constructor.name == shape.Down.Right.Right.constructor.name) return true; // START DOWN RIGHT RIGHT
                    if (shape.Right && shape.Right.Right && shape.constructor.name == shape.Right.Right.constructor.name) return true; // START RIGHT RIGHT
                }
            }
            if (shape.Right) {
                // RIGHT
                if (shape.Right.Right && shape.constructor.name == shape.Right.Right.constructor.name) { // START RIGHT RIGHT
                    if (shape.Right.Right.Right && shape.constructor.name == shape.Right.Right.Right.constructor.name) return true; // START RIGHT RIGHT RIGHT
                }
                if (shape.constructor.name == shape.Right.constructor.name) { // START RIGHT
                    if (shape.Right.Right) {
                        if (shape.Right.Right.Down && shape.constructor.name == shape.Right.Right.Down.constructor.name) return true; // START RIGHT RIGHT DOWN
                        if (shape.Right.Right.Right && shape.constructor.name == shape.Right.Right.Right.constructor.name) return true; // START RIGHT RIGHT RIGHT
                        if (shape.Right.Right.Up && shape.constructor.name == shape.Right.Right.Up.constructor.name) return true; // START RIGHT RIGHT UP
                    }
                }
                // UP RIGHT
                if (shape.Right.Up && shape.constructor.name == shape.Right.Up.constructor.name) { // START RIGHT UP
                    if (shape.Right.Right && shape.constructor.name == shape.Right.Right.constructor.name) return true; // START RIGHT RIGHT
                    if (shape.Right.Up.Right && shape.constructor.name == shape.Right.Up.Right.constructor.name) return true; // START RIGHT UP RIGHT
                }
            }
        }
    }
    return false; // No Potential Matches
}

// Creates a random new interactive shape to be added to the grid
function CreateRandomNewShape(x, y, i, j) {
    let shape;

    let rng = Math.floor(Math.random() * 7);
    let locOnGrid = {
        w: container.width / gridDivisions,
        h: container.height / gridDivisions,
        x: x,
        y: y
    }

    if (rng == 0) shape = new Circle(locOnGrid.x, locOnGrid.y, i, j, locOnGrid.w, locOnGrid.h, dt * 30);
    else if (rng == 1) shape = new Square(locOnGrid.x, locOnGrid.y, i, j, locOnGrid.w, locOnGrid.h, dt * 30);
    else if (rng == 2) shape = new Triangle(locOnGrid.x, locOnGrid.y, i, j, locOnGrid.w, locOnGrid.h, dt * 30);
    else if (rng == 3) shape = new Diamond(locOnGrid.x, locOnGrid.y, i, j, locOnGrid.w, locOnGrid.h, dt * 30);
    else if (rng == 4) shape = new Pentagon(locOnGrid.x, locOnGrid.y, i, j, locOnGrid.w, locOnGrid.h, dt * 30);
    else if (rng == 5) shape = new Hexagon(locOnGrid.x, locOnGrid.y, i, j, locOnGrid.w, locOnGrid.h, dt * 30);
    else if (rng == 6) shape = new Octogon(locOnGrid.x, locOnGrid.y, i, j, locOnGrid.w, locOnGrid.h, dt * 30);

    // Make it selectable
    shape.interactive = true;

    shape.on("pointerdown", (e) => {
        // Make things clickable only after everything stopped falling
        if (pausedPhysics) {
            selectedItem = e.target;
            //console.log(`clicked ${e.target.column}, ${e.target.row}`);
        }
    });

    return shape;
}

// Increment the score by the specified amount (3 = 3, 4 = 6, 5 = 10)
function increaseScore(numInMatch) {
    let scoreInc = 3 + combo;
    for (let i = 0; i < numInMatch - 3; i++) {
        scoreInc += numInMatch + i;
    }
    score += scoreInc;
    gameScoreLabel.text = `Score: ${score}`;
}