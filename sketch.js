// a* c/o: https://editor.p5js.org/codingtrain/sketches/ehLjdFpat
// camera c/o: // http://www.roguebasin.com/index.php/Scrolling_map
// cellular automata c/o: https://gamedevelopment.tutsplus.com/tutorials/generate-random-cave-levels-using-cellular-automata--gamedev-9664


// town with people?

const numRows = 500;
const numCols = 500;

const subRows = 100;
const subCols = 100;

let world;
let dirty = true;
let asciiMode = false; //true;
let dithered = false;
let debugZoom = false;

let windowScale;

let chatQueue = []; // {msg, timeout (alpha)}

let gameMode;
let gameModeTimer = 0; // effects timer

// let player = { r: 0, c: 0 };
let player = {
  indices: [
    { r: 0, c: 0 },
    { r: 40, c: 40 },
    { r: 40, c: 40 },
    { r: 40, c: 40 },
    { r: 40, c: 40 },
    { r: 40, c: 40 },
  ],
  hp: 5,
  maxHP: 5,
  ssSprite: Tiles.player,
  color: Tiles.player.color,
};
let spriteSheet;
let halfScreenWidth;

function getPlayerPos(worldLevel = null) {
  if (worldLevel == null) return player.indices[world.worldIndex];
  else return player.indices[worldLevel];
}

function preload() {
  spriteSheet = loadImage("colored_transparent_packed.png");
}
function setup() {
  gameMode = GameModes.GAME;

  windowScale = 1.0;
  if (windowWidth < 1024) windowScale = windowWidth / 1024;

  createCanvas(1024 * windowScale, 800 * windowScale);
  //2048,1600);
  noiseDetail(8, 0.25);
  noSmooth();

  console.log(width, windowScale);

  halfScreenWidth = width / 2;

  textFont("monospace");
  textAlign(CENTER, CENTER);

  background(0);

  world = new World(numCols, numRows, subCols, subRows);
  world.placeObject(getPlayerPos());

  // dungeon level placement
  for (let i = 1; i <= world.towns.length; i++) {
    world.placeObject(getPlayerPos(i), i);
  }

  // connect player to town to ensure a path

  let player_pos = getPlayerPos();
  world.connectPaths(world.towns["Town 0"], {
    r: player_pos.r,
    c: player_pos.c,
  });
  // console.log(world.grid);
  frameRate(12);
}

function keyPressed() {

  if (key === "~") { dirty = true; asciiMode = !asciiMode; }
  if (key === "`") { dirty = true; dithered = !dithered; }
  if (key === "5") { dirty = true; world.worldIndex = 5; }
  if (key === "4") { dirty = true; world.worldIndex = 4; }
  if (key === "3") { dirty = true; world.worldIndex = 3; }
  if (key === "2") { dirty = true; world.worldIndex = 2; }
  if (key === "1") { dirty = true; world.worldIndex = 1; }
  if (key === "0") { dirty = true; world.worldIndex = 0; }

  if (key === "!") { dirty = true; debugZoom = !debugZoom; }
}

function draw() {
  switch (gameMode) {
    // splash
    case GameModes.STARTUP:
      fill(0);
      rect(0, 0, width, height);
      break;
    // main menu
    case GameModes.MAIN_MENU:
      break;
    // dialog screen
    case GameModes.DIALOG:
      break;
    // you died
    case GameModes.DEAD:
      let h = map(gameModeTimer, 25, 0, 0, height);
      fill(color(120, 0, 0));
      noStroke();
      rect(0, 0, width, h);

      textAlign(CENTER, CENTER);
      fill(color(255, 255, 255, 120));
      textSize(120);
      text("you died", width / 2, height / 2);

      gameModeTimer--;

      if (gameModeTimer <= 0) {
        gameModeTimer = 0;
        gameMode = GameModes.STARTUP;
        // restartGame();
      }
      break;
    // gameplay
    case GameModes.GAME:
      if (dirty) world.draw();
      dirty = false;
      if (keyIsPressed) {
        let player_pos = getPlayerPos();
        let next_r = player_pos.r;
        let next_c = player_pos.c;
        if (keyIsDown(74)) {
          dirty = true;
          next_r++;
        } else if (keyIsDown(75)) {
          dirty = true;
          next_r--;
        } else if (keyIsDown(72)) {
          dirty = true;
          next_c--;
        } else if (keyIsDown(76)) {
          dirty = true;
          next_c++;
        } else if (keyIsDown(89)) {
          dirty = true;
          next_r--;
          next_c--;
        } else if (keyIsDown(85)) {
          dirty = true;
          next_r--;
          next_c++;
        } else if (keyIsDown(66)) {
          dirty = true;
          next_r++;
          next_c--;
        } else if (keyIsDown(78)) {
          dirty = true;
          next_r++;
          next_c++;
        } else if (keyIsDown(190)) {
          dirty = true;

          player.hp++;
          player.hp = constrain(player.hp, 0, player.maxHP);
          // period
        }

        if (world.isTown(next_c, next_r)) {
          world.worldIndex = world.getTownID(next_c, next_r); //1;
          player_pos = getPlayerPos(world.worldIndex);
        } else if (
          world.tryHitEntity(player, next_c, next_r, world.worldIndex)
        ) {
          console.log("owwie");
        } else if (world.isWalkable(next_c, next_r, world.worldIndex)) {
          player_pos.c = next_c;
          player_pos.r = next_r;
        }

        player_pos.c = constrain(player_pos.c, 0, world.getCols() - 1);
        player_pos.r = constrain(player_pos.r, 0, world.getRows() - 1);

        // dirty = true;

        // update all entities after keypress
        if (
          world.moveableEntities[world.worldIndex] != undefined &&
          world.moveableEntities[world.worldIndex].length > 0
        ) {
          for (let e of world.moveableEntities[world.worldIndex]) {
            e.update();
          }
        }
      }
  }
}

class Entity {
  constructor(type) {
    this.type = type;
  }
}

class MoveableEntity {
  constructor(type, pos) {
    this.type = type;
    this.r = pos.r;
    this.c = pos.c;
    this.dead = false;

    this.hp = 0;
    this.maxHP = 5;
    this.str = 0;

    this.sprite = "X";
    this.color = "#ff00ff";
    if (this.type == "enemy") {
      this.sprite = "o";
      this.color = "#ff0000";
      this.ssSprite = Tiles.enemy;
    } else if (this.type == "npc") {
      this.sprite = "N";
      this.color = "#00ff00";
      this.ssSprite = Tiles.npc;
    }
  }

  update() {
    if (!this.dead) {
      // attack nearby
      let nearcells = [
        { r: this.r - 1, c: this.c - 1 }, // up left
        { r: this.r - 1, c: this.c }, // up
        { r: this.r - 1, c: this.c + 1 }, // up right
        { r: this.r, c: this.c + 1 }, // right
        { r: this.r + 1, c: this.c + 1 }, // down right
        { r: this.r + 1, c: this.c }, // down
        { r: this.r + 1, c: this.c - 1 }, // down left
        { r: this.r, c: this.c - 1 }, // left
      ];
      let hitting = false;
      for (let n of nearcells) {
        if (world.tryHitEntity(this, n.c, n.r, world.worldIndex)) {
          hitting = true;
          break;
        }
      }

      // else
      if (!hitting && random() > 0.8) {
        let next_c = random([-1, 0, 1]) + this.c;
        let next_r = random([-1, 0, 1]) + this.r;
        if (world.isWalkable(next_c, next_r)) {
          this.c = next_c;
          this.r = next_r;
        }
      }
    }
  }
}

class World {
  constructor(numCols, numRows, subCols, subRows) {
    this.numCols = numCols;
    this.numRows = numRows;
    this.subRows = subRows;
    this.subCols = subCols;
    this.worldIndex = 0; // 0 is the overworld - others are sub-worlds

    this.cellSize = 32 * windowScale; //width / this.numCols;
    this.halfCellSize = this.cellSize / 2; // reduce amount of run-time divides needed

    this.border_offset = this.cellSize;

    this.camRows = int((height - this.border_offset) / this.cellSize);
    this.camCols = int(width / this.cellSize);

    this.halfCamC = int(this.camCols / 2);
    this.halfCamR = int(this.camRows / 2);

    textSize(this.cellSize);

    // minimap gfx objects
    this.minimaps = [];
    let _g = createGraphics(100, 100);
    _g.background(color(0, 0, 0, 180));
    this.minimaps.push(_g);

    this.world = this.generateWorld();
    // console.log(this.grid);
    let _t = this.placeTowns();
    this.towns = _t.towns;
    this.townLookup = _t.townLookup;

    // sub-floors
    this.generateSubWorlds();

    // borders and paths
    this.placePaths();

    // enemies and npcs
    this.moveableEntities = this.generateEntities();
    // console.log(this.moveableEntities);
  }

  // eventually these need to be their own thing
  getRows(worldLevel = null) {
    if (worldLevel == null) return this.world[this.worldIndex].numRows;
    else return this.world[worldLevel].numRows;
  }
  getCols(worldLevel = null) {
    if (worldLevel == null) return this.world[this.worldIndex].numCols;
    else return this.world[worldLevel].numCols;
  }
  getGrid(worldLevel = null) {
    if (worldLevel == null) return this.world[this.worldIndex].grid;
    else return this.world[worldLevel].grid;
  }

  // find an open spot to place our object
  placeObject(p, worldLevel = 0) {
    p.r = random(0, this.getRows() - 1) | 0;
    p.c = random(0, this.getCols() - 1) | 0;

    while (!this.isWalkable(p.c, p.r, worldLevel)) {
      p.r = random(0, this.getRows() - 1) | 0;
      p.c = random(0, this.getCols() - 1) | 0;
    }
  }

  // create all NPCs and enemies
  // list based on world
  // update on same plane
  // run update each time a level changes on other slices
  generateEntities() {
    let entities = [];
    entities[0] = [];
    entities[1] = [];
    for (let i = 1; i <= this.towns.length; i++) entities[i] = [];

    // overworld
    // tbd - config!
    for (let i = 0; i < random(250, 400); i++) {
      let pos = { r: -1, c: -1 };
      this.placeObject(pos);
      let e = new MoveableEntity("enemy", pos);
      entities[0].push(e);
    }

    for (let i = 0; i < random(250, 400); i++) {
      let pos = { r: -1, c: -1 };
      this.placeObject(pos, 1);
      let e = new MoveableEntity("npc", pos);
      entities[1].push(e);
    }

    // dungeons -- tbd loot table?

    return entities;
  }

  // return filter on index
  getLevelEntities() { }

  // hit whatever is there if it is there
  tryHitEntity(entity, c, r, worldLevel) {
    let retval = false;
    if (this.isWalkable(c, r, worldLevel)) {
      let _grid = this.getGrid(worldLevel);

      if (entity != player && entity.type != "npc") {
        // enemy attacking player
        let player_pos = getPlayerPos();

        if (!player.dead && player_pos.c == c && player_pos.r == r) {
          player.hp--;
          // console.log(player.hp);
          if (player.hp <= 0) {
            player.dead = true;
            player.ssSprite = Tiles.bones;
            player.color = Tiles.bones.color;

            setGameMode(GameModes.DEAD);
          }
          retval = true;
        }
      } else {
        // player attacking enemy
        if (
          this.moveableEntities[worldLevel] != undefined &&
          this.moveableEntities[worldLevel].length > 0
        ) {
          for (let e of this.moveableEntities[worldLevel]) {
            if (e.c == c && e.r == r && !e.dead) {
              if (e.type == "enemy") {
                e.hp--;
                if (e.hp <= 0) {
                  e.dead = true;
                  e.ssSprite = Tiles.bones;
                  e.color = Tiles.bones.color;
                }
              } else if (e.type == "npc" && entity == player) {
                // console.log(`[${e.type}]: ${random(ChatDebug)}`);

                chatQueue.push({
                  'npc': e.type,
                  'msg': random(ChatDebug),
                  'time': 10
                });
              }

              retval = true;
              break;
            }
          }
        }
      }
    }
    return retval;
  }

  // in-bounds and can walk over it
  isWalkable(c, r, worldLevel) {
    let _grid = this.getGrid(worldLevel);
    if (
      c >= 0 &&
      c <= this.getCols(worldLevel) - 1 &&
      r >= 0 &&
      r <= this.getRows(worldLevel) - 1
    ) {
      if (WALKABLE.indexOf(_grid[r][c].type) >= 0) return true;
    }
    return false;
  }

  // place walking paths
  // * around forests
  // * between towns
  placePaths() {
    let _grid = this.getGrid();

    for (let r = 0; r < this.getRows(); r++) {
      for (let c = 0; c < this.getCols(); c++) {
        let _cell = _grid[r][c];

        // place borders around trees
        if (SURROUND_WITH_PATH.indexOf(_cell.type) >= 0) {
          for (let j = 0; j < _cell.neighbors.length; j++) {
            let _g = _cell.neighbors[j];

            let _neighborCell = this.getCell(_g);
            if (SURROUND_WITH_PATH.indexOf(_neighborCell.type) < 0) {
              _grid[_g.r][_g.c].type = Tiles.dirt1;
            }
          }
        }
      }
    }

    // paths between towns
    this.connectingPaths();

    // this.aStar();
  }
  // draw roads between each city to help with player pathing
  connectPaths(p1, p2) {
    let _grid = this.getGrid();

    let _start = p1;
    let _end = p2;
    let done = false;

    let curr_r = _start.r;
    let curr_c = _start.c;
    while (!done) {
      if (curr_r < _end.r) curr_r++;
      else if (curr_r > _end.r) curr_r--;
      curr_r = constrain(curr_r, 0, this.getRows() - 1);

      if (curr_c < _end.c) curr_c++;
      else if (curr_c > _end.c) curr_c--;
      curr_c = constrain(curr_c, 0, this.getCols() - 1);

      // dirt path if not town
      if (_grid[curr_r][curr_c].type != Tiles.town && _grid[curr_r][curr_c].type != Tiles.dungeon) {
        _grid[curr_r][curr_c].type = Tiles.dirt1;

        // widen path a bit - only care about towns as we're tunneling out a path
        for (let j = 0; j < _grid[curr_r][curr_c].neighbors.length; j++) {
          let _g = _grid[curr_r][curr_c].neighbors[j];
          let _neighborCell = this.getCell(_g);
          if (_neighborCell.type != Tiles.town && _neighborCell.type != Tiles.dungeon) {
            _grid[_g.r][_g.c].type = Tiles.dirt1;
          }
        }
      }

      // end case
      if (curr_r == _end.r && curr_c == _end.c) done = true;
    }
  }
  connectingPaths() {
    // abstract to all towns
    let found = [];
    for (let t1 in this.towns) {
      for (let t2 in this.towns) {
        let k1 = `${t1}::${t2}`;
        let k2 = `${t2}::${t1}`;
        if (t1 != t2 && found.indexOf(k1) < 0 && found.indexOf(k2) < 0) {
          this.connectPaths(this.towns[t1], this.towns[t2]);

          found.push(k1);
        }
      }
    }
  }

  aStar() {
    let _grid = this.getGrid();
    let openSet = [];
    let closedSet = [];
    let start, end;
    let path = [];

    // abstract to all towns
    let _start = this.towns["Town 0"];
    let _end = this.towns["Town 1"];

    start = _grid[_start.r][_start.c];
    end = _grid[_end.r][_end.c];

    openSet.push(start);

    // try for path around first and then tunnel if not?
  }

  // check if player hits something to change the level
  // tbd - need to incorporate world index
  isTown(c, r) {
    let key = `${c}:${r}`;
    if (key in this.townLookup) return true;
    return false;
  }

  // return world ID for a specific town
  getTownID(c, r) {
    let townID = -1;
    if (this.isTown(c, r)) {
      let key = this.townLookup[`${c}:${r}`];
      townID = this.towns[key].worldID;
      console.log(`Entering ${key}`);
    }
    return townID;
  }

  // place towns
  // towns is the object
  // townLookup points to the town based on a key of `c:r`
  // tbd - need to incorporate world index
  placeTowns() {
    let _grid = this.getGrid();

    let _towns = {};
    let _townLookup = {};

    for (let i = 0; i < 5; i++) {
      let _n = `Town ${i}`;
      let t = { r: 0, c: 0, worldID: i + 1 };
      this.placeObject(t);
      _towns[_n] = t;
      _townLookup[`${t.c}:${t.r}`] = _n;

      if (i == 0) {
        _grid[t.r][t.c].type = Tiles.town;
        _towns[_n].type = Tiles.town;
      } else {
        _grid[t.r][t.c].type = Tiles.dungeon;
        _towns[_n].type = Tiles.dungeon;
      }
      _grid[t.r][t.c].worldID = i + 1;

      // TBD - abstract better
      let _x = t.c / 5;
      let _y = t.r / 5;
      this.minimaps[0].fill(color(255, 0, 0));
      this.minimaps[0].noStroke();
      this.minimaps[0].rect(_x, _y, 2);
    }

    // dirt around towns
    //     for (let _t Vin _towns) {
    //       let _cell = this.grid[_towns[_t].r][_towns[_t].c];

    //       for (let j = 0; j < _cell.neighbors.length; j++) {
    //         let _g = _cell.neighbors[j];
    //         // console.log(_g);
    //         if (this.getCell(_g).type != Tiles.town) {
    //           this.grid[_g.r][_g.c].type = Tiles.dirt1;
    //         }
    //       }
    //     }

    console.log(_townLookup);
    return { towns: _towns, townLookup: _townLookup };
  }

  // generate the sub-worlds
  generateSubWorlds() {
    // generate enough sub-worlds for each town
    // - not guaranteed to be in order...
    for (let i = 0; i < this.towns.length; i++) {
      this.world.push({});
    }

    // generate sub-floors
    console.log(this.towns)
    for (let town in this.towns) {
      let _grid = [];
      if (this.towns[town].type == Tiles.town) {
        for (let r = 0; r < this.subRows; r++) {
          _grid[r] = [];
          for (let c = 0; c < this.subCols; c++) {
            _grid[r][c] = {};
            _grid[r][c].walkable = true;
            _grid[r][c].type = Tiles.dirt1;
            if (random() > 0.98)
              _grid[r][c].type = random([Tiles.grass1, Tiles.grass2, Tiles.grass3]);

            if (r == 0 || r == this.subRows - 1 || c == 0 || c == this.subCols - 1) {
              _grid[r][c].walkable = false;
              _grid[r][c].type = random(TREES);
            }
          }
        }

      } else {
        let alg = random(["randomWalker", "CA"]); //, "BSP"]);
        let caChance = 0.45;

        for (let r = 0; r < this.subRows; r++) {
          _grid[r] = [];
          for (let c = 0; c < this.subCols; c++) {
            _grid[r][c] = {};

            // if (r > 0 && r < 20 && c > 0 && c < 20) {
            //   _grid[r][c].walkable = true;
            //   _grid[r][c].type = Tiles.dirt1;
            // } else {
            _grid[r][c].walkable = false;
            _grid[r][c].type = Tiles.space1;

            // initialize CA generation
            if (alg == "CA" && random() < caChance) {
              _grid[r][c].walkable = true;
              _grid[r][c].type = Tiles.dirt1;
            }
          }
        }

        // neighbors
        for (let r = 0; r < this.subRows; r++) {
          for (let c = 0; c < this.subCols; c++) {
            _grid[r][c].neighbors = [];
            _grid[r][c].previous = undefined;
            this.addNeighbors(_grid[r][c], c, r, this.subCols, this.subRows);
          }
        }

        // random walker
        if (alg == "randomWalker") {
          let start_r = int(this.subRows / 2);
          let start_c = int(this.subCols / 2);

          let walker_r = start_r;
          let walker_c = start_c;
          let timer = 100000;

          _grid[walker_r][walker_c].walkable = true;
          _grid[walker_r][walker_c].type = Tiles.dirt1;

          while (timer > 0) {
            let _dir_r = random([-1, 0, 1]);
            let _dir_c = random([-1, 0, 1]);

            let _next_r = _dir_r + walker_r;
            let _next_c = _dir_c + walker_c;

            if (_next_r > 0 && _next_r < this.subRows - 1) walker_r = _next_r;
            if (_next_c > 0 && _next_c < this.subCols - 1) walker_c = _next_c;

            _grid[walker_r][walker_c].type = Tiles.dirt1;
            if (random() > 0.9)
              _grid[walker_r][walker_c].type = random([
                Tiles.grass1,
                Tiles.grass2,
                Tiles.grass3,
              ]);
            _grid[walker_r][walker_c].walkable = true;

            // random restart
            if (random() > 0.99) {
              walker_r = start_r;
              walker_c = start_c;
            }
            timer--;
          }

          // neighbors for walkable drawing
          // for (let r = 0; r < this.numRows; r++) {
          //   for (let c = 0; c < this.numCols; c++) {
          //     if (_grid[r][c].walkable == true) {
          //       _grid[r][c].neighbors = [];
          //       _grid[r][c].previous = undefined;
          //       this.addNeighbors(_grid[r][c], c, r);
          //     }
          //   }
          // }
          // cellular automata
        } else if (alg == "CA") {
          let caSteps = 10; //5;//random(3,5);
          let deathLimit = 3; //random(2,4);
          let birthLimit = 4; //deathLimit+1;

          for (let s = 0; s < caSteps; s++) {
            let _newGrid = [];
            for (let r = 0; r < this.subRows; r++) {
              _newGrid[r] = [];
              for (let c = 0; c < this.subCols; c++) {
                _newGrid[r][c] = { walkable: true, type: Tiles.dirt1 };

                // count of neighbors
                let aliveCount = 0;
                for (let n = 0; n < _grid[r][c].neighbors.length; n++) {
                  let _n = this.getCell(_grid[r][c].neighbors[n], _grid);
                  if (_n.walkable) aliveCount++;
                }

                // cell alive but too few neighbors, kill
                if (_grid[r][c].walkable) {
                  if (aliveCount < deathLimit) {
                    _newGrid[r][c].walkable = false;
                    _newGrid[r][c].type = Tiles.space1;
                  } else {
                    _newGrid[r][c].walkable = true;
                    _newGrid[r][c].type = Tiles.dirt1;
                  }
                  // cell dead
                } else {
                  if (aliveCount > birthLimit) {
                    _newGrid[r][c].walkable = true;
                    _newGrid[r][c].type = Tiles.dirt1;
                  } else {
                    _newGrid[r][c].walkable = false;
                    _newGrid[r][c].type = Tiles.space1;
                  }
                }
              }
            }

            // copy new to old
            for (let r = 0; r < this.subRows; r++) {
              for (let c = 0; c < this.subCols; c++) {
                _grid[r][c].walkable = _newGrid[r][c].walkable;
                _grid[r][c].type = _newGrid[r][c].type;
              }
            }
          }
        }
      }

      // add to main object
      let _w = {};
      _w.grid = _grid;
      _w.numRows = this.subRows;
      _w.numCols = this.subCols;
      this.world[this.towns[town].worldID] = _w;
    }
  }

  generateWorld() {
    let _world = [];
    let _grid = [];

    // basic noise gen
    for (let r = 0; r < this.numRows; r++) {
      _grid[r] = [];
      for (let c = 0; c < this.numCols; c++) {
        _grid[r][c] = {};

        let _n = noise(c * 0.01, r * 0.01);
        let _surround = false;
        if (_n < 0.25) {
          _grid[r][c].type = random([Tiles.space1, Tiles.space2]);

          this.minimaps[0].fill(color(0));
        } else if (_n < 0.4) {
          _grid[r][c].type = random([Tiles.grass1, Tiles.grass2, Tiles.grass3]);
          this.minimaps[0].fill(color(0, 180, 0));
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

          this.minimaps[0].fill(color(0, 255, 0));
        } else if (_n < 0.8) {
          _grid[r][c].type = random([Tiles.grass1, Tiles.grass2, Tiles.grass3]);
          this.minimaps[0].fill(color(0, 180, 0));
        } else {
          _grid[r][c].type = random([Tiles.space1, Tiles.space2]);
          this.minimaps[0].fill(color(0));
        }

        // TBD - abstract better
        let _x = c / 5;
        let _y = r / 5;
        this.minimaps[0].noStroke();
        this.minimaps[0].rect(_x, _y, 2);

        _grid[r][c].walkable = false;
        if (WALKABLE.indexOf(_grid[r][c].type) >= 0)
          _grid[r][c].walkable = true;

        // pathing information
        _grid[r][c].neighbors = [];
        _grid[r][c].previous = undefined;
        this.addNeighbors(_grid[r][c], c, r, this.numCols, this.numRows);
      }
    }
    // return _grid;

    let _w = {};
    _w.grid = _grid;
    _w.numRows = _grid.length;
    _w.numCols = _grid[0].length;
    _world.push(_w);

    //     console.log(_world);
    return _world; //_grid;
  }

  // expects {r:r, c:c}
  getCell(g, in_grid = null) {
    let _grid;
    if (in_grid == null) _grid = this.getGrid();
    else _grid = in_grid;

    return _grid[g.r][g.c];
    // let _grid = this.getGrid();
    // return _grid[g.r][g.c];
  }

  // add neighboring cells
  // take in numrows/cols as this can be called prior to world init
  addNeighbors(g, c, r, numC, numR) {
    //, nCols, nRows) {
    // left
    if (c > 0) g.neighbors.push({ c: c - 1, r: r });
    // right
    if (c < numC - 1) g.neighbors.push({ c: c + 1, r: r });

    // top
    if (r > 0) g.neighbors.push({ r: r - 1, c: c });
    // bottom
    if (r < numR - 1) g.neighbors.push({ r: r + 1, c: c });

    // top left
    if (c > 0 && r > 0) g.neighbors.push({ r: r - 1, c: c - 1 });
    // top right
    if (c < numC - 1 && r > 0) g.neighbors.push({ r: r - 1, c: c + 1 });
    // bottom left
    if (c > 0 && r < numR - 1) g.neighbors.push({ r: r + 1, c: c - 1 });
    // bottom right
    if (c < numC - 1 && r < numR - 1) g.neighbors.push({ r: r + 1, c: c + 1 });
  }

  drawTile(x, y, c, r, cs = null) {
    let _grid = this.getGrid();

    let _cellsize = this.cellSize;
    let _halfcell = this.halfCellSize;

    if (cs != null) {
      _cellsize = cs;
      _halfcell = cs / 2;
    }

    // let _grid = this.grid;//this.getGrid();
    let _t = _grid[r][c]; //_grid[r][c];

    if (asciiMode) {
      // text
      fill(color(_t.type.color));
      if (_t.type.ascii == " ") square(x, y, _cellsize);
      else text(_t.type.ascii, x + _halfcell, y + _halfcell);
    } else {
      // sprite
      image(
        spriteSheet,
        x,
        y,
        _cellsize,
        _cellsize,
        _t.type.c * spriteSize,
        _t.type.r * spriteSize,
        spriteSize,
        spriteSize
      );
    }
  }

  drawUI() {
    let player_pos = getPlayerPos();
    let numC = this.getCols();
    let numR = this.getRows();

    noStroke();
    fill(color(120, 20, 20));
    rect(0, 0, width, this.border_offset);
    fill(255);

    textAlign(LEFT, CENTER);
    text(`[${player.hp}/${player.maxHP}]`, 5, this.halfCellSize);

    textAlign(CENTER, CENTER);
    text(
      `microRL [${player_pos.c}/${numC - 1}:${player_pos.r}/${numR - 1}]`,
      halfScreenWidth,
      this.halfCellSize //- 4
    );
  }

  draw() {
    background(0);
    this.drawUI();

    let player_pos = getPlayerPos();
    let numC = this.getCols();
    let numR = this.getRows();

    // http://www.roguebasin.com/index.php/Scrolling_map

    /** DEBUG WHOLE MAP DRAW **/
    if (debugZoom) {
      let y = 0;
      let cs = width / numC;
      for (let r = 0; r < numR; r++) {
        let x = 0;
        for (let c = 0; c < numC; c++) {
          this.drawTile(x, y, c, r, cs);
          x += cs;
        }
        x = 0;
        y += cs;
      }
      // NORMAL CAMERA
    } else {
      let starty, startx, endy, endx;

      if (player_pos.c < this.halfCamC) startx = 0;
      else if (player_pos.c >= numC - this.halfCamC)
        startx = numC - this.camCols;
      else startx = player_pos.c - this.halfCamC;

      if (player_pos.r < this.halfCamR) starty = 0;
      else if (player_pos.r >= numR - this.halfCamR)
        starty = numR - this.camRows;
      else starty = player_pos.r - this.halfCamR;

      // draw in camera range
      let _x = 0;
      let _y = this.border_offset;

      // draw entities in view
      let entities = [];
      if (
        this.moveableEntities[this.worldIndex] != undefined &&
        this.moveableEntities[this.worldIndex].length > 0
      ) {
        entities = this.moveableEntities[this.worldIndex].filter(
          (e) =>
            e.r >= starty &&
            e.r < starty + this.camRows &&
            e.c >= startx &&
            e.c < startx + this.camCols
        );
      }

      for (let r = starty; r < starty + this.camRows; r++) {
        _x = 0;
        for (let c = startx; c < startx + this.camCols; c++) {
          // draw map feature before drawing base layer
          // let _n = `${c}:${r}`;
          // if (_n in this.townLookup)

          this.drawTile(_x, _y, c, r);

          // can just move this down later if it is too slow...
          for (let i = entities.length - 1; i >= 0; i--) {
            let e = entities[i];
            if (e.r == r && e.c == c) {
              if (asciiMode) {
                fill(e.color);
                text(e.sprite, _x + this.halfCellSize, _y + this.halfCellSize);
              } else {
                // sprite
                let _col = color(e.color); //Tiles.player.color);
                _col.setAlpha(140);
                fill(_col);
                square(_x, _y, this.cellSize);
                image(
                  spriteSheet,
                  _x,
                  _y,
                  this.cellSize,
                  this.cellSize,
                  e.ssSprite.c * spriteSize,
                  e.ssSprite.r * spriteSize,
                  // Tiles.enemy.c * spriteSize,
                  // Tiles.enemy.r * spriteSize,
                  spriteSize,
                  spriteSize
                );
              }
              entities.splice(i, 1);
            }
          }

          // draw player
          if (r == player_pos.r && c == player_pos.c) {
            // tbd: abstract later
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
                player.ssSprite.c * spriteSize,
                player.ssSprite.r * spriteSize,
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
    if (dithered) dither(null);

    // minimap
    let _x = width - 100;
    let _y = 0;
    image(this.minimaps[0], _x, _y);
    _x = _x + player_pos.c / 5;
    _y = _y + player_pos.r / 5;
    drawShadow(0, 0, 5, color(20));
    fill(color(255, 0, 255));
    noStroke();
    rect(_x, _y, 2);
    drawShadow(0, 0, 0, 0);

    // draw chat messages
    _x = 10;
    _y = height - (world.cellSize >> 1);
    textSize(world.cellSize);
    textAlign(LEFT, CENTER);
    rectMode(CORNER);
    while (chatQueue.length > 5) chatQueue.splice(0, 1);
    for (let i = chatQueue.length - 1; i >= 0; i--) {
      let chat = chatQueue[i];
      let a = map(chat.time, 10, 0, 255, 20);
      let txt = `${chat.npc}: ${chat.msg}`;
      let tw = textWidth(txt);

      noStroke();
      fill(color(20, 20, 20, a));
      rect(_x, _y - world.halfCellSize, tw, world.cellSize);

      fill(color(255, 255, 255, a));

      text(txt, _x, _y);
      _y -= world.cellSize;

      chat.time--;
      if (chat.time <= 0) chatQueue.splice(i, 1);
    }
  }
}

// A* helpers

// Function to delete element from the array
function removeFromArray(arr, elt) {
  // Could use indexOf here instead to be more efficient
  for (var i = arr.length - 1; i >= 0; i--) {
    if (arr[i] == elt) {
      arr.splice(i, 1);
    }
  }
}
// An educated guess of how far it is between two points
function heuristic(a, b) {
  var d = dist(a.i, a.j, b.i, b.j);
  // var d = abs(a.i - b.i) + abs(a.j - b.j);
  return d;
}

// https://p5js.org/reference/#/p5/drawingContext
function drawShadow(x, y, b, c, g = null) {
  if (g == null) {
    drawingContext.shadowOffsetX = x;
    drawingContext.shadowOffsetY = y;
    drawingContext.shadowBlur = b; // * scale;
    drawingContext.shadowColor = c;
  } else {
    g.drawingContext.shadowOffsetX = x;
    g.drawingContext.shadowOffsetY = y;
    g.drawingContext.shadowBlur = b; // * scale;
    g.drawingContext.shadowColor = c;
  }
}

function setGameMode(mode) {
  gameMode = mode;

  if (mode == GameModes.DEAD) {
    gameModeTimer = 25;
  }
}
