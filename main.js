// @ts-check

import { formatDistance, formatTime } from "./js/Formatting.js";
import { Gpx } from "./js/Gpx.js";
import { MapControl } from "./js/MapControl.js";
import { ProfileControl } from "./js/ProfileControl.js";
import { kmph_to_mps, mps_to_kmph, SpeedCalculator } from "./js/SpeedCalculator.js";

async function onDOMContentLoaded()
{
    let powers_to_estimate = [...Array(10).keys()].map(i => 170 + i * 10);
    let profile_container = document.querySelector('#profile_container');
    let map_container = document.querySelector('#map_container');
    let time_estimation_container = document.querySelector('#time_estimation_container');
    let time_estimation_settings_apply_button = document.querySelector('#time_estimation_settings_apply_button');
    /** @type {HTMLInputElement} */
    let time_estimation_settings_input_total_weight = document.querySelector('#time_estimation_settings_input_total_weight');
    /** @type {HTMLInputElement} */
    let time_estimation_settings_input_rolling_resistance = document.querySelector('#time_estimation_settings_input_rolling_resistance');
    /** @type {HTMLInputElement} */
    let time_estimation_settings_input_drag_coefficient = document.querySelector('#time_estimation_settings_input_drag_coefficient');
    /** @type {HTMLInputElement} */
    let time_estimation_settings_input_wind_speed = document.querySelector('#time_estimation_settings_input_wind_speed');
    /** @type {HTMLInputElement} */
    let time_estimation_settings_input_loss = document.querySelector('#time_estimation_settings_input_loss');
    let gpx = await Gpx.load('Evening_Ride.gpx');
    let profile = new ProfileControl(gpx);
    /** @type {SpeedCalculator} */
    let speed_calculator;

    function getSettings()
    {
        return {
            total_weight: parseFloat(time_estimation_settings_input_total_weight.value),
            rolling_resistance: parseFloat(time_estimation_settings_input_rolling_resistance.value),
            drag_coefficient: parseFloat(time_estimation_settings_input_drag_coefficient.value),
            air_density: 1.22601,
            loss: parseFloat(time_estimation_settings_input_loss.value),
            wind_speed: kmph_to_mps(time_estimation_settings_input_wind_speed.value)
        };
    }
    // function onProfileResolutionChanged()
    // {
    //     profile.draw(parseInt(profile_resolution_input.value));
    // }

    // profile_resolution_input.addEventListener('change', onProfileResolutionChanged);
    profile_container.appendChild(profile.canvas);
    let map = new MapControl(gpx, map_container.clientWidth, map_container.clientHeight);
    
    map_container.appendChild(map.canvas);

    function handleProfileContainerScroll()
    {
        map._selection.from = profile.canvas_to_distance_projection.transform({ x: profile_container.scrollLeft, y: 1 }).x;
        map._selection.to = map._selection.from + profile.canvas_to_distance_projection.transform({ x: profile_container.clientWidth, y: 1 }).x;
        map.selection = map._selection;
    }

    function handleWindowResize()
    {
        map.resize(map_container.clientWidth, map_container.clientHeight);
        // var map2 = new ol.Map({
        //     target: 'map2',
        //     layers: [
        //       new ol.layer.Tile({
        //         source: new ol.source.OSM()
        //       })
        //     ],
        //     view: new ol.View({
        //       center: ol.proj.fromLonLat([37.41, 8.82]),
        //       zoom: 4
        //     })
        //   });
    }

    profile_container.addEventListener('scroll', handleProfileContainerScroll);
    window.addEventListener('resize', handleWindowResize);

    /**
     * @param {MouseEvent} e 
     */
    function handleProfileMouseMove(e)
    {
        let offsetX = e.offsetX;
        let distance = profile.distanceAtOffset(offsetX);
        profile.selection = null;
        let selection = profile.pointsAtOffset(offsetX);
        let speed_estimation = powers_to_estimate.map(power => ({ speed: speed_calculator.calculate(selection.current.point.gradient * 100, power), power }));

        window['profile_coursor_distance'].innerText = formatDistance(distance);
        window['profile_coursor_gradient'].innerText = `${(selection.current.point.gradient * 100).toFixed(1)}%`;
        window['profile_coursor_length'].innerText = formatDistance(selection.current.point.distance_to_previous_point);
        window['profile_coursor_estimated_speed'].innerHTML = speed_estimation.map(({ power, speed }) => `${mps_to_kmph(speed).toFixed(1)} kmph with ${power}W`).join("<br/>");
        // //window['profile_coursor_start_elevation'].innerText = this._formatDistance(points.previous.point.ele);
        // //window['profile_coursor_end_elevation'].innerText = this._formatDistance(points.current.point.ele);
        // //window['profile_coursor_elevation_difference'].innerText = this._formatDistance(points.current.point.ele - points.previous.point.ele);
        // document.title = `${selection.index}`;

        profile.selection = selection;
    }

    profile.canvas.addEventListener('mousemove', e => handleProfileMouseMove(e));
    
    function handleSettingsChanged(e)
    {
        speed_calculator = new SpeedCalculator(getSettings());
        time_estimation_container.innerHTML = '';

        for (let power of powers_to_estimate)
        {
            let total_time = 0;
        
            for (let point of gpx.points) 
            {
                if (point.distance_to_previous_point > 0)
                {
                    let speed = speed_calculator.calculate(point.gradient * 100, power);
                    total_time += point.distance_to_previous_point / speed;
                }
            }
        
            let tr = document.createElement('tr');
            tr.innerHTML = `<td>${power}W</td><td>${formatTime(total_time)}</td>`;
            time_estimation_container.appendChild(tr);
        }
    }

    time_estimation_settings_apply_button.addEventListener('click', handleSettingsChanged);
    handleSettingsChanged();
}

document.addEventListener("DOMContentLoaded", onDOMContentLoaded);

//https://www.gribble.org/cycling/power_v_speed.html
//https://www.omnicalculator.com/sports/cycling-wattage