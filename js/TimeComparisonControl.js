// @ts-check

import { Gpx } from "./Gpx.js";

/**
 * @typedef {{ delta: number, total: number, reference: import("./Gpx.js").SplitItem, difference: import("./Gpx.js").SplitItem }} TimeComparisonDataItem
 */

 export class TimeComparisonControl
 {
    /**
     * @param {number} width 
     * @param {number} height 
     * @param {TimeComparisonDataItem[]} data 
     */
    constructor(width, height, data)
    {
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.context = this.canvas.getContext('2d');
        // @ts-ignore
        this.buffer_canvas = new OffscreenCanvas(width, height);
        this.buffer_context = this.buffer_canvas.getContext('2d');
        /** @type {TimeComparisonDataItem[]} */
        this.data = data;
        this.context.drawImage(this.buffer_canvas, 0, 0);
     }
 
    /** @param {TimeComparisonDataItem[]} value */
    set data(value)
    {
        /** @type {TimeComparisonDataItem[]} */
        this._data = value;
        TimeComparisonControl._drawData(this.buffer_context, value);
    }
 
    set selected_data_item_index(value)
    {
        if (this._selected_data_item_index)
        {
            let x_delta = this.context.canvas.width / this._data.length;
            let context = this.context;
            let s_x = Math.round(this._selected_data_item_index * x_delta) - 1;
            let s_w = Math.round(x_delta) + 2;
            let s_h = context.canvas.height;
            context.clearRect(s_x, 0, s_w, s_h);
            context.drawImage(this.buffer_canvas, s_x, 0, s_w, s_h, s_x, 0, s_w, s_h);
        }
        
        if (value)
        {
            this._selected_data_item_index = value;
            let x_delta = this.context.canvas.width / this._data.length;
            let context = this.context;
            let s_x = Math.round(this._selected_data_item_index * x_delta) - 1;
            let s_w = Math.round(x_delta) + 2;
            let s_h = context.canvas.height;
            context.fillStyle = '#ddeeff';
            context.fillRect(s_x, 0, s_w, s_h);
            context.drawImage(this.buffer_canvas, s_x, 0, s_w, s_h, s_x, 0, s_w, s_h);
        }
    }

    resize(width, height)
    {
        this.canvas.width = width;
        this.canvas.height = height;
        this.buffer_canvas.width = width;
        this.buffer_canvas.height = height;
        TimeComparisonControl._drawData(this.buffer_context, this._data);
        this.context.drawImage(this.buffer_canvas, 0, 0);
    }

    /**
     * @param {CanvasRenderingContext2D} context 
     * @param {TimeComparisonDataItem[]} data 
     */
    static _drawData(context, data)
    {
        let delta_min = Math.min.apply(Math, data.map(item => item.delta));
        let delta_max = Math.max.apply(Math, data.map(item => item.delta));
        let delta_abs_max = 5000; //Math.max(Math.abs(delta_max), Math.abs(delta_min));
        let total_min = Math.min(0, Math.min.apply(Math, data.map(item => item.total)));
        let total_max = Math.max(0, Math.max.apply(Math, data.map(item => item.total)));
        let total_delta = context.canvas.height / (total_max - total_min);
        let x_delta = context.canvas.width / data.length;
        let x = 0;
        
        for (let i = 0; i < data.length; i++)
        {
            let h = (data[i].total - total_min) * total_delta;
            let color = (255 / delta_abs_max) * data[i].delta;
            let blue = Math.round(128 - color / 2);
            context.fillStyle = color > 0 ? `rgb(0, ${Math.round(color)}, ${blue})` : `rgb(${Math.round(-color)}, 0, ${blue})`;
            context.fillRect(x, context.canvas.height - h, x_delta, h);
            x += x_delta;
        }

        context.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        
        for (let i = 0; i < total_max; i += 60 * 1000)
        {
            let h = (i - total_min) * total_delta;
            let y = Math.round(context.canvas.height - h);
            context.beginPath();
            context.moveTo(35, y + 0.5);
            context.lineTo(context.canvas.width, y + 0.5);
            context.stroke();
            context.fillText(`${Math.round(i / (60 * 1000))} min`, 3, y + 3);
        }

        // this.context.strokeStyle = 'black';
        // this.context.beginPath();
        // this.context.moveTo(0 , this.canvas.height);
    
        // for (let i = 1; i < this.canvas.width; i += 2)
        // {
        //     let y = this.canvas.height - (this.data[i].total - total_min) * total_delta;
        //     this.context.lineTo(i, y);
        // }
    
        // this.context.stroke();
    }
 }

 
 export class TimeComparison
 {
    /**
     * @param {Gpx} reference_gpx 
     * @param {Gpx} difference_gpx 
     */
    constructor(reference_gpx, difference_gpx)
    {
        this.reference_gpx = reference_gpx;
        this.difference_gpx = difference_gpx;
    }

    timeDifferences(probes)
    {
        let distance = Math.min(this.reference_gpx.total_distance, this.difference_gpx.total_distance);
        let distance_delta = distance / probes;
        let reference_splited = this.reference_gpx.split(distance_delta);
        let difference_splited = this.difference_gpx.split(distance_delta);
        let length = Math.min(reference_splited.length, difference_splited.length);
        let time_a = 0;
        let time_b = 0;
        let time_differences = [];
    
        for (let i = 0; i < length; i++)
        {
            let reference = reference_splited[i];
            let difference = difference_splited[i];
            time_a += reference.time;
            time_b += difference.time;
            let total = time_b - time_a;
            let delta = difference_splited[i].time - reference_splited[i].time;
            time_differences.push({ total, delta, reference, difference });
        }

        return time_differences;
    }
 }
 