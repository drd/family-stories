export function numeric(hopeful) {
    const cast = parseInt(hopeful, 10);
    if (isNaN(cast)) {
        throw new Error("Invalid number: " + hopeful);
    }
    return cast;
}
