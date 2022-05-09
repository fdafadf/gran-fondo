// @ts-check

import { PowerCalculator } from "./PowerCalculator.js";

export let kmph_to_mps = v => (v * 1000) / (60 * 60);
export let mps_to_kmph = v => (v * 60 * 60) / 1000;

export class SpeedCalculator
{
    constructor({ total_weight, rolling_resistance, drag_coefficient, air_density, wind_speed, loss })
    {
        /** @type {Map<number, Map<number, { speed: number, error: number }>>} */
        this.dict = new Map();

        for (let slope = -500; slope < 500; slope += 1)
        {
            let slope_dict = new Map();
        
            for (let speed = 20; speed < 1000; speed += 1)
            {
                let speed_in_mps = kmph_to_mps(speed / 10);
                let power = PowerCalculator.calculate(slope / 1000, total_weight, rolling_resistance, drag_coefficient, air_density, speed_in_mps, wind_speed, loss);
                let key = Math.round(power / 10);
                let error = Math.abs(power - key * 10);
        
                if (power > 99 && power < 301)
                {
                    if (slope_dict.has(key) == false || error < slope_dict.get(key).error)
                    {
                        slope_dict.set(key, { speed: speed_in_mps, error });
                    }
                }
            }

            this.dict.set(slope, slope_dict);
        }
    }

    calculate(slope, power)
    {
        if (slope < -10) return 11;
        return Math.min(this.dict.get(Math.round(slope * 10)).get(Math.round(power / 10)).speed, 11);
    }
}