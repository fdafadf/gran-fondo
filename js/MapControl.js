// @ts-check

import { Gpx } from "./Gpx.js";
import { Projection } from "./Projection.js";

export class MapControl
{
    /**
     * @param {Gpx} gpx 
     */
    constructor(gpx, width, height)
    {
        this.gpx = gpx;
        this.canvas = document.createElement('canvas');
        // @ts-ignore
        this.buffer_canvas = new OffscreenCanvas(width, height);
        this.buffer_context = this.buffer_canvas.getContext('2d');
        this._selection = { from: 0, to: gpx.total_distance };
        /** @type {import("./Gpx.js").SplitItem} */
        this._selected_point = null;
        this.resize(width, height);
        this._draw(this.buffer_context);
        this.context.drawImage(this.buffer_canvas, 0, 0);
    }

    set selection(value)
    {
        this._selection = value;
        this._draw(this.buffer_context);
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
        this.context.drawImage(this.buffer_canvas, 0, 0);
    }

    set selected_point(value)
    {
        this._selected_point = value;
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
        this.context.drawImage(this.buffer_canvas, 0, 0);

        if (this._selected_point)
        {
            let projection = new Projection(this.gpx.lon_lat_bounds, this.bounds);
            let sample = this.gpx._sample(this._selected_point.end.point, projection, this.bounds);
            
            this.context.strokeStyle = 'red';
            this.context.beginPath();
            this.context.arc(sample.x, sample.y, 10, 0, 2 * Math.PI);
            this.context.stroke();
        }
    }

    _draw(context)
    {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        let previous = this.path[0];

        for (let i = 1; i < this.path.length; i++)
        {
            let current = this.path[i];
            let is_previous_selected = previous.point.total_distance > this._selection.from && previous.point.total_distance < this._selection.to;
            let is_current_selected = current.point.total_distance > this._selection.from && current.point.total_distance < this._selection.to;
            
            //a = 1 - a;
            //a = 1 - a * a;
                
            if (current.point.gradient > 0)
            {
                let a = current.point.gradient * this.gpx.gradient_max_d;
                context.lineWidth = 1 + a * 20;
            }
            else
            {
                let a = current.point.gradient * this.gpx.gradient_min_d;
                context.lineWidth = 1 + a * 20;
            }

            if (is_previous_selected && is_current_selected)
            {
                context.globalAlpha = 1;
                context.shadowBlur = context.lineWidth;
            }
            else
            {
                context.globalAlpha = 0.2;
                context.shadowBlur = 0;
            }

            context.strokeStyle = this.gpx.gradientColor(current.point.gradient);
            context.shadowColor = context.strokeStyle;
            context.beginPath();
            context.moveTo(previous.x, previous.y);
            context.lineTo(current.x, current.y);
            context.stroke();
            //let projection.transform(points[i]);
            previous = current;
        }
    }

    resize(width, height)
    {
        this.canvas.width = width;
        this.canvas.height = height;
        this.projection = new Projection(this.gpx.lon_lat_bounds, this.bounds);
        this.context = this.canvas.getContext('2d');
        this.path = this.gpx.sampleToMap(1, this.bounds);
    }

    /** @returns {import("./Projection.js").Bounds2d} */
    get bounds()
    {
        return { min: { x: 20, y: 20 }, max: { x: this.canvas.width - 40, y: this.canvas.height - 40 } };
    }
    
}