import { Gpx } from "./Gpx.js";

export class GpxPainter
{
    /**
     * @param {CanvasRenderingContext2D} context 
     * @param {Gpx} gpx 
     */
    constructor(context, gpx, points)
    {
        this.context = context;
        this.gpx = gpx;
        this.total_distance = points[points.length - 1].total_distance - points[0].total_distance;
        this.width_d = context.canvas.width / this.total_distance;
        this.height_d = context.canvas.height / (gpx.ele_max - gpx.ele_min);
        this.points = points.map(p => this._translate(p));
        
        let prevoius_point = this.points[0];
        prevoius_point.gradient = 0;
        
        for (let i = 1; i < this.points.length; i++)
        {
            let current_point = this.points[i];
            current_point.gradient = Gpx.gradient(prevoius_point.point, current_point.point);
            prevoius_point = current_point;
        }

        this.gradient_min = Math.min.apply(Math, this.points.map(p => p.gradient));
        this.gradient_max = Math.max.apply(Math, this.points.map(p => p.gradient));
        this.gradient_max_d = 255 / this.gradient_max;
        this.gradient_min_d = 255 / this.gradient_min;
    }

    drawProfile()
    {
        let context = this.context;
        let previous_point = this.points[0];
        
        for (let i = 1; i < this.points.length; i++)
        {
            let current_point = this.points[i];

            if (current_point.point.distance_to_previous_point < 1) continue;
            
            let gradient = Gpx.gradient(previous_point.point, current_point.point);
            // context.beginPath();
            // context.moveTo(prev_point.x, prev_point.y);
            // context.lineTo(current_point.x, current_point.y);
            // context.stroke();
            // context.strokeStyle =
    
            context.fillStyle = this._gradientColor(gradient);
            context.beginPath();
            context.moveTo(previous_point.x, previous_point.y);
            context.lineTo(current_point.x, current_point.y);
            context.lineTo(current_point.x, context.canvas.height);
            context.lineTo(previous_point.x, context.canvas.height);
            context.closePath();
            context.fill();
    
            previous_point = current_point;
        }
    }
    
    drawPath(points)
    {

    }

    
    /** @param {{ lat: number, lon: number, ele: number }} point */
    _translate(point)
    {
        let x = this.width_d * point.total_distance;
        let y = this.height_d * (this.context.canvas.height - (point.ele - this.gpx.ele_min));
        return { x, y, point };
    }
}