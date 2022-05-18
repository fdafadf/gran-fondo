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

export function formatTimeMS(time)
{
    let total_seconds = Math.abs(Math.round(time / 1000));
    let seconds = total_seconds % 60;
    let minutes = Math.floor(total_seconds / 60);
    let result = `${minutes}m ${seconds}s`;
    if (time < 0) result = "- " + result;
    return result;
};
