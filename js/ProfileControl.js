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
        this.canvas.addEventListener('mousemove', e => this._handleMouseMove(e));
        this.canvas_to_distance_projection = new Projection(this.bounds, { min: { x: 0, y: 1 }, max: { x: this.gpx.total_distance, y: 1 } });
        this.path = gpx.sampleToProfile(1, this.canvas.width, this.canvas.height);
        this._draw(this.buffer_context);
        this.context.drawImage(this.buffer_canvas, 0, 0);
    }

    get bounds()
    {
        return { min: { x: 0, y: 0 }, max: { x: this.canvas.width, y: this.canvas.height } };
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

    /**
     * @param {MouseEvent} e 
     */
     _handleMouseMove(e)
    {
        let offsetX = e.offsetX;
        let distance = this.distanceAtOffset(offsetX);
        
        if (this.selection)
        {
            let context = this.context;
            let s_x = this.selection.previous.x;
            let s_w = this.selection.current.x - this.selection.previous.x;
            let s_h = context.canvas.height;
            context.clearRect(s_x, 0, s_w, s_h);
            context.drawImage(this.buffer_canvas, s_x, 0, s_w, s_h, s_x, 0, s_w, s_h);
        }

        this.selection = this.pointsAtOffset(offsetX);

        window['profile_coursor_distance'].innerText = this._formatDistance(distance);
        window['profile_coursor_gradient'].innerText = `${(this.selection.current.point.gradient * 100).toFixed(1)}%`;
        window['profile_coursor_length'].innerText = this._formatDistance(this.selection.current.point.distance_to_previous_point);
        //window['profile_coursor_start_elevation'].innerText = this._formatDistance(points.previous.point.ele);
        //window['profile_coursor_end_elevation'].innerText = this._formatDistance(points.current.point.ele);
        //window['profile_coursor_elevation_difference'].innerText = this._formatDistance(points.current.point.ele - points.previous.point.ele);

        let context = this.context;
        let s_x = this.selection.previous.x;
        let s_w = this.selection.current.x - this.selection.previous.x;
        let s_h = context.canvas.height;

        //context.clearRect(this.selection.previous.x, 0, this.selection.current.x - this.selection.previous.x, context.canvas.height);
        context.fillStyle = '#ddeeff'; //this.gpx.gradientColor(points.current.point.gradient);
        context.beginPath();
        context.moveTo(Math.round(this.selection.previous.x), 0);
        context.lineTo(Math.round(this.selection.current.x), 0);
        context.lineTo(Math.round(this.selection.current.x), context.canvas.height);
        context.lineTo(Math.round(this.selection.previous.x), context.canvas.height);
        context.closePath();
        context.fill();
        context.drawImage(this.buffer_canvas, s_x, 0, s_w, s_h, s_x, 0, s_w, s_h);
    }

    _formatDistance(distance)
    {
        let distance_km = Math.floor(distance / 1000);
        let distance_m = Math.floor(distance) % 1000;
        let distance_km_text = distance_km > 0 ? `${distance_km} km` : '';
        let distance_m_text = `${distance_m} m`;
        return [distance_km_text, distance_m_text].join(' ');
    }
}
