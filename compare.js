// @ts-check

import { formatDistance, formatTimeMS } from "./js/Formatting.js";
import { Gpx } from "./js/Gpx.js";
import { MapControl } from "./js/MapControl.js";
import { TimeComparison, TimeComparisonControl } from "./js/TimeComparisonControl.js";

async function onDOMContentLoaded()
{

    let profile_container = document.querySelector('#profile_container');
    let map_container = document.querySelector('#map_container');
    let time_comparison_container = document.querySelector('#time_comparison_container');
    let info_time_difference_total = document.querySelector('#info_time_difference_total');
    let info_time_difference_segment = document.querySelector('#info_time_difference_segment');
    let info_distance = document.querySelector('#info_distance');
    let reference_gpx = await Gpx.load('reference.gpx');
    let difference_gpx = await Gpx.load('difference.gpx');
    let map = new MapControl(reference_gpx, map_container.clientWidth, map_container.clientHeight);
    map_container.appendChild(map.canvas);

    let time_comparison = new TimeComparison(reference_gpx, difference_gpx);
    let time_differences = time_comparison.timeDifferences(time_comparison_container.clientWidth / 5);
    time_comparison.timeDifferences(10);
    let time_comparison_control = new TimeComparisonControl(time_comparison_container.clientWidth, time_comparison_container.clientHeight, time_differences);
    time_comparison_container.appendChild(time_comparison_control.canvas);
    
    /**
     * @param {MouseEvent} e 
     */
    function handleTimeComparisonMouseMove(e)
    {
        let index = Math.floor(e.offsetX / (time_comparison_control.canvas.clientWidth / time_comparison_control._data.length));
        time_comparison_control.selected_data_item_index = index;
        let item = time_comparison_control._data[index];
        info_time_difference_total.textContent = `${formatTimeMS(item.total)}`;
        info_time_difference_segment.textContent = `${formatTimeMS(item.delta)}`;
        info_distance.textContent = formatDistance(item.reference.end.point.total_distance);
        map.selected_point = item.reference;
    }

    time_comparison_control.canvas.addEventListener('mousemove', e => handleTimeComparisonMouseMove(e));
    
    function handleWindowResize()
    {
        time_comparison_control.resize(time_comparison_container.clientWidth, time_comparison_container.clientHeight);
        map.resize(map_container.clientWidth, map_container.clientHeight);
    }

    window.addEventListener('resize', handleWindowResize);
}

document.addEventListener("DOMContentLoaded", onDOMContentLoaded);