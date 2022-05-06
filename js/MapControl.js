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
        this.selection = { from: 0, to: 10000 };
        this.resize(width, height);
    }

    draw()
    {
        let context = this.context;
        context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
        let previous = this.path[0];

        for (let i = 1; i < this.path.length; i++)
        {
            let current = this.path[i];
            let is_previous_selected = previous.point.total_distance > this.selection.from && previous.point.total_distance < this.selection.to;
            let is_current_selected = current.point.total_distance > this.selection.from && current.point.total_distance < this.selection.to;

            if (is_previous_selected && is_current_selected)
            {
                context.lineWidth = 5 + current.point.gradient * (current.point.gradient > 0 ? 200 : -200);
            }
            else
            {
                context.lineWidth = 2;
            }

            context.strokeStyle = this.gpx.gradientColor(current.point.gradient);
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