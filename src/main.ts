import { Application, Graphics, Container, Text } from "pixi.js";
import { Viewport } from "pixi-viewport";
import "./index.css";
import { Enemy, EnemyKilledError, OutOfBoundsError } from "./enemy";
import { Tower } from "./tower";
import { HitEnemyError } from "./projectile";

abstract class Tile {
  abstract get graphics(): Graphics;
}

class Road extends Tile {
  private readonly _graphics: Graphics;

  constructor() {
    super();
    const graphics = new Graphics();
    graphics
      .beginFill(0x444444)
      .lineStyle(4, 0xffffff, 0.1, 0)
      .drawRect(0, 0, 64, 64)
      .endFill();
    this._graphics = graphics;
  }

  get graphics(): Graphics {
    return this._graphics;
  }
}

class Land extends Tile {
  private readonly _graphics: Graphics;
  public hasTower: boolean;
  public tower?: Tower;

  constructor() {
    super();
    const graphics = new Graphics();
    graphics
      .beginFill(0x339933)
      .lineStyle(4, 0xffffff, 0.1, 0)
      .drawRect(0, 0, 64, 64)
      .endFill();
    graphics.interactive = true;
    graphics.sortableChildren = true;
    graphics.on("mousedown", (e) => {
      if (e.data.button === 0) {
        this.addTower();
      }
    });
    this._graphics = graphics;
    this.hasTower = false;
    const projectileGraphics = new Graphics();
    projectileGraphics
      .beginFill(0, 111111)
      .drawCircle(this._graphics.position.x, this._graphics.position.y, 10)
      .endFill();
  }

  get center(): { x: number; y: number } {
    return {
      x: this.graphics.position.x + this.graphics.width / 2,
      y: this.graphics.position.y + this.graphics.height / 2,
    };
  }

  private addTower(): void {
    if (this.hasTower) {
      return undefined;
    }
    this.tower = new Tower(this.center.x, this.center.y, map, selectTower);
    this.hasTower = true;
  }

  get graphics(): Graphics {
    return this._graphics;
  }
}

const Map = [
  [new Land(), new Land(), new Road(), new Land(), new Land(), new Land()],
  [new Land(), new Land(), new Road(), new Land(), new Land(), new Land()],
  [new Land(), new Land(), new Road(), new Land(), new Land(), new Land()],
  [new Land(), new Land(), new Road(), new Road(), new Road(), new Land()],
  [new Land(), new Land(), new Land(), new Land(), new Road(), new Land()],
  [new Land(), new Land(), new Land(), new Land(), new Road(), new Land()],
];

const app = new Application({
  view: document.getElementById("app") as HTMLCanvasElement,
  autoDensity: true,
  backgroundColor: 0x111111,
  width: 1280,
  height: 720,
  antialias: true,
});

const viewport = new Viewport({
  screenWidth: window.innerWidth,
  screenHeight: window.innerHeight,
  worldHeight: 200,
  worldWidth: 200,

  interaction: app.renderer.plugins.interaction, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
});
viewport.position.set(0, 0);

const menu = new Container();
const menuBg = new Graphics();
menuBg.beginFill(0x999999).drawRect(0, 0, 300, 720).endFill();
menu.addChild(menuBg);

app.stage.addChild(viewport);
// app.stage.addChild(menu);

viewport
  .drag({
    mouseButtons: "middle",
    // keyToPress: ["ShiftLeft"]
  })
  .pinch()
  .wheel({ smooth: 5 })
  .decelerate({
    friction: 0.9,
  });

const map = new Container();
map.position.set(400, 160);
map.sortableChildren = true;
Map.forEach((tiles, xi) =>
  tiles.forEach((tile, yi) => {
    const graphicsTile = tile.graphics;
    graphicsTile.position.set(64 * xi, 64 * yi);
    map.addChild(graphicsTile);
  })
);

viewport.addChild(map);

let enemy: Enemy | undefined;

let enemies: Enemy[] = [];

const newEnemy = (enemy: Enemy): void => {
  enemies.push(enemy);
  map.addChild(enemy.container);
};

const deleteEnemy = (enemy: Enemy): void => {
  enemies = enemies.filter((enemy2) => enemy2 !== enemy);
  map.removeChild(enemy.container);
};

const moveEnemies = (delta: number): void => {
  enemies.forEach((enemy) => {
    try {
      enemy.move(delta);
    } catch (error) {
      if (error instanceof OutOfBoundsError) {
        deleteEnemy(enemy);
      }
    }
  });
};

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === "a") {
    // spawnMonster();
    enemy = new Enemy();
    newEnemy(enemy);
    // map.addChild(enemy.graphics);
  }
};

window.addEventListener("keydown", onKeyDown);

const uiContainer = new Container();
const ui = new Graphics();
ui.beginFill(0x333333).drawRect(0, 0, 360, 200).endFill();
ui.position.set(app.screen.width, 0);
uiContainer.addChild(ui);
uiContainer.pivot.set(uiContainer.width, 0);
app.stage.addChild(uiContainer);

let selectedTower: Tower | undefined = undefined;

export type SelectTower = typeof selectTower;

const textContent = `Tower radius`;
const text = new Text(textContent, { fill: 0x000000, fontSize: 24 });
text.position.set(8, 8);
const upgradeButtonText = new Text("Upgrade", {
  fill: 0x000000,
  padding: 32,
});
upgradeButtonText.position.set(16, 4);

const upgradeButton = new Graphics();
upgradeButton
  .beginFill(0x555555)
  .drawRect(0, 0, upgradeButtonText.width + 32, 40)
  .endFill();

upgradeButton.position.set(8, 48);
upgradeButton.interactive = false;
upgradeButton.buttonMode = false;

// text.text = "Omega";

upgradeButton.addChild(upgradeButtonText);
ui.addChild(text, upgradeButton);

const selectTower = (tower: Tower): void => {
  upgradeButton.removeAllListeners();
  text.text = `Tower radius: ${tower.radius}`;
  upgradeButton.clear();
  upgradeButton.interactive = true;
  upgradeButton.buttonMode = true;
  upgradeButton
    .beginFill(0x00ff00)
    .drawRect(0, 0, upgradeButtonText.width + 32, 40)
    .endFill();
  upgradeButton.position.set(8, 48);

  selectedTower = tower;
  upgradeButton.on("mousedown", () => {
    tower.upgrade();
    selectTower(tower);
  });
};

app.ticker.add((delta) => {
  moveEnemies(delta);

  Map.flat()
    .filter((tile) => tile instanceof Land && tile.tower)
    .forEach((landTile) => {
      enemies.forEach((enemy) => {
        const isInRange = (landTile as Land).tower?.isEnemyInRange(
          enemy.container.getGlobalPosition(),
          20
        );

        if (isInRange && (landTile as Land).tower?.canShoot()) {
          (landTile as Land).tower?.shoot(enemy);
        }
      });
    });

  Map.flat()
    .filter((tile) => tile instanceof Land && tile.tower)
    .map((landTile) => (landTile as Land).tower)
    .forEach((tower) => {
      tower?.projectiles.forEach((projectile) => {
        if (projectile.target.isDead) {
          tower.removeProjectile(projectile);
        } else {
          try {
            projectile.move(delta);
          } catch (error) {
            if (error instanceof HitEnemyError) {
              tower.removeProjectile(projectile);
            } else if (error instanceof EnemyKilledError) {
              deleteEnemy(projectile.target);
            }
          }
        }
      });
    });
});
