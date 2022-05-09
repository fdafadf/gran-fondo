// @ts-check

import { formatDistance } from "./Formatting.js";
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
        [95, 150, 207, 236, 258, 276, 288, 298, 316, 326, 411, 443, 461, 483, 497, 548, 632, 658, 768, 797, 858, 893, 897, 917, 936, 945, 953, 961, 973, 999, 1005, 1055, 1077, 1087, 1100, 1132, 1137, 1138, 1148, 1151, 1156, 1160, 1184, 1192, 1205, 1255, 1258, 1306, 1310, 1326, 1342, 1376, 1384, 1396, 1398, 1508, 1513, 1516, 1522, 1536, 1544, 1550, 1585, 1626, 1639, 1706, 1717, 1773, 1822, 1832, 1875, 1905, 1911, 1982, 2032, 2037, 2074, 2078, 2091, 2107, 2112, 2159, 2161, 2208, 2224, 2234, 2269, 2302, 2318, 2334, 2339, 2362, 2396, 2405, 2418, 2489, 2518, 2605, 2656, 2682, 2692, 2713, 2740, 2841, 2849, 2899, 2905, 2925, 2952, 3063, 3088].forEach(i => this.path[i]['isEdge'] = true);
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
            let s_x = Math.round(this._selection.previous.x) - 1;
            let s_w = Math.round(this._selection.current.x - this._selection.previous.x) + 2;
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
        let index = 0;

        for (index = 1; index < this.path.length; index++)
        {
            current = this.path[index];
            if (current.x > x) break;
            previous = current;
        }

        return { previous, current, index };
    }
    
    /**
     * @param {CanvasRenderingContext2D} context 
     */
    _draw(context)
    {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        let previous = this.path[0];
        let previous_edge = this.path[0];
        
        for (let i = 1; i < this.path.length; i++)
        {
            let current = this.path[i];
            
            if (current['isEdge'])
            {
                context.strokeStyle = '#ccc550';
                context.lineWidth = 1;
                context.textAlign = 'center';
                context.beginPath();
                context.moveTo(Math.round(current.x) + 0.5, 0);
                context.lineTo(Math.round(current.x) + 0.5, context.canvas.height);
                context.stroke();
            }

            if (current.point.distance_to_previous_point > 0)
            {
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

            if (current['isEdge'])
            {
                let text_x = previous_edge.x + ((current.x - previous_edge.x) / 2);
                let distance_text = formatDistance(current.point.total_distance - previous_edge.point.total_distance);
                let gradient = Gpx.gradient(previous_edge.point, current.point);
                let gradient_text = `${(gradient * 100).toFixed(1)}%`;
                context.fillStyle = this.gpx.gradientColor(gradient);
                context.strokeStyle = context.fillStyle;
                context.lineWidth = 3;
                context.strokeStyle = "#fffff5";
                context.shadowColor = "#fffff5";
                context.shadowBlur = 5;
                context.strokeText(distance_text, text_x, 10);
                context.strokeText(gradient_text, text_x, 20);
                context.shadowBlur = 0;
                context.fillText(distance_text, text_x, 10);
                context.fillText(gradient_text, text_x, 20);
                previous_edge = current;
            }
        }
    }
}
