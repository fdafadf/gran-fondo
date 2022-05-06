// @ts-check

/**
 * @typedef {{ x: number, y: number }} Point2d
 * @typedef {{ min: Point2d, max: Point2d }} Bounds2d
 */

export class Projection
{
    /**
     * @param {Bounds2d} src 
     * @param {Bounds2d} dst 
     */
    constructor(src, dst)
    {
        this.src = src;
        this.dst = dst;
        this.scale_x = (dst.max.x - dst.min.x) / (src.max.x - src.min.x);
        this.scale_y = (dst.max.y - dst.min.y) / (src.max.y - src.min.y);
    }

    /**
     * @param {Point2d} point 
     * @returns {Point2d}
     */
    transform(point)
    {
        let x = (point.x - this.src.min.x) * this.scale_x + this.dst.min.x;
        let y = (point.y - this.src.min.y) * this.scale_y + this.dst.min.y;
        return { x, y };
    }

    // /**
    //  * @param {import("./Gpx").GpxPoint} point 
    //  * @returns {Point2d}
    //  */
    // transformGpx(point)
    // {
    //     let x = (point.lon - this.src.min.x) * this.scale_x + this.dst.min.x;
    //     let y = (point.lat - this.src.min.y) * this.scale_y + this.dst.min.y;
    //     return { x, y };
    // }
}