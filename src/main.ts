import {
  Application,
  Graphics,
  Container,
  Polygon,
  filters,
  Rectangle,
  Point,
} from "pixi.js";
import { Viewport } from "pixi-viewport";
import "./index.css";

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
    this.tower = new Tower(this.center.x, this.center.y);
    this.hasTower = true;
  }

  get graphics(): Graphics {
    return this._graphics;
  }
}

class Tower {
  graphics: Graphics;
  public projectiles: Projectile[];

  constructor(x: number, y: number) {
    const radius = new Graphics();

    radius
      .beginFill(0x9999ff, 0.2)
      .lineStyle(4, 0xffffff, 0.1, 0)
      .drawCircle(0, 0, 64 + 32 + 64)
      .endFill();

    radius.name = "radius";
    radius.hitArea = new Polygon([0, 0, 10, 0, 10, 10, 0, 10]);

    radius.interactive = false;

    const tower = new Graphics();
    tower
      .beginFill(0x666666)
      .lineStyle(4, 0xffffff, 0.1, 0)
      .drawCircle(0, 0, 20)
      .endFill();
    radius.addChild(tower);
    radius.pivot.set(0, 0);
    radius.position.set(x, y);
    // radius.tint = 0xff0000;
    this.graphics = radius;
    map.addChild(this.graphics);
    this.projectiles = [];
  }

  public isEnemyInRange(location: Point, radius: number): boolean {
    // const towerPosition = towerRadius.getGlobalPosition();
    const towerPosition = this.graphics.getGlobalPosition();

    const distanceBetweenOrigins =
      (location.x - towerPosition.x) * (location.x - towerPosition.x) +
      (location.y - towerPosition.y) * (location.y - towerPosition.y);

    const isInsideBounds = distanceBetweenOrigins <= (20 + 160) * 160;
    if (isInsideBounds) {
      const filter = new filters.ColorMatrixFilter();
      filter.tint(0xff0000);
      this.graphics.filters = [filter];
    } else {
      this.graphics.filters = [];
    }
    return isInsideBounds;
    // return false;
  }

  removeProjectile(projectile: Projectile): void {
    map.removeChild(projectile.graphics);

    this.projectiles = this.projectiles.filter(
      (projectile2) => projectile !== projectile2
    );
  }

  shoot(enemy: Enemy): void {
    if (this.projectiles.length > 0) {
      return;
    }

    this.projectiles = [
      new Projectile(enemy, this.graphics.position.x, this.graphics.position.y),
    ];
  }
}

class OutOfBoundsError extends Error {}

export class Enemy {
  readonly graphics: Graphics;
  readonly container: Container;
  private readonly path: [number, number][];
  private pathIndex: number;
  private speed: number;
  private healthAmount: number;
  private readonly maxHealth: number;
  private readonly health: Graphics;

  constructor() {
    const container = new Container();
    this.container = container;
    const graphics = new Graphics();
    this.path = [
      [-32, 128 + 32],
      [192 + 32, 128 + 32],
      [192 + 32, 256 + 32],
      [352 + 64, 256 + 32],
    ];
    this.healthAmount = 100;
    this.maxHealth = 100;
    graphics
      .beginFill(0xaa4444)
      .lineStyle(4, 0xffffff, 0.1, 0)
      .drawCircle(20, 20, 20)
      .endFill();

    const healthBarContainer = new Container();
    healthBarContainer.position.set(0, 0);
    const healthBar = new Graphics();
    healthBar
      .beginFill(0xff0000)
      .lineStyle(1, 0x000000, undefined, 0)
      .drawRect(0, 0, 40, 10)
      .endFill();

    const health = new Graphics();
    health
      .beginFill(0x00ff00)
      .lineStyle(1, 0x00000, undefined, 0)
      .drawRect(0, 0, 40, 10)
      .endFill();
    this.health = health;
    healthBarContainer.addChild(healthBar);
    healthBarContainer.addChild(this.health);
    healthBarContainer.position.set(0, -20);
    // healthBar.addChild(this.health);
    // container.addChild(healthBar);
    container.addChild(graphics);
    container.addChild(healthBarContainer);
    container.pivot.set(20, 20);
    container.position.set(this.path[0][0], this.path[0][1]);
    this.graphics = graphics;
    this.pathIndex = 0;
    this.speed = 0.8;
  }

  move(delta: number): void {
    const xDiff = Math.round(
      this.path[this.pathIndex][0] - this.container.position.x
    );
    const yDiff = Math.round(
      this.path[this.pathIndex][1] - this.container.position.y
    );

    if (xDiff === 0 && yDiff === 0) {
      this.pathIndex += 1;
      if (this.path.length === this.pathIndex) {
        throw new OutOfBoundsError();
      }
    }

    this.container.position.x +=
      xDiff > 0 ? this.speed * delta : -this.speed * delta;
    this.container.position.y +=
      yDiff > 0 ? this.speed * delta : -this.speed * delta;
  }

  public takeDamage(damage: number): void {
    this.healthAmount -= damage;
    const healthRatio = this.healthAmount / this.maxHealth;
    this.health.scale.set(healthRatio, 1);
  }
}

class HitEnemyError extends Error {}

class Projectile {
  private readonly target: Enemy;
  readonly graphics: Graphics;

  constructor(target: Enemy, x: number, y: number) {
    this.target = target;
    const graphics = new Graphics();
    graphics
      .beginFill(0xaa4444)
      .lineStyle(4, 0xffffff, 0.1, 0)
      .drawCircle(0, 0, 10)
      .endFill();
    graphics.pivot.set(0, 0);
    graphics.position.set(x, y);
    this.graphics = graphics;
    this.target = target;
    map.addChild(this.graphics);
  }

  move(delta: number): void {
    const targetPosition = this.target.graphics.getGlobalPosition();
    // console.log(targetPosition);
    // console.log(this.target.graphics.getLocalBounds());
    // console.log(this.target.graphics.getGlobalPosition());
    const ownPosition = this.graphics.getGlobalPosition();
    console.log(targetPosition);
    console.log(ownPosition);

    const xDiff = ownPosition.x - targetPosition.x;
    const yDiff = ownPosition.y - targetPosition.y;

    if (Math.round(xDiff) === 0 && Math.round(yDiff) === 0) {
      this.target.takeDamage(20);
      throw new HitEnemyError();
    }

    const angle = Math.atan2(yDiff, xDiff);
    this.graphics.position.set(
      ownPosition.x + Math.cos(angle) * delta * 3,
      ownPosition.y + Math.sin(angle) * delta * 3
    );
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

// const x = new Container();
// const c = new Graphics();
// c.beginFill(0xffff00).drawRect(0, 0, 64, 64).endFill();
// x.addChild(c);
// const yy = new Container();
// const y = new Graphics();
// y.beginFill(0x00ffff).drawRect(0, -32, 64, 16).endFill();
// yy.addChild(y);
// x.addChild(yy);
// x.position.set(32, 32);
// x.pivot.set(32, 32);
// map.addChild(x);

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

app.ticker.add((delta) => {
  // const currentEnemy = enemy;
  moveEnemies(delta);

  Map.flat()
    .filter((tile) => tile instanceof Land && tile.tower)
    .forEach((landTile) => {
      enemies.forEach((enemy) => {
        const isInRange = (landTile as Land).tower?.isEnemyInRange(
          enemy.container.getGlobalPosition(),
          20
        );

        if (isInRange) {
          (landTile as Land).tower?.shoot(enemy);
        }
      });
    });

  Map.flat()
    .filter((tile) => tile instanceof Land && tile.tower)
    .map((landTile) => (landTile as Land).tower)
    .forEach((tower) => {
      tower?.projectiles.forEach((projectile) => {
        try {
          projectile.move(delta);
        } catch (error) {
          if (error instanceof HitEnemyError) {
            tower.removeProjectile(projectile);
          }
        }
      });
    });
  //   } catch (error) {
  //     if (error instanceof FinishPathError) {
  //       map.removeChild(currentEnemy.graphics);
  //       enemy = undefined;
  //     }
  //   }
  //   // enemy.current.graphics.position.x += 0.1 * delta;
  // }
});
