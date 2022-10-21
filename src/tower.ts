import { Container, Graphics, Point, Polygon } from "pixi.js";
import { Enemy } from "./enemy";
import { SelectTower } from "./main";
import { Projectile } from "./projectile";

export class Tower {
  graphics: Graphics;
  private readonly map: Container;
  radius: number;
  private readonly shotsPerMinute: number;
  private dateOfLastShot: number;
  public projectiles: Projectile[];

  constructor(x: number, y: number, map: Container, selectTower: SelectTower) {
    this.map = map;
    this.shotsPerMinute = 480;
    this.dateOfLastShot = 0;
    this.radius = 160;
    const radius = new Graphics();

    radius
      .beginFill(0x9999ff, 0.2)
      .lineStyle(4, 0xffffff, 0.1, 0)
      .drawCircle(0, 0, this.radius)
      .endFill();

    radius.name = "radius";
    // radius.hitArea = new Polygon([0, 0, 10, 0, 10, 10, 0, 10]);

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
    tower.interactive = true;
    tower.buttonMode = true;
    tower.on("mousedown", () => {
      selectTower(this);
    });
    this.graphics = radius;
    map.addChild(this.graphics);
    this.projectiles = [];
  }

  public upgrade(): void {
    this.radius = Math.round(this.radius + 32);
    this.graphics.clear();

    this.graphics
      .beginFill(0x9999ff, 0.2)
      .lineStyle(4, 0xffffff, 0.1, 0)
      .drawCircle(0, 0, this.radius)
      .endFill();
  }

  public canShoot(): boolean {
    const answer =
      (new Date().getTime() - this.dateOfLastShot) / 1000 >=
      60 / this.shotsPerMinute;
    return answer;
  }

  public isEnemyInRange(location: Point, radius: number): boolean {
    const towerPosition = this.graphics.getGlobalPosition();

    const distanceBetweenOrigins = Math.hypot(
      location.x - towerPosition.x,
      location.y - towerPosition.y
    );
    const isInsideBounds = distanceBetweenOrigins <= 20 + this.radius;
    return isInsideBounds;
  }

  removeProjectile(projectile: Projectile): void {
    this.map.removeChild(projectile.graphics);

    this.projectiles = this.projectiles.filter(
      (projectile2) => projectile !== projectile2
    );
  }

  shoot(enemy: Enemy): void {
    this.dateOfLastShot = new Date().getTime();

    this.projectiles = this.projectiles.concat(
      new Projectile(
        enemy,
        this.graphics.position.x,
        this.graphics.position.y,
        this.map
      )
    );
  }
}
