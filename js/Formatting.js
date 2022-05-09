export function formatDistance(distance)
{
    let distance_km = Math.floor(distance / 1000);
    let distance_m = Math.floor(distance) % 1000;
    let distance_km_text = distance_km > 0 ? `${distance_km} km` : '';
    let distance_m_text = `${distance_m} m`;
    return [distance_km_text, distance_m_text].join(' ');
}

export function formatTime(time)
{
    let minutes = Math.round(time / 60);
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};