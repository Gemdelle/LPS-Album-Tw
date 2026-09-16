export function firstPetId(id: unknown) {
    const match = String(id ?? "").match(/\d+/);
    return match ? match[0] : "";
}

export function petImageSrc(id: unknown) {
    const firstId = firstPetId(id);
    return firstId ? `${process.env.PUBLIC_URL}/Images/${firstId}.jpg` : "";
}
