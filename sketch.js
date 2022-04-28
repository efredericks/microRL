const numRows = 500;
const numCols = 500;
let world;
let dirty = true;
let asciiMode = true;
let player = { r: 0, c: 0 };
let spriteSheet;
const spriteSize = 16;
let halfScreenWidth;

function preload() {
  spriteSheet = loadImage("colored_transparent_packed.png");
}
function setup() {
  createCanvas(1024, 800);
  noiseDetail(8, 0.25);
  noSmooth();

  halfScreenWidth = width / 2;

  textFont("monospace");
  textAlign(CENTER, CENTER);

  background(0);

  world = new World(numCols, numRows);
  world.placeObject(player);
  // console.log(world.grid);
}

function keyPressed() {
  if (key === "~") asciiMode = !asciiMode;
}

function draw() {
  if (dirty) world.draw();

  if (keyIsPressed) {
    let next_r = player.r;
    let next_c = player.c;
    if (keyIsDown(74)) {
      next_r++;
    } else if (keyIsDown(75)) {
      next_r--;
    } else if (keyIsDown(72)) {
      next_c--;
    } else if (keyIsDown(76)) {
      next_c++;
    } else if (keyIsDown(89)) {
      next_r--;
      next_c--;
    } else if (keyIsDown(85)) {
      next_r--;
      next_c++;
    } else if (keyIsDown(66)) {
      next_r++;
      next_c--;
    } else if (keyIsDown(78)) {
      next_r++;
      next_c++;
    } else if (keyIsDown(190)) {
      // period
    }

    if (world.isWalkable(next_c, next_r)) {
      player.c = next_c;
      player.r = next_r;
    }

    player.c = constrain(player.c, 0, world.getCols() - 1);
    player.r = constrain(player.r, 0, world.getRows() - 1);

    dirty = true;

    // update all entities after keypress
    // for (let e of entities) {
    //   e.update();
    // }
  }
}

// sprite lookup + ascii representations
const Tiles = {
  player: { c: 35, r: 14, ascii: "@", color: "#ffffff" },
  human: { c: 26, r: 9, ascii: "H", color: "#ff00ff" },
  town: { c: 1, r: 21, ascii: "T", color: "#FFA500" },
  dirt1: { c: 2, r: 0, ascii: ".", color: "#a0522d" },
  grass1: { c: 5, r: 0, ascii: ".", color: "#1a5b02" },
  grass2: { c: 6, r: 0, ascii: ".", color: "#2c7c0e" },
  grass3: { c: 7, r: 0, ascii: ".", color: "#56af36" },
  tree1: { c: 0, r: 1, ascii: "⇑", color: "#203a16" },
  tree2: { c: 1, r: 1, ascii: "⥣", color: "#2c6318" },
  tree3: { c: 2, r: 1, ascii: "⤉", color: "#5f9e48" },
  tree4: { c: 3, r: 1, ascii: "⇈", color: "#46cc16" },
  tree5: { c: 4, r: 1, ascii: "▲", color: "#103004" },
  tree6: { c: 5, r: 1, ascii: "⇞", color: "#3d632f" },
  tree7: { c: 3, r: 1, ascii: "⇧", color: "#47d613" },
  tree8: { c: 4, r: 1, ascii: "⇮", color: "#82e25f" },
  space1: { c: 0, r: 22, ascii: " ", color: "#000000" },
  space2: { c: 1, r: 22, ascii: " ", color: "#222222" },
};

// is this something we can walk over?
const WALKABLE = [
  Tiles.town,
  Tiles.grass1,
  Tiles.grass2,
  Tiles.grass3,
  Tiles.dirt1,
  //debug
  Tiles.space1,
  Tiles.space2,
];

class World {
  constructor(numCols, numRows) {
    this.numCols = numCols;
    this.numRows = numRows;
    this.cellSize = 32; //width / this.numCols;
    this.halfCellSize = this.cellSize / 2; // reduce amount of run-time divides needed

    this.border_offset = this.cellSize;

    this.camRows = int((height - this.border_offset) / this.cellSize);
    this.camCols = int(width / this.cellSize);

    this.halfCamC = int(this.camCols / 2);
    this.halfCamR = int(this.camRows / 2);

    textSize(this.cellSize);

    this.grid = this.generateWorld();
    let _t = this.placeTowns();
    this.towns = _t[0];
    this.townLookup = _t[1];
  }

  getRows() {
    return this.numRows;
  }
  getCols() {
    return this.numCols;
  }

  // find an open spot to place our object
  placeObject(p) {
    p.r = random(0, this.getRows() - 1) | 0;
    p.c = random(0, this.getCols() - 1) | 0;

    while (!this.isWalkable(p.c, p.r)) {
      p.r = random(0, this.getRows() - 1) | 0;
      p.c = random(0, this.getCols() - 1) | 0;
    }
  }

  // in-bounds and can walk over it
  isWalkable(c, r) {
    if (
      c >= 0 &&
      c <= this.getCols() - 1 &&
      r >= 0 &&
      r <= this.getRows() - 1
    ) {
      if (WALKABLE.indexOf(this.grid[r][c].type) >= 0) return true;
    }
    return false;
  }
  
  // place towns
  // towns is the object
  // townLookup points to the town based on a key of `c:r`
  placeTowns() {
    let _towns = {};
    let _townLookup = {};
    
    for (let i = 0; i < 5; i++) {
      let _n = `Town ${i}`;
      let t = { r: 0, c: 0 };
      this.placeObject(t);
      _towns[_n] = t;
      _townLookup[`${t.c}:${t.r}`] = _n;
      
      this.grid[t.r][t.c].type = Tiles.town;
    }
    
    // dirt around towns
    for (let _t in _towns) {
      let _cell = this.grid[_towns[_t].r][_towns[_t].c];
      
      for (let j = 0; j < _cell.neighbors.length; j++) {
        let _g = _cell.neighbors[j];
        // console.log(_g);
        if (this.getCell(_g).type != Tiles.town) {
          this.grid[_g.r][_g.c].type = Tiles.dirt1;
        }
      }
    }
    
    console.log(_townLookup);
    return (_towns, _townLookup);
  }

  generateWorld() {
    let _grid = [];

    // basic noise gen
    for (let r = 0; r < this.numRows; r++) {
      _grid[r] = [];
      for (let c = 0; c < this.numCols; c++) {
        _grid[r][c] = {};

        let _n = noise(c * 0.01, r * 0.01);
        if (_n < 0.25) {
          _grid[r][c].type = random([Tiles.space1, Tiles.space2]);
        } else if (_n < 0.4) {
          _grid[r][c].type = random([Tiles.grass1, Tiles.grass2, Tiles.grass3]);
        } else if (_n < 0.6) {
          _grid[r][c].type = random([
            Tiles.tree1,
            Tiles.tree2,
            Tiles.tree3,
            Tiles.tree4,
            Tiles.tree5,
            Tiles.tree6,
            Tiles.tree7,
            Tiles.tree8,
          ]);
        } else if (_n < 0.8) {
          _grid[r][c].type = random([Tiles.grass1, Tiles.grass2, Tiles.grass3]);
        } else {
          _grid[r][c].type = random([Tiles.space1, Tiles.space2]);
        }

        _grid[r][c].walkable = false;
        if (WALKABLE.indexOf(_grid[r][c].type) >= 0)
          _grid[r][c].walkable = true;
        
        // pathing information
        _grid[r][c].neighbors = [];
        _grid[r][c].previous = undefined;
        this.addNeighbors(_grid[r][c], c, r);
      }
    }

    // towns
    return _grid;
  }
  
  // expects {r:r, c:c}
  getCell(g) {
    return this.grid[g.r][g.c];
  }
  
  // add neighboring cells
  addNeighbors(g, c, r) {
    // left
    if (c > 0) g.neighbors.push({c:c-1,r:r});
    // right
    if (c < this.getCols()-1) g.neighbors.push({c:c+1,r:r});
    
    // top
    if (r > 0) g.neighbors.push({r:r-1,c:c});
    // bottom
    if (r < this.getRows()-1) g.neighbors.push({r:r+1,c:c});
    
    // top left
    if (c > 0 && r > 0) g.neighbors.push({r:r-1,c:c-1});
    // top right
    if (c < this.getCols()-1 && r > 0) g.neighbors.push({r:r-1,c:c+1});
    // bottom left
    if (c > 0 && r < this.getRows()-1) g.neighbors.push({r:r+1,c:c-1});
    // bottom right
    if (c < this.getCols()-1 && r < this.getRows()-1) g.neighbors.push({r:r+1,c:c+1});
  }

  drawTile(x, y, c, r) {
    let _t = this.grid[r][c];

    if (asciiMode) {
      // text
      fill(color(_t.type.color));
      if (_t.type.ascii == " ") square(x, y, this.cellSize);
      else text(_t.type.ascii, x + this.halfCellSize, y + this.halfCellSize);
    } else {
      // sprite
      image(
        spriteSheet,
        x,
        y,
        this.cellSize,
        this.cellSize,
        _t.type.c * spriteSize,
        _t.type.r * spriteSize,
        spriteSize,
        spriteSize
      );
    }
  }

  drawUI() {
    noStroke();
    fill(color(120, 120, 0));
    rect(0, 0, width, this.border_offset);
    fill(255);
    textAlign(CENTER, CENTER);
    text(
      `microRL [${player.c}/${this.numCols - 1}:${player.r}/${
        this.numRows - 1
      }]`,
      halfScreenWidth,
      this.halfCellSize //- 4
    );
  }

  draw() {
    background(0);
    this.drawUI();

    // http://www.roguebasin.com/index.php/Scrolling_map
    let starty, startx, endy, endx;

    if (player.c < this.halfCamC) startx = 0;
    else if (player.c >= this.numCols - this.halfCamC)
      startx = this.numCols - this.camCols;
    else startx = player.c - this.halfCamC;

    if (player.r < this.halfCamR) starty = 0;
    else if (player.r >= this.numRows - this.halfCamR)
      starty = this.numRows - this.camRows;
    else starty = player.r - this.halfCamR;

    // draw in camera range
    let _x = 0;
    let _y = this.border_offset;
    for (let r = starty; r < starty + this.camRows; r++) {
      _x = 0;
      for (let c = startx; c < startx + this.camCols; c++) {
        
        // draw map feature before drawing base layer
        // let _n = `${c}:${r}`;
        // if (_n in this.townLookup)
          
        
        this.drawTile(_x, _y, c, r);

        if (r == player.r && c == player.c) {
          // abstract later
          if (asciiMode) {
            fill(Tiles.player.color);
            text("@", _x + this.halfCellSize, _y + this.halfCellSize);
          } else {
            // sprite
            let _col = color(0); //Tiles.player.color);
            _col.setAlpha(140);
            fill(_col);
            square(_x, _y, this.cellSize);
            image(
              spriteSheet,
              _x,
              _y,
              this.cellSize,
              this.cellSize,
              Tiles.player.c * spriteSize,
              Tiles.player.r * spriteSize,
              spriteSize,
              spriteSize
            );
          }
        }
        //         if (dirty) {
        //           let n = grid[r][c].noise;

        //           noStroke();
        //           fill(grid[r][c].color);
        //           square(_x, _y, cellSize);

        //           if (grid[r][c].entity == "T")
        //             image(sprites.town.image, _x, _y, spriteScaled, spriteScaled);
        //           if (grid[r][c].entity == "tree")
        //             image(
        //               sprites[`tree${grid[r][c].entityID}`].image,
        //               _x,
        //               _y,
        //               spriteScaled,
        //               spriteScaled
        //             );
        //           if (grid[r][c].entity == "grass")
        //             image(
        //               sprites[`grass${grid[r][c].entityID}`].image,
        //               _x,
        //               _y,
        //               spriteScaled,
        //               spriteScaled
        //             );
        //         }

        //         if (grid[r][c].animation) {
        //           let _g = grid[r][c];
        //           fill(_g.color);
        //           square(_x, _y, cellSize);
        //           image(
        //             sprites[_g.animationFrames[_g.animationIndex]].image,
        //             _x,
        //             _y,
        //             spriteScaled,
        //             spriteScaled
        //           );

        //           _g.animationUpdate--;
        //           if (_g.animationUpdate <= 0) {
        //             _g.animationIndex++;
        //             if (_g.animationIndex > _g.animationFrames.length - 1)
        //               _g.animationIndex = 0;

        //             _g.animationUpdate = int(random(2, 20));
        //           }

        //           if (r == player.r && c == player.c) player.draw(startx, starty);
        //         }
        // if (r == player.r && c == player.c) {
        //   fill(255);
        //   text("@", startx, starty);
        // }

        _x += this.cellSize;
      }
      _y += this.cellSize;
    }

    // if (dirty) {
    // for (let e of entities) {
    // e.draw(startx, starty);
    // }

    // if (grid[player.r][player.c] < 0.4) fill(220);
    // player.draw(startx, starty);
    // }

    // noStroke();
    // let y = 0;
    // noFill();
    // for (let r = 0; r < this.numRows; r++) {
    //   let x = 0;
    //   for (let c = 0; c < this.numCols; c++) {
    //     this.drawTile(x, y, c, r);
    //     x += this.cellSize;
    //   }
    //   x = 0;
    //   y += this.cellSize;
    // }
  }
}
