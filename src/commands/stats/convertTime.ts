import formatDuration from "format-duration";

export function convertToReadableTime(time : string) {
    const ms = parseInt(time);
    const formattedTime = formatDuration(ms);

    switch (formattedTime.split(":").length) {
        case 2:
            return formattedTime + " min"
        case 3:
            return formattedTime + " hrs"
        case 4:
            return formattedTime + " days"
        default:
            break;
    }

    return formattedTime;
}

