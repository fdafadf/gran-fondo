// @ts-check

import { Projection } from "./Projection.js";

/**
 * @typedef {{ lat: number, lon: number, ele: number, node: Element, total_distance: number, distance_to_previous_point: number, gradient: number, time: Date, time_to_previous_point: number }} GpxPoint
 * @typedef {{ start: { point: GpxPoint, distance_left: number }, end: { point: GpxPoint, distance_left: number }, time: number }} SplitItem 
 */

const PI_DIV_180 = Math.PI / 180;

export class Gpx
{
    static async load(url)
    {
        let content = await (await fetch(url)).text();
        let dom = new DOMParser().parseFromString(content, "text/xml");
        return new Gpx(dom);
    }

    /**
     * @param {Document} dom 
     */
    constructor(dom)
    {
        /** @type {Document} */
        this.dom = dom;
        this.points = [...this.dom.getElementsByTagName("trkpt")].map(Gpx._createPoint);
        this.lon_min = Math.min.apply(Math, this.points.map(p => p.lon));
        this.lon_max = Math.max.apply(Math, this.points.map(p => p.lon));
        this.lat_min = Math.min.apply(Math, this.points.map(p => p.lat));
        this.lat_max = Math.max.apply(Math, this.points.map(p => p.lat));
        this.ele_min = Math.min.apply(Math, this.points.map(p => p.ele));
        this.ele_max = Math.max.apply(Math, this.points.map(p => p.ele));
        this.total_distance = 0;
        let previous = this.points[0];
        previous.total_distance = 0;
        previous.distance_to_previous_point = 0;
        previous.time_to_previous_point = 0;
        
        for (let i = 1; i < this.points.length; i++)
        {
            let current = this.points[i];
            current.distance_to_previous_point = Gpx.distance(previous, current);
            current.time_to_previous_point = current.time.getTime() - previous.time.getTime();
            current.gradient = Gpx.gradient(previous, current);
            this.total_distance += current.distance_to_previous_point;
            current.total_distance = this.total_distance;
            previous = current;
        }

        this.gradient_min = Math.min.apply(Math, this.points.map(p => p.gradient));
        this.gradient_max = Math.max.apply(Math, this.points.map(p => p.gradient));
        this.gradient_max_d = 1 / this.gradient_max;
        this.gradient_min_d = 1 / this.gradient_min;

        // {
        //     let previous = this.points[0];
        //     let total_elevation = 0;

        //     for (let i = 1; i < this.points.length; i++)
        //     {
        //         let current = this.points[i];
        //         let elevation = current.ele - previous.ele;
                
        //         if (elevation > 0) total_elevation += elevation;
        //     }
        // }


        // prevoius_point = this.points[0];
        // prevoius_point.ele_diff = 0;
        
        // for (let i = 1; i < this.points.length; i++)
        // {
        //     let current_point = this.points[i];
        //     current_point.ele_diff = current_point.ele - prevoius_point.ele;
        //     current_point.gradient = current_point.ele_diff / current_point.distance_to_previous_point;
        //     prevoius_point = current_point;
        // }

        // this.gradient_min = Math.min.apply(Math, this.points.map(p => p.gradient));
        // this.gradient_max = Math.max.apply(Math, this.points.map(p => p.gradient));

        this.lon_lat_bounds = { min: { x: this.lon_min, y: this.lat_min }, max: { x: this.lon_max, y: this.lat_max } };
        //this.gradient_min = Math.min.apply(Math, this.points.map(p => p.gradient));
        //this.gradient_max = Math.max.apply(Math, this.points.map(p => p.gradient));
    }

    /**
     * @param {Number} resolution 
     * @returns {GpxPoint[]}
     */
    sample(resolution)
    {
        let points = [];

        for (let i = 0; i < this.points.length; i++)
        {
            if (i % resolution == 0)
            {
                points.push(this.points[i]);
            }
        }
        
        return points;
    }

    /**
     * @param {Number} resolution 
     * @param {Number} width 
     * @param {Number} height 
     */
    sampleToProfile(resolution, width, height)
    {
        let projection = new Projection({ min: { x: 0, y: this.ele_min }, max: { x: this.total_distance, y: this.ele_max } }, { min: { x: 0, y: 0 }, max: { x: width, y: height } });
        let sample = this.sample(resolution).map(gpx_point => 
        {
            let { x, y } = projection.transform({ x: gpx_point.total_distance, y: gpx_point.ele });
            return { x, y: height - y, point: gpx_point };
        });
        return sample;
    }

    /**
     * @param {Number} resolution 
     * @param {import("./Projection.js").Bounds2d} view_bounds 
     */
    sampleToMap(resolution, view_bounds)
    {
        let projection = new Projection(this.lon_lat_bounds, view_bounds);
        let sample = this.sample(resolution).map(gpx_point => this._sample(gpx_point, projection, view_bounds));
        return sample;
    }

    calculateGradient(sample)
    {
        let previous = sample[0];
        for (let i = 1; i < sample.length; i++)
        {
            let current = sample[i];
            current.gradient = Gpx.gradient(previous.point, current.point);
            previous = current;
        }
    }

    gradientColor(gradient)
    {
        if (gradient > 0)
        {
            let a = gradient * this.gradient_max_d;
            a = 1 - a;
            a = 1 - a * a;
            return `rgb(${Math.round(255 * a)}, 0, 128)`;
        }
        else
        {
            let a = gradient * this.gradient_min_d;
            a = 1 - a;
            a = 1 - a * a;
            return `rgb(0, ${255 * a}, 128)`;
        }
    }

    /**
     * @param {number} distance_delta
     * @returns {SplitItem[]}
     */
    split(distance_delta)
    {
        let cursor = new GpxCursor(this);
        let times = [];
        let distance = distance_delta;

        while (this.total_distance - distance > 0.0001)
        {
            let time = cursor.move(distance_delta);
            times.push(time);
            distance += distance_delta;
        }

        return times;
    }

    /**
     * @param {GpxPoint} gpx_point 
     * @param {Projection} projection 
     * @param {import("./Projection.js").Bounds2d} view_bounds 
     */
    _sample(gpx_point, projection, view_bounds)
    {
        let { x, y } = projection.transform({ x: gpx_point.lon, y: gpx_point.lat });
        let yd = (60 / this.total_distance) * gpx_point.total_distance - 30;
        return { x, y: view_bounds.max.y + view_bounds.min.y - y - yd, point: gpx_point };
    }

    /**
     * @param {Element} node 
     * @returns {GpxPoint}
     */
    static _createPoint(node)
    {
        let lat = parseFloat(node.getAttribute('lat'));
        let lon = parseFloat(node.getAttribute('lon'));
        let ele = parseFloat(node.getElementsByTagName('ele')[0].textContent);
        let time = new Date(node.getElementsByTagName('time')[0].textContent);
        let time_to_previous_point = 0;
        return { lat, lon, ele, node, total_distance: 0, distance_to_previous_point: 0, gradient: 0, time, time_to_previous_point };
    }

    static _greatCircleDistance(alon, alat, blon, blat) 
    {
        let dlat = Math.sin((blat - alat) / 2);
        let dlon = Math.sin((blon - alon) / 2);
        let r = Math.sqrt(dlat * dlat + Math.cos(alat) * Math.cos(blat) * dlon * dlon);
        return 2.0 * Math.asin(r);
    }

    static distance(a, b)
    {
        return 6378137 * Gpx._greatCircleDistance(a.lon * PI_DIV_180, a.lat * PI_DIV_180, b.lon * PI_DIV_180, b.lat * PI_DIV_180);
    }

    /**
     * @param {GpxPoint} a 
     * @param {GpxPoint} b 
     * @returns {Number}
     */
    static gradient(a, b)
    {
        let d = Gpx.distance(a, b);
        return d == 0 ? 0 : ((b.ele - a.ele) / d);
    }
}

class GpxCursor
{
    constructor(gpx)
    {
        /** @type {Gpx} */
        this.gpx = gpx;
        this.point_index = -1;
        this._nextPoint();
        this.distance_left_total = 0;
    }

    /**
     * @param {number} distance 
     * @returns {SplitItem}
     */
    move(distance)
    {
        let start = { point: this.point, distance_left: this.distance_left };
        let time = 0;

        while (distance > 0)
        {
            if (this.point.distance_to_previous_point == 0)
            {
                this._nextPoint();
            }
            else
            {
                if (distance < this.distance_left)
                {
                    this.distance_left -= distance;
                    time += (this.point.time_to_previous_point / this.point.distance_to_previous_point) * distance;
                    break;
                }
                else
                {
                    time += (this.point.time_to_previous_point / this.point.distance_to_previous_point) * this.distance_left;
                    distance -= this.distance_left;
                    this._nextPoint();
                }
            }
        }

        let end = { point: this.point, distance_left: this.distance_left };
        return { start, end, time };
    }

    _nextPoint()
    {
        this.point_index++;
        this.point = this.gpx.points[this.point_index];
        this.distance_left = this.point?.distance_to_previous_point;
        this.distance_left_total += this.distance_left ?? 0;
    }
}