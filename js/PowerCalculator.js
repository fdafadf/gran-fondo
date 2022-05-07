// @ts-check

export class PowerCalculator
{
    static G = 9.80665;

    static ROLLING_RESISTANCES = 
    {
        Concrete: { Slick: 0.0020, Knobby: 0.0025 },
        Asphalt: { Slick: 0.0050, Knobby: 0.0063 },
        Gravel: { Slick: 0.0060, Knobby: 0.0076 },
        Grass: { Slick: 0.0070, Knobby: 0.0089 },
        OffRoad: { Slick: 0.0200, Knobby: 0.0253 },
        Sand: { Slick: 0.0300, Knobby: 0.0380 }
    }

    static DRAG_COEFFICIENT =
    {
        Tops: 0.408,
        Hoods: 0.324,
        Drops: 0.307,
        Aerobars: 0.2914
    }

    static calculate(slope, mass, rolling_resistance, drag_coefficient, air_density, speed, wind_speed, loss)
    {
        return (PowerCalculator.fg(slope, mass) + PowerCalculator.fr(slope, mass, rolling_resistance) + PowerCalculator.fa(drag_coefficient, air_density, speed, wind_speed)) * speed / (1 - loss)
    }

    static fg(slope, mass)
    {
        return PowerCalculator.G * Math.sin(Math.atan(slope)) * mass;
    }

    static fr(slope, mass, rolling_resistance)
    {
        return PowerCalculator.G * Math.cos(Math.atan(slope)) * mass * rolling_resistance;
    }

    static fa(drag_coefficient, air_density, speed, wind_speed)
    {
        return 0.5 * drag_coefficient * air_density * Math.pow(speed + wind_speed, 2);
    }
}