export interface Serializer<T = unknown> {
    serializeInput?(data: unknown): Partial<T> | unknown;
    serializeOutput(data: Partial<T>): unknown;
}
