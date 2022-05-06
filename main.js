// @ts-check

import { Gpx } from "./js/Gpx.js";
import { MapControl } from "./js/MapControl.js";
import { ProfileControl } from "./js/ProfileControl.js";

async function onDOMContentLoaded()
{
    let profile_container = document.querySelector('#profile_container');
    let map_container = document.querySelector('#map_container');
    let gpx = await Gpx.load('Evening_Ride.gpx');
    let profile = new ProfileControl(gpx);

    // function onProfileResolutionChanged()
    // {
    //     profile.draw(parseInt(profile_resolution_input.value));
    // }

    // profile_resolution_input.addEventListener('change', onProfileResolutionChanged);
    profile_container.appendChild(profile.canvas);
    let map = new MapControl(gpx, map_container.clientWidth, map_container.clientHeight);
    map.draw();
    map_container.appendChild(map.canvas);

    function handleProfileContainerScroll()
    {
        map.selection.from = profile.canvas_to_distance_projection.transform({ x: profile_container.scrollLeft, y: 1 }).x;
        map.selection.to = map.selection.from + profile.canvas_to_distance_projection.transform({ x: profile_container.clientWidth, y: 1 }).x;
        map.draw();
    }

    function handleWindowResize()
    {
        map.resize(map_container.clientWidth, map_container.clientHeight);
        map.draw();
    }

    profile_container.addEventListener('scroll', handleProfileContainerScroll);
    window.addEventListener('resize', handleWindowResize);
}

document.addEventListener("DOMContentLoaded", onDOMContentLoaded);