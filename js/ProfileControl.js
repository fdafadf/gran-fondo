// @ts-check

import { Gpx } from "./Gpx.js";
import { Projection } from "./Projection.js";

export class ProfileControl 
{
    /**
     * @param {Gpx} gpx 
     */
    constructor(gpx)
    {
        this.gpx = gpx;
        this.canvas = document.createElement('canvas');
        this.canvas.width = gpx.points.length * 10;
        this.canvas.height = 200;
        /** @type {CanvasRenderingContext2D} */
        this.context = this.canvas.getContext('2d');
        // @ts-ignore
        this.buffer_canvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
        this.buffer_context = this.buffer_canvas.getContext('2d');
        this.canvas_to_distance_projection = new Projection(this.bounds, { min: { x: 0, y: 1 }, max: { x: this.gpx.total_distance, y: 1 } });
        this.path = gpx.sampleToProfile(1, this.canvas.width, this.canvas.height);
        this._draw(this.buffer_context);
        this.context.drawImage(this.buffer_canvas, 0, 0);
    }

    get bounds()
    {
        return { min: { x: 0, y: 0 }, max: { x: this.canvas.width, y: this.canvas.height } };
    }

    set selection(value)
    {
        if (this._selection)
        {
            let context = this.context;
            let s_x = this._selection.previous.x;
            let s_w = this._selection.current.x - this._selection.previous.x;
            let s_h = context.canvas.height;
            context.clearRect(s_x, 0, s_w, s_h);
            context.drawImage(this.buffer_canvas, s_x, 0, s_w, s_h, s_x, 0, s_w, s_h);
        }

        if (value)
        {
            let context = this.context;
            let s_x = value.previous.x;
            let s_w = value.current.x - value.previous.x;
            let s_h = context.canvas.height;
            context.fillStyle = '#ddeeff';
            context.beginPath();
            context.moveTo(Math.round(value.previous.x), 0);
            context.lineTo(Math.round(value.current.x), 0);
            context.lineTo(Math.round(value.current.x), context.canvas.height);
            context.lineTo(Math.round(value.previous.x), context.canvas.height);
            context.closePath();
            context.fill();
            context.drawImage(this.buffer_canvas, s_x, 0, s_w, s_h, s_x, 0, s_w, s_h);

        }

        this._selection = value;
    }

    distanceAtOffset(x)
    {
        return this.canvas_to_distance_projection.transform({ x, y: 1 }).x;
    }

    pointsAtOffset(x)
    {
        let previous = this.path[0];
        let current;

        for (let i = 1; i < this.path.length; i++)
        {
            current = this.path[i];
            if (current.x > x) break;
            previous = current;
        }

        return { previous, current };
    }
    
    _draw(context)
    {
        //context.fillStyle = '#fffff5';
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        let previous = this.path[0];
        
        for (let i = 1; i < this.path.length; i++)
        {
            let current = this.path[i];
            if (current.point.distance_to_previous_point < 1) continue;
            context.fillStyle = this.gpx.gradientColor(current.point.gradient);
            context.beginPath();
            context.moveTo(Math.round(previous.x), Math.round(previous.y));
            context.lineTo(Math.round(current.x), Math.round(current.y));
            context.lineTo(Math.round(current.x), context.canvas.height);
            context.lineTo(Math.round(previous.x), context.canvas.height);
            context.closePath();
            context.fill();
            previous = current;
        }
    }
}
