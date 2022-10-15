import { useEffect, useRef } from "react";
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
  }

  private addTower(): void {
    if (this.hasTower) {
      return undefined;
    }
    this.hasTower = true;
    const radius = new Graphics();

    radius
      .beginFill(0x9999ff, 0.2)
      .lineStyle(4, 0xffffff, 0.1, 0)
      .drawCircle(32, 32, 64 + 32 + 64)
      .endFill();

    radius.name = "radius";
    radius.hitArea = new Polygon([0, 0, 10, 0, 10, 10, 0, 10]);

    radius.interactive = false;
    this._graphics.zIndex = 1000;

    const tower = new Graphics();
    tower
      .beginFill(0x666666)
      .lineStyle(4, 0xffffff, 0.1, 0)
      .drawCircle(32, 32, 20)
      .endFill();
    radius.addChild(tower);
    // radius.tint = 0xff0000;
    this._graphics.addChild(radius);
  }

  public isEnemyInRange(location: Point, radius: number): boolean {
    const towerRadius = this.graphics.getChildByName("radius");

    const towerPosition = towerRadius.getGlobalPosition();

    const distanceBetweenOrigins =
      (location.x - towerPosition.x) * (location.x - towerPosition.x) +
      (location.y - towerPosition.y) * (location.y - towerPosition.y);

    const isInsideBounds = distanceBetweenOrigins <= (20 + 160) * 160;
    // bounds1.x < bounds2.x + bounds2.width &&
    // bounds1.x + bounds1.width > bounds2.x &&
    // bounds1.y < bounds2.y + bounds2.height &&
    // bounds1.y + bounds1.height > bounds2.y;

    // console.log(bounds);
    if (isInsideBounds) {
      const filter = new filters.ColorMatrixFilter();
      filter.tint(0xff0000);
      towerRadius.filters = [filter];
    } else {
      towerRadius.filters = [];
    }
    return isInsideBounds;
    // return false;
  }

  get graphics(): Graphics {
    return this._graphics;
  }
}

class FinishPathError extends Error {}

class Enemy {
  readonly graphics: Graphics;
  private readonly path: [number, number][];
  private pathIndex: number;
  private speed: number;

  constructor() {
    const graphics = new Graphics();
    this.path = [
      [-32, 128 + 32],
      [192 + 32, 128 + 32],
      [192 + 32, 256 + 32],
      [352 + 64, 256 + 32],
    ];
    graphics
      .beginFill(0xaa4444)
      .lineStyle(4, 0xffffff, 0.1, 0)
      .drawCircle(0, 0, 20)
      .endFill();

    graphics.position.set(this.path[0][0], this.path[0][1]);

    this.graphics = graphics;
    this.pathIndex = 0;
    this.speed = 0.8;
  }

  move(delta: number) {
    this.graphics.position;
    const xDiff = Math.round(
      this.path[this.pathIndex][0] - this.graphics.position.x
    );
    const yDiff = Math.round(
      this.path[this.pathIndex][1] - this.graphics.position.y
    );

    if (xDiff === 0 && yDiff === 0) {
      this.pathIndex += 1;
      if (this.path.length === this.pathIndex) {
        throw new FinishPathError();
      }
    }

    this.graphics.position.x +=
      xDiff > 0 ? this.speed * delta : -this.speed * delta;
    this.graphics.position.y +=
      yDiff > 0 ? this.speed * delta : -this.speed * delta;
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

function App() {
  const appRef = useRef<HTMLDivElement>(null);
  const appInstance = useRef<Application>();
  const enemy = useRef<Enemy>();

  useEffect(() => {
    const app = new Application({
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
    // viewport.addChild(rect, rect2, rect3);

    const spawnMonster = () => {};

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "a") {
        spawnMonster();
        enemy.current = new Enemy();
        map.addChild(enemy.current.graphics);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    app.ticker.add((delta) => {
      const currentEnemy = enemy.current;
      if (currentEnemy) {
        try {
          currentEnemy.move(delta);

          Map.flat()
            .filter((tile) => tile instanceof Land && tile.hasTower)
            .forEach((tower) => {
              const x = currentEnemy.graphics.getGlobalPosition();
              (tower as Land).isEnemyInRange(
                currentEnemy.graphics.getGlobalPosition(),
                20
              );
            });
        } catch (error) {
          if (error instanceof FinishPathError) {
            map.removeChild(currentEnemy.graphics);
            enemy.current = undefined;
          }
        }
        // enemy.current.graphics.position.x += 0.1 * delta;
      }
    });

    if (appRef.current) {
      appRef.current.appendChild(app.view);
    }
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      // app.destroy(true);
      app.stop();
      app.ticker.stop();
      if (appRef.current) {
        appRef.current.removeChild(app.view);
      }
    };
  }, []);

  return <div ref={appRef}></div>;
}

export default App;
