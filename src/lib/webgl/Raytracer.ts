/**
 * Raytracing utilities for hit testing
 * Ported from Evan Wallace's lightgl.js
 */
import { GLContextExtended } from './GLContext';
import { Vector } from './Vector';

export class HitTest {
  t: number;
  hit: Vector | undefined;
  normal: Vector | undefined;

  constructor(t?: number, hit?: Vector, normal?: Vector) {
    this.t = t !== undefined ? t : Number.MAX_VALUE;
    this.hit = hit;
    this.normal = normal;
  }

  mergeWith(other: HitTest) {
    if (other.t > 0 && other.t < this.t) {
      this.t = other.t;
      this.hit = other.hit;
      this.normal = other.normal;
    }
  }
}

export class Raytracer {
  eye: Vector;
  ray00: Vector;
  ray10: Vector;
  ray01: Vector;
  ray11: Vector;
  viewport: number[];

  constructor(gl: GLContextExtended) {
    const v = gl.getParameter(gl.VIEWPORT) as number[];
    const m = gl.modelviewMatrix.m;

    const axisX = new Vector(m[0], m[4], m[8]);
    const axisY = new Vector(m[1], m[5], m[9]);
    const axisZ = new Vector(m[2], m[6], m[10]);
    const offset = new Vector(m[3], m[7], m[11]);
    this.eye = new Vector(-offset.dot(axisX), -offset.dot(axisY), -offset.dot(axisZ));

    const minX = v[0];
    const maxX = minX + v[2];
    const minY = v[1];
    const maxY = minY + v[3];
    this.ray00 = gl.unProject(minX, minY, 1).subtract(this.eye);
    this.ray10 = gl.unProject(maxX, minY, 1).subtract(this.eye);
    this.ray01 = gl.unProject(minX, maxY, 1).subtract(this.eye);
    this.ray11 = gl.unProject(maxX, maxY, 1).subtract(this.eye);
    this.viewport = v;
  }

  getRayForPixel(x: number, y: number): Vector {
    x = (x - this.viewport[0]) / this.viewport[2];
    y = 1 - (y - this.viewport[1]) / this.viewport[3];
    const ray0 = Vector.lerp(this.ray00, this.ray10, x);
    const ray1 = Vector.lerp(this.ray01, this.ray11, x);
    return Vector.lerp(ray0, ray1, y).unit();
  }

  static hitTestBox(origin: Vector, ray: Vector, min: Vector, max: Vector): HitTest | null {
    const tMin = min.subtract(origin).divide(ray);
    const tMax = max.subtract(origin).divide(ray);
    const t1 = Vector.min(tMin, tMax);
    const t2 = Vector.max(tMin, tMax);
    const tNear = t1.max();
    const tFar = t2.min();

    if (tNear > 0 && tNear < tFar) {
      const epsilon = 1.0e-6;
      const hit = origin.add(ray.multiply(tNear));
      const minE = min.add(epsilon);
      const maxE = max.subtract(epsilon);
      return new HitTest(tNear, hit, new Vector(
        Number(hit.x > maxE.x) - Number(hit.x < minE.x),
        Number(hit.y > maxE.y) - Number(hit.y < minE.y),
        Number(hit.z > maxE.z) - Number(hit.z < minE.z)
      ));
    }

    return null;
  }

  static hitTestSphere(origin: Vector, ray: Vector, center: Vector, radius: number): HitTest | null {
    const offset = origin.subtract(center);
    const a = ray.dot(ray);
    const b = 2 * ray.dot(offset);
    const c = offset.dot(offset) - radius * radius;
    const discriminant = b * b - 4 * a * c;

    if (discriminant > 0) {
      const t = (-b - Math.sqrt(discriminant)) / (2 * a);
      const hit = origin.add(ray.multiply(t));
      return new HitTest(t, hit, hit.subtract(center).divide(radius));
    }

    return null;
  }

  static hitTestTriangle(origin: Vector, ray: Vector, a: Vector, b: Vector, c: Vector): HitTest | null {
    const ab = b.subtract(a);
    const ac = c.subtract(a);
    const normal = ab.cross(ac).unit();
    const t = normal.dot(a.subtract(origin)) / normal.dot(ray);

    if (t > 0) {
      const hit = origin.add(ray.multiply(t));
      const toHit = hit.subtract(a);
      const dot00 = ac.dot(ac);
      const dot01 = ac.dot(ab);
      const dot02 = ac.dot(toHit);
      const dot11 = ab.dot(ab);
      const dot12 = ab.dot(toHit);
      const divide = dot00 * dot11 - dot01 * dot01;
      const u = (dot11 * dot02 - dot01 * dot12) / divide;
      const v = (dot00 * dot12 - dot01 * dot02) / divide;
      if (u >= 0 && v >= 0 && u + v <= 1) {
        return new HitTest(t, hit, normal);
      }
    }

    return null;
  }
}
