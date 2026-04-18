export class NoiseUtils {
    private static _hash(n: number): number {
        n = Math.sin(n) * 43758.5453123;
        return n - Math.floor(n);
    }

    public static perlin1D(x: number): number {
        const i = Math.floor(x);
        const f = x - i;
        const u = f * f * (3.0 - 2.0 * f);
        return (1.0 - u) * this._hash(i) + u * this._hash(i + 1.0);
    }
}
